import type { InvestmentRecord, TimeAccount, TimeCategory, TimeSnapshot } from './models';
import { CATEGORIES } from './models';

export const BACKUP_APP_ID = 'c2c-001-time-investment';
export const BACKUP_VERSION = 1;

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: TimeSnapshot;
}

export type ParseBackupResult = { ok: true; snapshot: TimeSnapshot } | { ok: false; error: string };

export function createBackup(snapshot: TimeSnapshot): BackupFile {
  return { app: BACKUP_APP_ID, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), data: snapshot };
}

export function serializeBackup(snapshot: TimeSnapshot): string {
  return JSON.stringify(createBackup(snapshot), null, 2);
}

function fail(error: string): ParseBackupResult {
  return { ok: false, error };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseAccount(raw: unknown): TimeAccount | null {
  if (!isPlainObject(raw)) return null;
  const { dailyHours, weeklyHours, updatedAt } = raw;
  if (typeof dailyHours !== 'number' || !Number.isFinite(dailyHours) || dailyHours <= 0) return null;
  if (typeof weeklyHours !== 'number' || !Number.isFinite(weeklyHours) || weeklyHours <= 0) return null;
  const parsedUpdatedAt = typeof updatedAt === 'string' && !Number.isNaN(Date.parse(updatedAt)) ? updatedAt : new Date().toISOString();
  return { dailyHours, weeklyHours, updatedAt: parsedUpdatedAt };
}

function checkRecord(raw: unknown): { ok: true; record: InvestmentRecord } | { ok: false; reason: string } {
  if (!isPlainObject(raw)) return { ok: false, reason: '不是有效的记录对象' };
  const { id, category, hours, note, date } = raw;
  if (typeof id !== 'string' || !id.trim()) return { ok: false, reason: '缺少记录 id' };
  if (typeof category !== 'string' || !CATEGORIES.includes(category as TimeCategory)) {
    return { ok: false, reason: `资产类别「${String(category)}」无法识别` };
  }
  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0) return { ok: false, reason: '投入小时数无效' };
  if (typeof note !== 'string') return { ok: false, reason: '备注格式错误' };
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) return { ok: false, reason: '日期格式错误' };
  return { ok: true, record: { id, category: category as TimeCategory, hours, note, date } };
}

export function parseBackup(text: string): ParseBackupResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return fail('文件已损坏：内容不是有效的 JSON，无法解析');
  }
  if (!isPlainObject(raw)) return fail('文件结构不符：这不是一个备份文件');
  if (raw.app !== BACKUP_APP_ID) return fail('文件结构不符：缺少应用标识，可能不是「人生时间投资所」导出的备份');
  if (typeof raw.version !== 'number' || !Number.isInteger(raw.version)) return fail('文件结构不符：缺少有效的版本号');
  if (raw.version < 1) return fail(`文件版本无效（v${raw.version}）`);
  if (raw.version > BACKUP_VERSION) return fail(`备份文件版本过新（v${raw.version}），当前应用最高支持 v${BACKUP_VERSION}，请升级应用后再导入`);
  if (!isPlainObject(raw.data)) return fail('文件结构不符：缺少数据内容');

  const account = parseAccount(raw.data.account);
  if (!account) return fail('文件内容不完整：时间账户（预算）数据缺失或格式错误');
  if (!Array.isArray(raw.data.records)) return fail('文件内容不完整：投资流水缺失或格式错误');

  const records: InvestmentRecord[] = [];
  const seenIds = new Set<string>();
  for (let index = 0; index < raw.data.records.length; index += 1) {
    const result = checkRecord(raw.data.records[index]);
    if (!result.ok) return fail(`第 ${index + 1} 笔流水数据异常（${result.reason}），文件可能已被修改或损坏`);
    if (seenIds.has(result.record.id)) return fail(`第 ${index + 1} 笔流水与前面的记录 id 重复，文件可能已被修改或损坏`);
    seenIds.add(result.record.id);
    records.push(result.record);
  }
  return { ok: true, snapshot: { account, records } };
}
