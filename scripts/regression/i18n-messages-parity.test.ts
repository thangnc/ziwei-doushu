/**
 * 回归：zh / vi 消息表结构一致（Phase 1 i18n core）。
 *
 * - 两种语言的键集合完全相同（tsc 的 `satisfies Messages` 之外再做一次运行时检查，防止 as any 之类绕过）；
 * - 每个键的 {占位符} 集合相同、没有空字符串；
 * - 越南语文案不得出现汉字，唯一例外是语言切换器里的「中文」本身（语言名用其本族语书写，是惯例）；
 * - 中文站点 metadata 与本地化之前 app/layout.tsx（commit a600484）逐字一致 —— 本地化不得改变中文站点。
 *   期望值来源：git show a600484:app/layout.tsx 的 metadata.title / description / keywords / openGraph.siteName。
 */
import assert from 'node:assert/strict';
import { placeholders } from '../../lib/i18n/format';
import { vi } from '../../lib/i18n/messages/vi';
import { zh } from '../../lib/i18n/messages/zh';

type Tree = { [k: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out.set(key, v);
    else for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
  }
  return out;
}

const zhFlat = flatten(zh as unknown as Tree);
const viFlat = flatten(vi as unknown as Tree);

assert.deepEqual([...viFlat.keys()].sort(), [...zhFlat.keys()].sort(), 'vi 与 zh 的消息键集合必须完全相同');

const CJK = /[㐀-鿿豈-﫿]/;
const VI_CJK_ALLOWED = new Set(['localeSwitcher.zh']); // 「中文」作为语言名，按惯例用本族语书写

for (const [key, zhText] of zhFlat) {
  const viText = viFlat.get(key)!;
  assert.ok(zhText.trim().length > 0, `zh 消息 ${key} 不能为空`);
  assert.ok(viText.trim().length > 0, `vi 消息 ${key} 不能为空`);
  assert.deepEqual(placeholders(viText), placeholders(zhText), `消息 ${key} 的占位符必须一致`);
  if (!VI_CJK_ALLOWED.has(key)) assert.ok(!CJK.test(viText), `vi 消息 ${key} 不应含汉字：${viText}`);
}

// 中文站点 metadata 不变（期望值见文件头注释的出处）
assert.equal(zh.meta.title, '紫微命盘 · 倪海厦正宗紫微斗数');
assert.equal(zh.meta.description, '基于倪海厦正宗紫微斗数体系，AI深度解读您的命盘格局、大限流年、感情事业财富健康全方位解析');
assert.equal(zh.meta.keywords, '紫微斗数, 倪海厦, 紫微斗数全集, 紫微斗数全书, 骨髓赋, 命盘, 命理, 14主星, 12宫位');
assert.equal(zh.meta.siteName, '紫微研究');

console.log(`i18n-messages-parity regression passed (${zhFlat.size} keys)`);
