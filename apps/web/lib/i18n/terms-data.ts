/**
 * Vietnamese display terms for the Chinese identifiers the engine (or the chart UI) can emit.
 *
 * Source: docs/audits/terminology-audit.md §4, one entry per (category, identifier) row whose reachability is
 * runtime-observed or declared-but-not-observed. iztro-only and proven-unreachable rows are left out.
 * Display rule (docs/decisions/localization.md D-9):
 *  - Verified rows show the audit's conventional Vietnamese term. They are accepted provisionally (D-1).
 *  - Disputed and Unverified rows show the audit's Hán-Việt reading, and the UI marks them as provisional.
 *  - Parentheticals are dropped and the first of "A / B" variants is used (see test/support/terminology-audit.ts).
 * test/i18n-terms-coverage.test.ts checks every entry against the audit and against real engine output.
 *
 * Engine identifiers never change; this table only drives display. To settle a Disputed or Unverified term,
 * record the decision in docs/decisions/localization.md, change the entry and list it in DECIDED_TERMS below.
 */

export type TermStatus = 'verified' | 'disputed' | 'unverified';

export type TermCategory =
  | 'star'
  | 'palace'
  | 'brightness'
  | 'sihua'
  | 'sihuaCompound'
  | 'stem'
  | 'branch'
  | 'shichen'
  | 'wuxingJu'
  | 'yinYangGender'
  | 'boshi'
  | 'suiqian'
  | 'jiangqian'
  | 'yunxianLabel'
  | 'pattern'
  | 'patternTemplate'
  | 'mingGongNature';

/** [Vietnamese display term, audit status] */
export type TermEntry = readonly [vi: string, status: TermStatus];

const V = 'verified';
const D = 'disputed';
const U = 'unverified';

