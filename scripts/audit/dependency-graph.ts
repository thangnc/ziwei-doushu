/**
 * Read-only dependency-graph audit (Phase 0 / D4). Modifies nothing, enforces nothing.
 *
 * For every module that imports 'server-only' and every engine rule module, reports three separate states:
 *   - reachable-from-client-source: a 'use client' module transitively VALUE-imports it (type-only imports are erased
 *     and excluded), including through components no route renders.
 *   - reachable-from-route: some app/** route entry (page/layout/route/sitemap/robots…) transitively value-imports it.
 *     (Runtime reachability additionally needs D2's interaction walkthrough; this is the static half.)
 *   - included-in-client-bundle: decided separately from `next build` output (see --bundle).
 *
 * Usage: npx tsx scripts/audit/dependency-graph.ts [--json] [--bundle]
 *   --bundle  search .next/static/** (after `next build`) for string-literal markers of each audited module.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const ROOT = path.resolve(__dirname, '../..');
const SRC_DIRS = ['app', 'components', 'lib'];
const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

/** Engine rule/detection modules audited even if they don't import 'server-only'. */
const RULE_MODULES = ['lib/ziwei/patterns.ts', 'lib/ziwei/famous.ts', 'lib/ziwei/heming-knowledge.ts', 'lib/ziwei/db-analysis.ts'];

interface Edge { to: string; kind: 'value' | 'type' | 'dynamic' | 'reexport' | 'side-effect'; spec: string; line: number }
interface ModuleInfo { file: string; client: boolean; serverOnly: boolean; edges: Edge[]; unresolved: string[] }

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXTS.includes(path.extname(p)) && !p.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

function resolveSpec(fromFile: string, spec: string): string | null {
  let base: string | null = null;
  if (spec.startsWith('@/')) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // bare package
  const candidates = [base, ...EXTS.map((e) => base + e), ...EXTS.map((e) => path.join(base!, 'index' + e))];
  for (const c of candidates) if (existsSync(c) && statSync(c).isFile()) return path.relative(ROOT, c);
  return `UNRESOLVED:${spec}`;
}

function analyse(fileAbs: string): ModuleInfo {
  const text = readFileSync(fileAbs, 'utf8');
  const sf = ts.createSourceFile(fileAbs, text, ts.ScriptTarget.Latest, true, fileAbs.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const rel = path.relative(ROOT, fileAbs);
  const info: ModuleInfo = { file: rel, client: false, serverOnly: false, edges: [], unresolved: [] };
  // directive prologue
  for (const st of sf.statements) {
    if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression)) {
      if (st.expression.text === 'use client') info.client = true;
    } else break;
  }
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart()).line + 1;
  const add = (spec: string, kind: Edge['kind'], node: ts.Node) => {
    if (spec === 'server-only') { info.serverOnly = true; return; }
    const to = resolveSpec(fileAbs, spec);
    if (to === null) return;
    if (to.startsWith('UNRESOLVED:')) info.unresolved.push(spec);
    info.edges.push({ to, kind, spec, line: lineOf(node) });
  };
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const spec = node.moduleSpecifier.text;
      const clause = node.importClause;
      if (!clause) add(spec, 'side-effect', node);
      else {
        const allTypeNamed = !!clause.namedBindings && ts.isNamedImports(clause.namedBindings) &&
          clause.namedBindings.elements.length > 0 && clause.namedBindings.elements.every((e) => e.isTypeOnly) && !clause.name;
        add(spec, clause.isTypeOnly || allTypeNamed ? 'type' : 'value', node);
      }
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      add(node.moduleSpecifier.text, node.isTypeOnly ? 'type' : 'reexport', node);
    } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg)) add(arg.text, 'dynamic', node);
      else info.unresolved.push(`<non-literal dynamic import at line ${lineOf(node)}>`);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      add(node.argument.literal.text, 'type', node); // import('./x').T in type position
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return info;
}

const files = SRC_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const mods = new Map(files.map((f) => { const m = analyse(f); return [m.file, m] as const; }));

/** BFS over runtime edges (value, reexport, dynamic, side-effect); type edges are erased by TS and excluded. */
function reach(starts: string[]): Map<string, string[]> {
  const prev = new Map<string, string[]>();
  const queue = [...starts];
  for (const s of starts) prev.set(s, [s]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of mods.get(cur)?.edges ?? []) {
      if (e.kind === 'type' || prev.has(e.to) || !mods.has(e.to)) continue;
      prev.set(e.to, [...prev.get(cur)!, `${e.to} (${e.kind} @${cur}:${e.line})`]);
      queue.push(e.to);
    }
  }
  return prev;
}

