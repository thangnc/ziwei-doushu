/**
 * Vietnamese messages. Structure is enforced by `satisfies Messages` (missing or extra keys fail tsc).
 *
 * Language policy (docs/decisions/localization.md, GLOSSARY to come in Phase 2):
 *  - specialist Tử Vi terms in Hán-Việt, only when attested in docs/audits/terminology-audit.md (Verified);
 *    Disputed/Unverified terms are NOT used (e.g. 流年 / 本命 are avoided here);
 *  - ordinary UI text in natural Vietnamese.
 *
 * Terms used below and their status:
 *  - "Tử Vi Đẩu Số": the discipline's name, attested by the title of Thái Thứ Lang, "Tử Vi Đẩu Số Tân Biên" (TTL, the audit's main source).
 *  - "Đại Hạn" (大限): Verified, docs/audits/terminology-audit.md (TTL p.20 §10.1).
 *  - "Nghê Hải Hạ" (倪海厦), "Toàn Thư" / "Toàn Tập" (全书 / 全集), "Cốt Tủy Phú" (骨髓赋):
 *    PENDING GLOSSARY REVIEW — proper names, not engine identifiers, not covered by the audit. Hán-Việt readings.
 *  - "chính tinh" (主星), "cung" (宫), "lá số" (命盘), "mệnh lý" (命理), "luận giải": generic vocabulary used only in
 *    SEO keywords/description; not engine identifiers and not in the audit → PENDING GLOSSARY REVIEW in Phase 2.
 *  - "vận năm" is plain Vietnamese ("yearly fortune") used instead of the Disputed 流年 → "Lưu niên".
 */
import type { Messages } from './zh';

export const vi = {
  meta: {
    title: 'Lá số Tử Vi · Tử Vi Đẩu Số chính tông theo Nghê Hải Hạ',
    description:
      'Dựa trên hệ thống Tử Vi Đẩu Số chính tông của Nghê Hải Hạ, AI luận giải chuyên sâu lá số của bạn: Đại Hạn, vận năm, tình cảm, sự nghiệp, tài lộc và sức khỏe.',
    keywords:
      'Tử Vi Đẩu Số, Nghê Hải Hạ, Tử Vi Đẩu Số Toàn Tập, Tử Vi Đẩu Số Toàn Thư, Cốt Tủy Phú, lá số tử vi, mệnh lý, 14 chính tinh, 12 cung',
    siteName: 'Nghiên cứu Tử Vi',
  },
  localeSwitcher: {
    label: 'Ngôn ngữ giao diện',
    vi: 'Tiếng Việt',
    zh: '中文',
    switchTo: 'Chuyển sang {language}',
  },
} satisfies Messages;
