export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type SessionType = 'work' | 'short-break' | 'long-break';

export interface TimerState {
  status: TimerStatus;
  sessionType: SessionType;
  remainingSeconds: number;
  totalSeconds: number;
  completedSessions: number;
  currentTaskId?: string;
  sessionStartTime?: number;
}

export const INITIAL_TIMER_STATE: TimerState = {
  status: 'idle',
  sessionType: 'work',
  remainingSeconds: 0,
  totalSeconds: 0,
  completedSessions: 0,
};
