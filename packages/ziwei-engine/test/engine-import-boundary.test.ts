/**
 * Engine import boundary: packages/ziwei-engine/src (formerly lib/ziwei) must stay a self-contained, UI-free library.
 *
 * Why: the engine is the product and is meant to become its own workspace package. It used to import
 * a type from components/BirthForm.tsx (a cycle, since BirthForm imports share.ts) and to contain a
 * React hook and localStorage code. Those were removed in #16 and #18; this test keeps them out.
 * Background: docs/architecture/engine-protection.md (dependency graph and target architecture).
 *
 * Every module specifier in src/*.ts must be one of:
 *   - a relative path that stays inside src/ (`./x`, never `../`);
 *   - an allowed package: `iztro` and `lunar-javascript` (the engine's two runtime dependencies in
 *     package.json) and `server-only` (the guard patterns.ts and famous.ts carry, per .claude/rules/engine.md).
 * And no engine source may reference the browser globals window, document, localStorage,
 * sessionStorage or navigator: charts must be computable in Node (tests, server actions).
 *
 * Parsed with the TypeScript compiler API, so comments and string contents never count.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ts from 'typescript';

const ENGINE_DIR = fileURLToPath(new URL('../src/', import.meta.url));
const ALLOWED_PACKAGES = new Set(['iztro', 'lunar-javascript', 'server-only']);
const BROWSER_GLOBALS = new Set(['window', 'document', 'localStorage', 'sessionStorage', 'navigator']);

const files = readdirSync(ENGINE_DIR).filter((f) => f.endsWith('.ts')).sort();
assert.ok(files.includes('algorithm.ts'), `expected engine sources in ${ENGINE_DIR}`);

const violations: string[] = [];

function checkSpecifier(file: string, sf: ts.SourceFile, node: ts.Node, spec: string): void {
  const where = `packages/ziwei-engine/src/${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
  if (spec.startsWith('.')) {
    const resolved = path.resolve(ENGINE_DIR, spec);
    if (path.dirname(resolved) !== path.resolve(ENGINE_DIR)) {
      violations.push(`${where} imports '${spec}', which leaves the engine package`);
    }
    return;
  }
  if (!ALLOWED_PACKAGES.has(spec)) violations.push(`${where} imports '${spec}' (allowed packages: ${[...ALLOWED_PACKAGES].join(', ')})`);
}

/** True when an identifier is a reference to a global, not a property name or a declared name. */
function isGlobalReference(id: ts.Identifier): boolean {
  const p = id.parent;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return false;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p)) && p.name === id) return false;
  if ((ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isFunctionDeclaration(p) || ts.isBindingElement(p)) && p.name === id) return false;
  if (ts.isQualifiedName(p) && p.right === id) return false;
  return true;
}

for (const file of files) {
  const text = readFileSync(path.join(ENGINE_DIR, file), 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const visit = (node: ts.Node): void => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      checkSpecifier(file, sf, node, node.moduleSpecifier.text);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference) && ts.isStringLiteral(node.moduleReference.expression)) {
      checkSpecifier(file, sf, node, node.moduleReference.expression.text);
    } else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteralLike(arg)) checkSpecifier(file, sf, node, arg.text);
      else violations.push(`packages/ziwei-engine/src/${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} has a non-literal import()/require()`);
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
      checkSpecifier(file, sf, node, node.argument.literal.text);
    } else if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name) && file.endsWith('.d.ts')) {
      // `declare module 'lunar-javascript'` in a .d.ts shim describes a package; it doesn't import one.
    } else if (ts.isIdentifier(node) && BROWSER_GLOBALS.has(node.text) && isGlobalReference(node)) {
      violations.push(`packages/ziwei-engine/src/${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1} references the browser global '${node.text}'`);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

assert.deepEqual(violations, [], `packages/ziwei-engine/src must not depend on the UI, React, Next or the browser:\n  ${violations.join('\n  ')}`);

console.log(`engine-import-boundary regression passed (${files.length} engine files)`);
