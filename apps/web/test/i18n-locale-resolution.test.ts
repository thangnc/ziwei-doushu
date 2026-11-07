/**
 * 回归：语言 cookie → locale 的解析（Phase 1 i18n core）。
 *
 * 决策（docs/decisions/localization.md）：越南语为默认语言，保留中文；语言由 cookie `ziwei-locale` 决定。
 * 任何缺失 / 未知 / 大小写或空白不符的 cookie 值都回落到默认语言，绝不抛错（cookie 来自用户，不可信）。
 */
import assert from 'node:assert/strict';
import { translate } from '../lib/i18n/format';
import {
  DEFAULT_LOCALE, HTML_LANG, LOCALE_COOKIE, LOCALES, OG_LOCALE, localeCookieString, resolveLocale,
} from '../lib/i18n/locales';
import { getMessages } from '../lib/i18n/messages';

assert.equal(DEFAULT_LOCALE, 'vi', '默认语言是越南语');
assert.deepEqual([...LOCALES].sort(), ['vi', 'zh']);

assert.equal(resolveLocale('vi'), 'vi');
assert.equal(resolveLocale('zh'), 'zh');
for (const bad of [undefined, null, '', 'en', 'ZH', 'Vi', ' zh', 'zh-CN', 'vi-VN', 'zh;', '__proto__', 'constructor']) {
  assert.equal(resolveLocale(bad as string | undefined | null), 'vi', `非法 cookie 值 ${JSON.stringify(bad)} 应回落到 vi`);
}

assert.equal(HTML_LANG.vi, 'vi');
assert.equal(HTML_LANG.zh, 'zh-CN', '中文站点 <html lang> 保持原值 zh-CN');
assert.equal(OG_LOCALE.vi, 'vi_VN');
assert.equal(OG_LOCALE.zh, 'zh_CN', '中文站点 og:locale 保持原值 zh_CN');

assert.equal(LOCALE_COOKIE, 'ziwei-locale');
assert.equal(localeCookieString('zh'), 'ziwei-locale=zh; Path=/; Max-Age=31536000; SameSite=Lax');

// 插值与回落
assert.equal(translate(getMessages('vi'), 'localeSwitcher.switchTo', { language: '中文' }), 'Chuyển sang 中文');
assert.equal(translate(getMessages('zh'), 'localeSwitcher.switchTo', { language: 'Tiếng Việt' }), '切换到Tiếng Việt');
assert.equal(translate(getMessages('vi'), 'localeSwitcher.switchTo'), 'Chuyển sang {language}', '缺变量时占位符原样保留，不静默丢弃');

console.log('i18n-locale-resolution regression passed');
