import { Music, Trophy, Mic, Laugh, Sparkles, Users, Tag, type LucideIcon } from 'lucide-react';

export const CATEGORY_LABELS: Record<string, string> = {
  music: 'Âm nhạc',
  sports: 'Thể thao',
  theater: 'Sân khấu',
  comedy: 'Hài kịch',
  festival: 'Festival',
  conference: 'Hội thảo',
  other: 'Khác',
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  music: Music,
  sports: Trophy,
  theater: Mic,
  comedy: Laugh,
  festival: Sparkles,
  conference: Users,
  other: Tag,
};

export const EVENT_STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  published: 'Đã đăng',
  on_sale: 'Đang bán',
  sold_out: 'Hết vé',
  completed: 'Đã kết thúc',
  cancelled: 'Đã hủy',
};
