/**
 * Browser persistence for the school (流派) options: localStorage keys, legacy-key migration,
 * load / save / reset.
 *
 * Moved verbatim out of `lib/ziwei/school-config.ts` (2026-11-08) so the engine has no browser
 * APIs; the option types, defaults and URL-param encoding stay in the engine. Nothing in the demo
 * calls these yet.
 */

import {
  DEFAULT_LEAP_MONTH,
  SCHOOL_DEFAULT_CONFIG,
  normalizeBrightness,
  type SchoolConfig,
} from '@ziwei/engine/school-config';

// ─── localStorage 持久化 key ───────────────────────────────────────────
export const SCHOOL_CONFIG_LS_KEY = 'ziwei-school-config-v1';
/** 2026-09-05 闰月默认 prev-month→split 的一次性迁移标记（见 loadSchoolConfig） */
export const SCHOOL_LEAP_MIGRATED_KEY = 'ziwei-school-leap-split-migrated';

/**
 * ★ 2026-10-20 键名统一改名：早期版本存在 `ziwei-<旧名>-config-v1` / `ziwei-<旧名>-leap-split-migrated`。
 * 新键还没有时，把旧键里的流派配置（认 brightnessSchool 字段）与闰月迁移标记搬过来、删掉旧键；只认这两种形状，不碰别的键。
 */
function migrateLegacyKeys(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k) keys.push(k); }
    if (localStorage.getItem(SCHOOL_CONFIG_LS_KEY) === null) {
      for (const k of keys) {
        if (k === SCHOOL_CONFIG_LS_KEY || !/^ziwei-[a-z]+-config-v1$/.test(k)) continue;
        const raw = localStorage.getItem(k);
        let parsed: unknown = null;
        try { parsed = raw ? JSON.parse(raw) : null; } catch { /* 不是流派配置 */ }
        if (!parsed || typeof parsed !== 'object' || !('brightnessSchool' in parsed)) continue;
        localStorage.setItem(SCHOOL_CONFIG_LS_KEY, raw as string);
        localStorage.removeItem(k);
        break;
      }
    }
    for (const k of keys) {
      if (k === SCHOOL_LEAP_MIGRATED_KEY || !/^ziwei-[a-z]+-leap-split-migrated$/.test(k)) continue;
      if (localStorage.getItem(SCHOOL_LEAP_MIGRATED_KEY) === null) localStorage.setItem(SCHOOL_LEAP_MIGRATED_KEY, localStorage.getItem(k) ?? '1');
      localStorage.removeItem(k);
    }
  } catch { /* localStorage 被禁：照旧走默认 */ }
}

/**
 * 读 localStorage 配置（安全 fallback 到默认）
 * 浏览器端调用，服务端返回默认
 */
export function loadSchoolConfig(): SchoolConfig {
  if (typeof window === 'undefined') return SCHOOL_DEFAULT_CONFIG;
  migrateLegacyKeys();
  try {
    const raw = localStorage.getItem(SCHOOL_CONFIG_LS_KEY);
    if (!raw) return SCHOOL_DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SchoolConfig>;
    // ★ 2026-09-05 一次性迁移：旧默认 prev-month 是被整份存进 localStorage 的（抽屉存完整配置），分不清「默认」还是「手选」；
    //   而旧选项本身就标着「默认」，选它的人要的也是对齐默认口径 → 统一迁到新默认 split，只迁一次（迁移标记），之后再手选 prev-month 就尊重
    if (parsed.leapMonth === 'prev-month' && !localStorage.getItem(SCHOOL_LEAP_MIGRATED_KEY)) {
      parsed.leapMonth = DEFAULT_LEAP_MONTH;
      try { localStorage.setItem(SCHOOL_LEAP_MIGRATED_KEY, '1'); localStorage.setItem(SCHOOL_CONFIG_LS_KEY, JSON.stringify({ ...SCHOOL_DEFAULT_CONFIG, ...parsed })); } catch { /* noop */ }
    }
    return normalizeBrightness({ ...SCHOOL_DEFAULT_CONFIG, ...parsed });
  } catch {
    return SCHOOL_DEFAULT_CONFIG;
  }
}

/** 保存配置到 localStorage */
export function saveSchoolConfig(cfg: SchoolConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SCHOOL_CONFIG_LS_KEY, JSON.stringify(cfg));
  } catch { /* localStorage 满或被禁 */ }
}

/** 重置为默认 */
export function resetSchoolConfig(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(SCHOOL_CONFIG_LS_KEY); } catch { /* noop */ }
}
