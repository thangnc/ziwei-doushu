/**
 * Localized UI files may not hard-code Chinese text in JSX (Vietnamese localization, Phase 2 onwards).
 *
 * A file joins LOCALIZED_FILES when its localization phase lands. In those files, displayed text must come from
 * lib/i18n/messages (useT) or lib/i18n/terms.ts (chart terms). Chinese engine identifiers are still allowed
 * where they are data, not text: object keys, comparisons, arguments to presentTerm, and so on.
 *
 * What counts as hard-coded displayed text (TypeScript AST, so comments never count):
 *  - JSX text containing a CJK ideograph;
 *  - a string or template literal written directly as a JSX child (`{'…'}`) or as a JSX attribute value.
 * This is narrower than the string census in docs/audits/ui-inventory.md §1.1: a Chinese string stored in a
 * variable and rendered later is not caught. Review still matters.
 *
 * Expected value: zero findings (docs/decisions/localization.md D-9 and .claude/rules/demo-ui.md).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

/** Files localized so far, relative to apps/web. Phase 2: the /chart page. */
const LOCALIZED_FILES = [
  'app/chart/page.tsx',
  'components/BirthForm.tsx',
  'components/ChartBoard.tsx',
  'components/InsightPanel.tsx',
  'components/PalaceCell.tsx',
  'components/Term.tsx',
  'components/TimeNav.tsx',
];

const CJK = /[㐀-鿿豈-﫿]/;
const findings: string[] = [];

for (const file of LOCALIZED_FILES) {
  const source = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const report = (node: ts.Node, text: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    findings.push(`${file}:${line + 1}: ${text.trim().slice(0, 60)}`);
  };
  const isLiteral = (n: ts.Node | undefined): n is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral =>
    !!n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n));
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && CJK.test(node.text)) report(node, node.text);
    if (ts.isJsxExpression(node) && ts.isJsxElement(node.parent) && isLiteral(node.expression)
      && CJK.test(node.expression.text)) report(node, node.expression.text);
    if (ts.isJsxExpression(node) && ts.isJsxElement(node.parent) && node.expression
      && ts.isTemplateExpression(node.expression) && CJK.test(node.expression.getText(sf))) {
      report(node, node.expression.getText(sf));
    }
    if (ts.isJsxAttribute(node) && node.initializer) {
      const init = node.initializer;
      const value = ts.isStringLiteral(init) ? init.text
        : ts.isJsxExpression(init) && isLiteral(init.expression) ? init.expression.text
        : '';
      if (CJK.test(value)) report(node, value);
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

assert.deepEqual(findings, [], `Hard-coded Chinese text in localized UI files:\n${findings.join('\n')}`);
console.log(`i18n-no-cjk regression passed (${LOCALIZED_FILES.length} localized files)`);
