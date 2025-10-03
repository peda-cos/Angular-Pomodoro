export interface StatisticsSnapshot {
  dateISO: string;
  workMinutes: number;
  pomodorosCompleted: number;
  byTask: Array<{ taskId: string; workMinutes: number; pomodoros: number }>;
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  pomodorosCompleted: number;
  sessionsCompleted: number;
  averageSessionLength: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  totalMinutes: number;
  pomodorosCompleted: number;
  dailyBreakdown: DailyStats[];
  topTasks: Array<{ taskId: string; taskTitle: string; minutes: number; pomodoros: number }>;
}
