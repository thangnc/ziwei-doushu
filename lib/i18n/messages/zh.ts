/**
 * 中文消息（源语言，键的唯一来源）。vi.ts 必须 `satisfies Messages`，缺键 / 多键都过不了 tsc。
 *
 * Phase 1 只收站点级文案（metadata、语言切换器）。页面 / 命盘术语的本地化在后续阶段，按审定的
 * docs/audits/terminology-audit.md 与 docs/audits/ui-inventory.md 进行；不要在这里提前加命盘术语。
 *
 * meta.* 与 app/layout.tsx 原有 metadata 逐字一致 —— 中文站点的 metadata 不得因本地化而改变。
 */
export const zh = {
  meta: {
    title: '紫微命盘 · 倪海厦正宗紫微斗数',
    description: '基于倪海厦正宗紫微斗数体系，AI深度解读您的命盘格局、大限流年、感情事业财富健康全方位解析',
    keywords: '紫微斗数, 倪海厦, 紫微斗数全集, 紫微斗数全书, 骨髓赋, 命盘, 命理, 14主星, 12宫位',
    siteName: '紫微研究',
  },
  localeSwitcher: {
    label: '界面语言',
    vi: 'Tiếng Việt',
    zh: '中文',
    switchTo: '切换到{language}',
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
/** 所有语言共用的消息结构（叶子为任意字符串）。 */
export type Messages = Widen<typeof zh>;
