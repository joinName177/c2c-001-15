import type { CategoryMetric, InvestmentRecord, TimeAccount, TimeCategory } from './models';
import { CATEGORIES, CATEGORY_META } from './models';

export function totalInvested(records: InvestmentRecord[]): number {
  return records.reduce((sum, item) => sum + item.hours, 0);
}

export function metricsFor(records: InvestmentRecord[]): CategoryMetric[] {
  const total = totalInvested(records);
  return CATEGORIES.map((category) => {
    const hours = records.filter((item) => item.category === category).reduce((sum, item) => sum + item.hours, 0);
    const meta = CATEGORY_META[category];
    return { category, hours, share: total ? hours / total : 0, roi: meta.roi, color: meta.color, icon: meta.icon };
  });
}

export function portfolioScore(metrics: CategoryMetric[], account: TimeAccount): number {
  const invested = metrics.reduce((sum, item) => sum + item.hours * item.roi, 0);
  const available = Math.max(account.weeklyHours, 1);
  return Math.round((invested / available) * 10) / 10;
}

export function balanceSheet(metrics: CategoryMetric[], account: TimeAccount) {
  const assets = metrics.reduce((sum, item) => sum + item.hours * item.roi, 0);
  const invested = metrics.reduce((sum, item) => sum + item.hours, 0);
  return { assets: Math.round(assets * 10) / 10, liabilities: Math.max(0, Math.round((account.weeklyHours - invested) * 10) / 10), equity: Math.round((assets - Math.max(0, account.weeklyHours - invested)) * 10) / 10 };
}

export function suggestions(metrics: CategoryMetric[], account: TimeAccount): string[] {
  const total = Math.max(metrics.reduce((sum, item) => sum + item.hours, 0), 1);
  const lowest = [...metrics].sort((a, b) => a.hours - b.hours)[0];
  const highest = [...metrics].sort((a, b) => b.hours - a.hours)[0];
  const result: string[] = [];
  if (highest.share > 0.35) result.push(`「${highest.category}」占比 ${Math.round(highest.share * 100)}%，建议每周拿出 2 小时投向低配资产。`);
  if (lowest.share < 0.1) result.push(`「${lowest.category}」只有 ${Math.round(lowest.share * 100)}%，这是当前最值得补仓的长期资产。`);
  if (account.weeklyHours - total > 4) result.push(`还有 ${Math.round(account.weeklyHours - total)} 小时未被配置，可以先建立一笔“探索基金”。`);
  if (!result.length) result.push('你的时间组合分布稳定，继续用每周复盘保持动态平衡。');
  return result;
}

export function record(category: TimeCategory, hours: number, note: string, date = new Date().toISOString()): InvestmentRecord {
  return { id: `time-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, category, hours: Math.max(0.5, Number(hours) || 0.5), note: note.trim() || '未命名投资', date };
}

export function sampleSnapshot() {
  const account: TimeAccount = { dailyHours: 8, weeklyHours: 56, updatedAt: new Date().toISOString() };
  const seed: Array<[TimeCategory, number, string]> = [
    ['事业', 16, '产品策略与交付'], ['学习', 10, '阅读与课程'], ['健康', 7, '力量训练与散步'],
    ['关系', 8, '家人和朋友'], ['休息', 9, '睡眠与留白'], ['娱乐', 4, '电影与游戏'],
  ];
  return { account, records: seed.map(([category, hours, note], index) => record(category, hours, note, new Date(Date.now() - index * 86400000).toISOString())) };
}
