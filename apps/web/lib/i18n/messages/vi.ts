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
 *
 * Phase 2 (/chart page, 2026-11-08). Chart terms on the board come from lib/i18n/terms.ts, not from here.
 * Terms used in the messages below:
 *  - "Mệnh" / "Cung Mệnh" (命宫), "Thân" / "Cung Thân" (身宫): Verified, audit §4.4 rows 命宫 and 身宫.
 *  - "Đại hạn" (大限): Verified, audit §4.16.
 *  - "Tứ Hóa" (四化 as a set): audit §5.16, TTL p.13-14 §8.23 "Tứ Hóa (Hóa Lộc, Hóa Quyền, Hóa Khoa, Hóa Kỵ)".
 *  - "giờ Tý" (子时): Verified, audit §4.10.
 *  - "can" (天干, as in "can Ất"), "âm lịch", "dương lịch", "nhuận", "tuổi", "lá số", "luận giải": ordinary
 *    Vietnamese calendar and reading vocabulary, not engine identifiers → PENDING GLOSSARY REVIEW.
 *  - 三方四正 is not in the audit, so the board legend says "các cung liên quan" (plain) instead of
 *    "tam phương tứ chính".
 *  - 真太阳时: the form corrects by longitude only, without the equation of time (docs/decisions/localization.md
 *    D-2; docs/solutions/docs/readme-claimed-an-equation-of-time-correction-the-form-never-applies.md), so the
 *    result is labelled "Giờ theo kinh độ", not "giờ mặt trời thực".
 *  - The birthplace list is still Chinese provinces and cities and the clock is Beijing time; the labels say so.
 *    Vietnamese places and time zones are Phase 3.
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
  terms: {
    disputed: '{zh} · Thuật ngữ tiếng Việt còn tranh luận, tạm dùng âm Hán-Việt',
    unverified: '{zh} · Thuật ngữ tiếng Việt chưa được kiểm chứng, tạm dùng âm Hán-Việt',
    missing: '{zh} · Chưa có thuật ngữ tiếng Việt',
  },
  chartPage: {
    title: 'Lập lá số Tử Vi',
    intro: 'Nhập ngày giờ sinh, bộ máy lập lá số mã nguồn mở sẽ tạo lá số ngay.',
    introNote: '(Trang này là bản demo của bộ máy; giao diện thương mại đầy đủ không mở mã nguồn, còn lõi lập lá số thì mở hoàn toàn.)',
    restart: '← Lập lá số khác',
  },
  birthForm: {
    heading: '── Nhập ngày giờ sinh ──',
    nameLabel: 'Họ tên (không bắt buộc)',
    namePlaceholder: 'Nhập họ tên',
    dateLabel: 'Ngày sinh (dương lịch)',
    yearPlaceholder: 'Năm',
    monthPlaceholder: 'Tháng',
    dayPlaceholder: 'Ngày',
    monthOption: 'Tháng {n}',
    dayOption: 'Ngày {n}',
    errorYearMissing: 'Hãy chọn năm sinh',
    errorYearRange: 'Năm hợp lệ: {min}–{max}',
    errorMonthMissing: 'Hãy chọn tháng',
    errorDayMissing: 'Hãy chọn ngày',
    errorDayInvalid: 'Tháng {m} không có ngày {d}',
    placeLabel: 'Nơi sinh (tỉnh, thành Trung Quốc; để hiệu chỉnh giờ theo kinh độ)',
    provincePlaceholder: 'Tỉnh / thành phố',
    cityPlaceholder: 'Thành phố',
    cityNeedsProvince: 'Chọn tỉnh trước',
    cityMissing: '(hãy chọn thành phố)',
    placeInfo: '{city} · Kinh độ {longitude}°E · Chênh lệch {offset} phút',
    placeHint: '* Nghê Hải Hạ luận mệnh theo giờ mặt trời; nên chọn nơi sinh để giờ sinh được hiệu chỉnh tự động',
    timeLabel: 'Giờ sinh (giờ Bắc Kinh, UTC+8)',
    hourOption: '{n} giờ',
    minuteOption: '{n} phút',
    solarTimeArrow: 'Giờ theo kinh độ → ',
    shichenRange: '({range})',
    unknownTime: 'Không biết giờ sinh: lập lá số theo giờ Tý (23:00–01:00)',
    genderLabel: 'Giới tính',
    male: '♂ Nam',
    female: '♀ Nữ',
    summaryDate: '{d}/{m}/{y}',
    summaryUnknownTime: 'Không rõ giờ sinh',
    summaryMale: 'Nam',
    summaryFemale: 'Nữ',
    submitting: 'Đang lập lá số…',
    submit: 'Lập lá số ngay',
  },
  timeNav: {
    overlayLine: '{period} · Tứ Hóa can {stem}:',
  },
  board: {
    title: 'Lá số Tử Vi Đẩu Số',
    centerTitle: 'Tử Vi Đẩu Số',
    mingGong: 'Cung Mệnh',
    shenGong: 'Cung Thân',
    badgeMing: 'Mệnh',
    badgeShen: 'Thân',
    overlayDaxian: 'Hạn',
    overlayLiunian: 'Năm',
    currentDaXian: 'Đại hạn hiện tại',
    ageRange: '{start}–{end} tuổi',
    lunarDate: 'Âm lịch: ngày {day} tháng {leap}{month} năm {year}',
    leap: 'nhuận ',
    legendHint: 'Bấm vào một cung để xem các cung liên quan',
  },
  insight: {
    topicOverview: 'Tổng quan',
    topicLove: 'Tình cảm',
    topicCareer: 'Sự nghiệp',
    topicWealth: 'Tài lộc',
    topicHealth: 'Sức khỏe',
    topicPersonality: 'Tính cách',
    loading: 'Đang tạo phần luận giải…',
    header: 'Luận giải',
    apiMissing: 'Bản mã nguồn mở không có API luận giải AI (/api/interpret); bạn cần tự triển khai, xem mục "Quick start" trong README. Bản thân việc lập lá số không cần API key nào.',
    failed: 'Luận giải thất bại, vui lòng thử lại sau.',
    placeholder: 'Hỏi tiếp, ví dụ: Năm nay có nên đổi việc không?',
    send: 'Hỏi tiếp',
  },
} satisfies Messages;
