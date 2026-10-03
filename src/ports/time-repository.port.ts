import type { TimeSnapshot } from '../core/models';
export interface TimeRepository { load(): TimeSnapshot; save(snapshot: TimeSnapshot): void; }
