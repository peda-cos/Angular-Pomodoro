export interface SessionRecord {
  id: string;
  taskId?: string;
  type: 'work' | 'short-break' | 'long-break';
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSeconds: number;
  interrupted: boolean;
}