export const TERMS: Record<TermCategory, Readonly<Record<string, TermEntry>>> = {
  star: {
    '七杀': ['Thất Sát', V],
    '三台': ['Tam Thai', V],
    '八座': ['Bát Tọa', V],
    '凤阁': ['Phượng Các', V],
    '副截': ['Phó Tiệt', D],
    '副旬': ['Phó Tuần', D],
    '劫煞': ['Kiếp Sát', V],
    '华盖': ['Hoa Cái', V],
    '台辅': ['Thai Phụ', V],
    '右弼': ['Hữu Bật', V],
    '咸池': ['Hàm Trì', D],
    '地劫': ['Địa Kiếp', V],
    '地空': ['Địa Không', V],
    '大耗': ['Đại Hao', D],
    '天伤': ['Thiên Thương', V],
    '天使': ['Thiên Sứ', V],
    '天刑': ['Thiên Hình', V],
    '天厨': ['Thiên Trù', V],
    '天同': ['Thiên Đồng', V],
    '天哭': ['Thiên Khốc', V],
    '天喜': ['Thiên Hỷ', V],
    '天姚': ['Thiên Diêu', D],
    '天官': ['Thiên Quan', V],
    '天寿': ['Thiên Thọ', V],
    '天巫': ['Thiên Vu', U],
    '天府': ['Thiên Phủ', V],
    '天德': ['Thiên Đức', V],
    '天才': ['Thiên Tài', V],
    '天月': ['Thiên Nguyệt', U],
    '天机': ['Thiên Cơ', V],
    '天梁': ['Thiên Lương', V],
    '天相': ['Thiên Tướng', V],
    '天福': ['Thiên Phúc', V],
    '天空': ['Thiên Không', V],
    '天虚': ['Thiên Hư', V],
    '天贵': ['Thiên Quý', V],
    '天钺': ['Thiên Việt', V],
    '天马': ['Thiên Mã', V],
    '天魁': ['Thiên Khôi', V],
    '太阳': ['Thái Dương', V],
    '太阴': ['Thái Âm', V],
    '孤辰': ['Cô Thần', V],
    '寡宿': ['Quả Tú', V],
    '封诰': ['Phong Cáo', V],
    '左辅': ['Tả Phụ', D],
    '巨门': ['Cự Môn', V],
    '年解': ['Niên Giải', U],
    '廉贞': ['Liêm Trinh', V],
    '恩光': ['Ân Quang', V],
    '截空': ['Triệt', V],
    '擎羊': ['Kình Dương', V],
    '文昌': ['Văn Xương', V],
    '文曲': ['Văn Khúc', V],
    '旬空': ['Tuần', V],
    '月德': ['Nguyệt Đức', V],
    '武曲': ['Vũ Khúc', V],
    '火星': ['Hỏa Tinh', V],
    '破军': ['Phá Quân', V],
    '破碎': ['Phá Toái', V],
    '禄存': ['Lộc Tồn', V],
    '紫微': ['Tử Vi', V],
    '红鸾': ['Hồng Loan', V],
    '蜚廉': ['Phi Liêm', D],
    '解神': ['Giải Thần', V],
    '贪狼': ['Tham Lang', V],
    '铃星': ['Linh Tinh', V],
    '阴煞': ['Âm Sát', U],
    '陀罗': ['Đà La', V],
    '龙德': ['Long Đức', V],
    '龙池': ['Long Trì', V],
  },
  palace: {
    '仆役': ['Nô Bộc', V],
    '兄弟': ['Huynh Đệ', V],
    '命宫': ['Mệnh', V],
    '夫妻': ['Phu Thê', V],
    '子女': ['Tử Tức', V],
    '官禄': ['Quan Lộc', V],
    '父母': ['Phụ Mẫu', V],
    '田宅': ['Điền Trạch', V],
    '疾厄': ['Tật Ách', V],
    '福德': ['Phúc Đức', V],
    '财帛': ['Tài Bạch', V],
    '迁移': ['Thiên Di', V],
    '交友宫': ['Giao Hữu Cung', D],
    '兄弟宫': ['cung Huynh Đệ', V],
    '夫妻宫': ['cung Phu Thê', V],
    '子女宫': ['cung Tử Tức', V],
    '官禄宫': ['cung Quan Lộc', V],
    '父母宫': ['cung Phụ Mẫu', V],
    '田宅宫': ['cung Điền Trạch', V],
    '疾厄宫': ['cung Tật Ách', V],
    '福德宫': ['cung Phúc Đức', V],
    '财帛宫': ['cung Tài Bạch', V],
    '迁移宫': ['cung Thiên Di', V],
  },
  brightness: {
    '庙': ['Miếu', V],
    '陷': ['Hãm', V],
    '平': ['Bình hòa', V],
    '旺': ['Vượng', V],
    '得': ['Đắc', V],
    '闲': ['Nhàn', D],
    '不': ['Bất', D],
    '利': ['Lợi', D],
  },
  sihua: {
    '忌': ['Kỵ', V],
    '权': ['Quyền', V],
    '禄': ['Lộc', V],
    '科': ['Khoa', V],
  },
  sihuaCompound: {
    '化忌': ['Hóa Kỵ', V],
    '化权': ['Hóa Quyền', V],
    '化禄': ['Hóa Lộc', V],
    '化科': ['Hóa Khoa', V],
  },
  stem: {
    '甲': ['Giáp', V],
    '丙': ['Bính', V],
    '庚': ['Canh', V],
    '辛': ['Tân', V],
    '丁': ['Đinh', V],
    '乙': ['Ất', V],
    '戊': ['Mậu', V],
    '己': ['Kỷ', V],
    '癸': ['Quý', V],
    '壬': ['Nhâm', V],
  },
  branch: {
    '子': ['Tý', V],
    '午': ['Ngọ', V],
    '亥': ['Hợi', V],
    '丑': ['Sửu', V],
    '卯': ['Mão', V],
    '辰': ['Thìn', V],
    '申': ['Thân', V],
    '酉': ['Dậu', V],
    '寅': ['Dần', V],
    '巳': ['Tỵ', V],
    '未': ['Mùi', V],
    '戌': ['Tuất', V],
  },
  shichen: {
    '丑时': ['giờ Sửu', V],
    '亥时': ['giờ Hợi', V],
    '午时': ['giờ Ngọ', V],
    '卯时': ['giờ Mão', V],
    '子时': ['giờ Tý', V],
    '寅时': ['giờ Dần', V],
    '巳时': ['giờ Tỵ', V],
    '戌时': ['giờ Tuất', V],
    '未时': ['giờ Mùi', V],
    '申时': ['giờ Thân', V],
    '辰时': ['giờ Thìn', V],
    '酉时': ['giờ Dậu', V],
  },
  wuxingJu: {
    '火六局': ['Hỏa Lục Cục', V],
    '水二局': ['Thủy Nhị Cục', V],
    '木三局': ['Mộc Tam Cục', V],
    '土五局': ['Thổ Ngũ Cục', V],
    '金四局': ['Kim Tứ Cục', V],
  },
  yinYangGender: {
    '阳女': ['Dương Nữ', V],
    '阳男': ['Dương Nam', V],
    '阴女': ['Âm Nữ', V],
    '阴男': ['Âm Nam', V],
  },
  boshi: {
    '伏兵': ['Phục Binh', V],
    '力士': ['Lực Sĩ', V],
    '博士': ['Bác Sĩ', V],
    '喜神': ['Hỷ Thần', V],
    '大耗': ['Đại Hao', V],
    '奏书': ['Tấu Thư', V],
    '官符': ['Quan Phù', D],
    '将军': ['Tướng Quân', V],
    '小耗': ['Tiểu Hao', V],
    '病符': ['Bệnh Phù', V],
    '青龙': ['Thanh Long', V],
    '飞廉': ['Phi Liêm', V],
  },
  suiqian: {
    '丧门': ['Tang Môn', V],
    '吊客': ['Điếu Khách', V],
    '天德': ['Thiên Đức', D],
    '官符': ['Quan Phù', V],
    '小耗': ['Tiểu Hao', D],
    '岁建': ['Tuế Kiến', D],
    '岁破': ['Tuế Phá', V],
    '晦气': ['Hối Khí', D],
    '病符': ['Bệnh Phù', D],
    '白虎': ['Bạch Hổ', V],
    '贯索': ['Quán Sách', D],
    '龙德': ['Long Đức', V],
  },
  jiangqian: {
    '亡神': ['Vong Thần', U],
    '劫煞': ['Kiếp Sát', V],
    '华盖': ['Hoa Cái', V],
    '咸池': ['Hàm Trì', D],
    '天煞': ['Thiên Sát', U],
    '将星': ['Tướng Tinh', U],
    '岁驿': ['Tuế Dịch', U],
    '息神': ['Tức Thần', U],
    '指背': ['Chỉ Bối', U],
    '攀鞍': ['Phan An', U],
    '月煞': ['Nguyệt Sát', U],
    '灾煞': ['Tai Sát', U],
  },
  yunxianLabel: {
    '大限': ['Đại hạn', V],
    '小限': ['Tiểu hạn', V],
    '本命': ['Bản Mệnh', D],
    '流年': ['Lưu Niên', D],
    '流日': ['Lưu nhật', V],
    '流时': ['Lưu thời', V],
    '流月': ['Lưu nguyệt', V],
    '童限': ['Đồng hạn', V],
  },
  pattern: {
    '杀破狼': ['Sát Phá Tham', V],
    '府相朝垣': ['Phủ Tướng triều viên', V],
    '辅弼同会': ['Phụ Bật Đồng Hội', U],
    '昌曲同会': ['Xương Khúc Đồng Hội', U],
    '日月同宫': ['Nhật Nguyệt đồng cung', V],
    '魁钺同会': ['Khôi Việt Đồng Hội', U],
    '机月同梁三星会': ['Cơ Nguyệt Đồng Lương Tam Tinh Hội', U],
    '巨日同宫': ['Cự Nhật Đồng Cung', U],
    '天同天梁格': ['Thiên Đồng Thiên Lương Cách', U],
    '武曲七杀': ['Vũ Khúc Thất Sát', U],
    '机月同梁': ['Cơ Nguyệt Đồng Lương', V],
    '双禄朝垣': ['Song Lộc triều viên', V],
    '火贪格': ['Hỏa Tham Cách', D],
    '武贪格': ['Vũ Tham Cách', U],
    '廉贞天相格': ['Liêm Trinh Thiên Tướng Cách', U],
    '紫府同宫': ['Tử Phủ đồng cung', V],
    '铃贪格': ['Linh Tham Cách', D],
    '科权双会': ['Khoa Quyền Song Hội', U],
    '化权入官': ['Hóa Quyền Nhập Quan', U],
    '天马入命': ['Thiên Mã Nhập Mệnh', U],
    '天马在迁': ['Thiên Mã Tại Thiên Di', U],
    '禄存守命': ['Lộc Tồn Thủ Mệnh', U],
    '紫微入命': ['Tử Vi Nhập Mệnh', U],
    '化禄入财': ['Hóa Lộc Nhập Tài', U],
    '廉杀羊': ['Liêm Sát Dương', U],
    '禄存守身': ['Lộc Tồn Thủ Thân', U],
    '三奇加会': ['Tam Kỳ Gia Hội', D],
    '化科入命': ['Hóa Khoa Nhập Mệnh', U],
    '化科入身': ['Hóa Khoa Nhập Thân', U],
    '巨火羊': ['Cự Hỏa Dương', U],
    '辅弼夹命': ['Phụ Bật Giáp Mệnh', U],
    '魁钺夹命': ['Khôi Việt giáp Mệnh', V],
    '空劫夹命': ['Không Kiếp giáp Mệnh', V],
    '日月夹命': ['Nhật Nguyệt giáp Mệnh', V],
    '阳梁昌禄': ['Dương Lương Xương Lộc', V],
    '昌曲夹命': ['Xương Khúc giáp Mệnh', V],
    '铃昌陀武': ['Linh Xương Đà Vũ', U],
    '火铃夹命': ['Hỏa Linh Giáp Mệnh', U],
    '马头带箭': ['Mã Đầu Đới Tiễn', D],
    '昌曲坐命': ['Xương Khúc Tọa Mệnh', U],
    '羊陀夹忌': ['Dương Đà Giáp Kỵ', U],
    '君臣庆会': ['Quân Thần Khánh Hội', V],
    '明珠出海': ['Minh châu xuất hải', V],
    '石中隐玉': ['Thạch trung ẩn ngọc', V],
  },
  patternTemplate: {
    '{主星}化禄入命': ['{chính tinh} Hóa Lộc Nhập Mệnh', U],
    '{主星}化忌入命': ['{chính tinh} Hóa Kỵ Nhập Mệnh', U],
    '{主星}化忌入迁': ['{chính tinh} Hóa Kỵ Nhập Thiên Di', U],
  },
  mingGongNature: {
    '空宫': ['Vô Chính Diệu', V],
    '桃花星': ['Đào Hoa Tinh', U],
    '福德星': ['Phúc Đức Tinh', U],
    '智慧星': ['Trí Tuệ Tinh', U],
    '帝王星': ['Đế Vương Tinh', U],
    '财帛星': ['Tài Bạch Tinh', U],
    '贵人星': ['Quý Nhân Tinh', U],
    '印绶星': ['Ấn Thụ Tinh', U],
    '将帅星': ['Tướng Soái Tinh', U],
    '荫庇星': ['Ấm Tí Tinh', U],
    '变动星': ['Biến Động Tinh', U],
    '财库星': ['Tài Khố Tinh', U],
    '是非星': ['Thị Phi Tinh', U],
    '财富星': ['Tài Phú Tinh', U],
  },
};

/**
 * Terms settled by a decision after the audit. The entry in TERMS then holds the decided display term and is no
 * longer shown as provisional. Key: `${category}:${identifier}`; value: the decision ID in
 * docs/decisions/localization.md (the coverage test checks that the ID exists there).
 */
export const DECIDED_TERMS: Readonly<Record<string, string>> = {};
