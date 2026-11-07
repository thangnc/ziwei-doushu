/**
 * 中文消息（源语言，键的唯一来源）。vi.ts 必须 `satisfies Messages`，缺键 / 多键都过不了 tsc。
 *
 * Phase 1 只收站点级文案（metadata、语言切换器）。页面 / 命盘术语的本地化在后续阶段，按审定的
 * docs/audits/terminology-audit.md 与 docs/audits/ui-inventory.md 进行；不要在这里提前加命盘术语。
 *
 * meta.* 与 app/layout.tsx 原有 metadata 逐字一致 —— 中文站点的 metadata 不得因本地化而改变。
 *
 * Phase 2 (2026-11-08) adds the /chart page strings below. Each zh value is the string the component hard-coded
 * before localization, character for character, so the Chinese UI is unchanged. Chart terms themselves (stars,
 * palaces, 四化, 干支, 五行局 …) are not messages: they go through lib/i18n/terms.ts.
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
  /** Tooltip of a provisional chart term (only ever shown in Vietnamese; zh kept for key parity). */
  terms: {
    disputed: '{zh}：越南语术语有争议，暂用汉越音',
    unverified: '{zh}：越南语术语未经核实，暂用汉越音',
    missing: '{zh}：尚无越南语术语',
  },
  chartPage: {
    title: '紫微斗数排盘',
    intro: '输入出生年月日时，开源排盘引擎即时生成命盘。',
    introNote: '（本页为引擎 Demo，完整商业版界面不在开源范围；排盘内核完全开放。）',
    restart: '← 重新起盘',
  },
  birthForm: {
    heading: '── 输入生辰八字 ──',
    nameLabel: '姓名（可选）',
    namePlaceholder: '请输入姓名',
    dateLabel: '出生日期（公历）',
    yearPlaceholder: '年份',
    monthPlaceholder: '月份',
    dayPlaceholder: '日期',
    monthOption: '{n} 月',
    dayOption: '{n} 日',
    errorYearMissing: '请选择出生年份',
    errorYearRange: '年份范围：{min}–{max}',
    errorMonthMissing: '请选择月份',
    errorDayMissing: '请选择日期',
    errorDayInvalid: '{m}月没有{d}日',
    placeLabel: '出生地点（用于真太阳时校正）',
    provincePlaceholder: '省份 / 直辖市',
    cityPlaceholder: '城市',
    cityNeedsProvince: '先选省份',
    cityMissing: '（请选择城市）',
    placeInfo: '{city} · 经度 {longitude}°E · 时差 {offset} 分钟',
    placeHint: '* 倪海厦批命用真太阳时，建议填写出生地以自动校正时辰',
    timeLabel: '出生时间（北京时间）',
    hourOption: '{n} 时',
    minuteOption: '{n} 分',
    solarTimeArrow: '真太阳时 → ',
    shichenRange: '（{range}）',
    unknownTime: '不知道出生时间，以子时（23:00–01:00）起盘',
    genderLabel: '性别',
    male: '♂ 男',
    female: '♀ 女',
    summaryDate: '{y}年{m}月{d}日',
    summaryUnknownTime: '时辰不详',
    summaryMale: '男',
    summaryFemale: '女',
    submitting: '紫微起盘中…',
    submit: '立即起盘 · 解命运密码',
  },
  timeNav: {
    overlayLine: '{period}·{stem}年四化：',
  },
  board: {
    title: '紫微斗数命盘',
    centerTitle: '紫微斗数',
    mingGong: '命宫',
    shenGong: '身宫',
    badgeMing: '命',
    badgeShen: '身',
    overlayDaxian: '限',
    overlayLiunian: '年',
    currentDaXian: '当前大限',
    ageRange: '{start}–{end}岁',
    lunarDate: '{year}·{leap}{month}·{day}',
    leap: '闰',
    legendHint: '点击宫位看三方四正',
  },
  insight: {
    topicOverview: '命格',
    topicLove: '感情',
    topicCareer: '事业',
    topicWealth: '财运',
    topicHealth: '健康',
    topicPersonality: '性格',
    loading: '命格解读生成中…',
    header: '命理解读',
    apiMissing: '开源版不含 AI 解读接口（/api/interpret），需要你自己实现后才能用，详见 README「快速开始」。排盘本身不需要任何 API Key。',
    failed: '解读失败，请稍后重试。',
    placeholder: '继续追问，如：今年适合换工作吗？',
    send: '追问',
  },
} as const;

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
/** 所有语言共用的消息结构（叶子为任意字符串）。 */
export type Messages = Widen<typeof zh>;
