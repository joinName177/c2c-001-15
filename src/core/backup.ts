import type { InvestmentRecord, TimeAccount, TimeCategory, TimeSnapshot } from './models';
import { CATEGORIES } from './models';

export const BACKUP_VERSION = 1;
export const BACKUP_APP_ID = 'c2c-001-life-time-investment';

export interface BackupFile {
  app: string;
  version: number;
  exportedAt: string;
  data: TimeSnapshot;
}

export type ParseResult = { ok: true; snapshot: TimeSnapshot } | { ok: false; error: string };

export function createBackup(snapshot: TimeSnapshot, exportedAt = new Date().toISOString()): string {
  const backup: BackupFile = { app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt, data: snapshot };
  return JSON.stringify(backup, null, 2);
}

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('文件内容不是有效的 JSON，文件可能已损坏或被修改过。');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fail('文件结构不符：这不是一个备份文件。');
  }
  const file = raw as Partial<BackupFile>;
  if (file.app !== BACKUP_APP_ID) {
    return fail('文件结构不符：缺少应用标识，这不是「人生时间投资所」导出的备份文件。');
  }
  if (typeof file.version !== 'number' || !Number.isInteger(file.version)) {
    return fail('文件结构不符：缺少有效的版本号，文件可能已损坏。');
  }
  if (file.version > BACKUP_VERSION) {
    return fail(`备份文件版本 v${file.version} 高于当前支持的 v${BACKUP_VERSION}，请在新版本应用中导入。`);
  }
  if (file.version < 1) {
    return fail(`备份文件版本 v${file.version} 过旧，当前不再支持。`);
  }
  const data = file.data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return fail('文件结构不符：缺少数据主体（data 字段）。');
  }
  const account = checkAccount((data as TimeSnapshot).account);
  if (typeof account === 'string') return fail(account);
  const records = checkRecords((data as TimeSnapshot).records);
  if (typeof records === 'string') return fail(records);
  return { ok: true, snapshot: { account, records } };
}

function fail(error: string): ParseResult {
  return { ok: false, error };
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function checkAccount(value: unknown): TimeAccount | string {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return '文件结构不符：缺少时间账户（account 字段）。';
  }
  const account = value as TimeAccount;
  if (!isPositiveNumber(account.dailyHours) || !isPositiveNumber(account.weeklyHours)) {
    return '账户数据无效：每日/每周可配置小时必须是大于 0 的数字。';
  }
  if (typeof account.updatedAt !== 'string' || !account.updatedAt) {
    return '账户数据无效：缺少更新时间。';
  }
  return { dailyHours: account.dailyHours, weeklyHours: account.weeklyHours, updatedAt: account.updatedAt };
}

function checkRecords(value: unknown): InvestmentRecord[] | string {
  if (!Array.isArray(value)) {
    return '文件结构不符：流水记录（records 字段）必须是数组。';
  }
  const ids = new Set<string>();
  const records: InvestmentRecord[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index] as InvestmentRecord;
    const at = `第 ${index + 1} 条流水`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) return `${at}无效：记录已损坏。`;
    if (typeof item.id !== 'string' || !item.id) return `${at}无效：缺少记录 id。`;
    if (ids.has(item.id)) return `${at}无效：记录 id「${item.id}」重复。`;
    ids.add(item.id);
    if (typeof item.category !== 'string' || !CATEGORIES.includes(item.category as TimeCategory)) {
      return `${at}无效：资产类别「${String(item.category)}」无法识别。`;
    }
    if (!isPositiveNumber(item.hours)) return `${at}无效：投入小时必须是大于 0 的数字。`;
    if (typeof item.note !== 'string') return `${at}无效：备注必须是文本。`;
    if (typeof item.date !== 'string' || Number.isNaN(Date.parse(item.date))) {
      return `${at}无效：日期「${String(item.date)}」无法解析。`;
    }
    records.push({ id: item.id, category: item.category, hours: item.hours, note: item.note, date: item.date });
  }
  return records;
}
