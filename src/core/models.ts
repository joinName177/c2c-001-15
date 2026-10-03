export type TimeCategory = '健康' | '学习' | '关系' | '事业' | '娱乐' | '休息';

export interface TimeAccount {
  dailyHours: number;
  weeklyHours: number;
  updatedAt: string;
}

export interface InvestmentRecord {
  id: string;
  category: TimeCategory;
  hours: number;
  note: string;
  date: string;
}

export interface TimeSnapshot {
  account: TimeAccount;
  records: InvestmentRecord[];
}

export interface CategoryMetric {
  category: TimeCategory;
  hours: number;
  share: number;
  roi: number;
  color: string;
  icon: string;
}

export const CATEGORIES: TimeCategory[] = ['健康', '学习', '关系', '事业', '娱乐', '休息'];

export const CATEGORY_META: Record<TimeCategory, { color: string; icon: string; roi: number; label: string }> = {
  健康: { color: '#f07f68', icon: '✦', roi: 1.65, label: '身体是第一账户' },
  学习: { color: '#75a8e8', icon: '↗', roi: 2.25, label: '复利型成长' },
  关系: { color: '#d68ad6', icon: '♡', roi: 1.9, label: '长期信任资产' },
  事业: { color: '#e6b65c', icon: '◒', roi: 2.5, label: '创造与交付' },
  娱乐: { color: '#68c4aa', icon: '◇', roi: 1.2, label: '恢复与好奇' },
  休息: { color: '#9b91df', icon: '☾', roi: 1.8, label: '恢复系统' },
};