const clientModules = [...mods.values()].filter((m) => m.client).map((m) => m.file);
const ROUTE_FILE = /^app\/(.*\/)?(page|layout|route|template|loading|error|not-found|default)\.(t|j)sx?$|^app\/(sitemap|robots|manifest)\.(t|j)s$/;
const routeEntries = [...mods.keys()].filter((f) => ROUTE_FILE.test(f));

// Per client module: what it reaches. Then invert for audited targets.
const audited = [...new Set([...[...mods.values()].filter((m) => m.serverOnly).map((m) => m.file), ...RULE_MODULES.filter((f) => mods.has(f))])];
const routeReach = reach(routeEntries);

interface Report {
  module: string; importsServerOnly: boolean;
  reachableFromClientSource: { client: string; path: string[] }[];
  reachableFromRoute: string[] | null;
  typeOnlyImporters: string[];
  bundleMarkers?: { marker: string; foundIn: string[] }[];
}
const reports: Report[] = audited.map((target) => {
  const viaClient: Report['reachableFromClientSource'] = [];
  for (const c of clientModules) {
    const r = reach([c]);
    if (r.has(target)) viaClient.push({ client: c, path: r.get(target)! });
  }
  const typeOnlyImporters = [...mods.values()].filter((m) => m.edges.some((e) => e.to === target && e.kind === 'type')).map((m) => m.file);
  return {
    module: target,
    importsServerOnly: mods.get(target)!.serverOnly,
    reachableFromClientSource: viaClient,
    reachableFromRoute: routeReach.get(target) ?? null,
    typeOnlyImporters,
  };
});

// Components that no route reaches at all (static).
const unreachedComponents = [...mods.keys()].filter((f) => f.startsWith('components/') && !routeReach.has(f));

// ── Bundle markers ──
function stringLiterals(file: string): string[] {
  const text = readFileSync(path.join(ROOT, file), 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const v = (n: ts.Node) => { if (ts.isStringLiteralLike(n) && /[一-鿿]/.test(n.text) && n.text.length >= 8) out.push(n.text); ts.forEachChild(n, v); };
  v(sf);
  return [...new Set(out)];
}
function staticFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) { const p = path.join(dir, n); statSync(p).isDirectory() ? staticFiles(p, out) : p.endsWith('.js') && out.push(p); }
  return out;
}
if (process.argv.includes('--bundle')) {
  const chunks = staticFiles(path.join(ROOT, '.next/static'));
  if (!chunks.length) { console.error('no .next/static/**/*.js — run `next build` first'); process.exit(2); }
  const contents = chunks.map((f) => [path.relative(ROOT, f), readFileSync(f, 'utf8')] as const);
  for (const r of reports) {
    // Markers: the 5 longest CJK string literals (minifiers keep string contents; identifiers get renamed).
    const markers = stringLiterals(r.module).sort((a, b) => b.length - a.length).slice(0, 5);
    r.bundleMarkers = markers.map((m) => ({ marker: m, foundIn: contents.filter(([, c]) => c.includes(m) || c.includes(JSON.stringify(m).slice(1, -1))).map(([f]) => f) }));
  }
  console.error(`searched ${chunks.length} client chunk files under .next/static`);
}

const summary = {
  modulesScanned: mods.size,
  clientModules: clientModules.length,
  routeEntries,
  unresolvedImports: [...mods.values()].filter((m) => m.unresolved.length).map((m) => ({ file: m.file, unresolved: m.unresolved })),
  componentsNotReachedFromAnyRoute: unreachedComponents,
  audited: reports,
};

if (process.argv.includes('--json')) { console.log(JSON.stringify(summary, null, 2)); process.exit(0); }

console.log(`modules scanned: ${summary.modulesScanned}, 'use client' modules: ${summary.clientModules}, route entries: ${routeEntries.length}`);
console.log(`components not reached from any route (static): ${unreachedComponents.join(', ') || 'none'}`);
if (summary.unresolvedImports.length) console.log('unresolved imports:', JSON.stringify(summary.unresolvedImports));
for (const r of reports) {
  console.log(`\n■ ${r.module}  (imports server-only: ${r.importsServerOnly ? 'yes' : 'no'})`);
  console.log(`  reachable-from-client-source: ${r.reachableFromClientSource.length ? 'YES' : 'no'}`);
  for (const v of r.reachableFromClientSource) console.log(`    via ${v.client}: ${v.path.join(' → ')}`);
  console.log(`  reachable-from-route (static): ${r.reachableFromRoute ? 'YES: ' + r.reachableFromRoute.join(' → ') : 'no'}`);
  console.log(`  type-only importers (erased, not runtime edges): ${r.typeOnlyImporters.join(', ') || 'none'}`);
  if (r.bundleMarkers) for (const b of r.bundleMarkers) console.log(`  bundle marker ${JSON.stringify(b.marker.slice(0, 24))}…: ${b.foundIn.length ? 'FOUND in ' + b.foundIn.join(', ') : 'not found'}`);
}
