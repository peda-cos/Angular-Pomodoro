export interface Task {
  id: string;
  title: string;
  notes?: string;
  createdAt: string;
  completed: boolean;
  totalFocusMinutes: number;
  pomodorosCompleted: number;
}
