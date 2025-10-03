import { computed, effect, Injectable, signal } from '@angular/core';
import { Task } from '../models/task.model';
import { StorageService } from './storage.service';

const TASKS_STORAGE_KEY = 'tasks';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private readonly tasksSignal = signal<Task[]>([]);

  readonly allTasks = this.tasksSignal.asReadonly();
  readonly activeTasks = computed(() => this.tasksSignal().filter((task) => !task.completed));
  readonly completedTasks = computed(() => this.tasksSignal().filter((task) => task.completed));

  private recentlyDeletedTasks: Task[] = [];

  constructor(private storage: StorageService) {
    this.loadTasksFromStorage();

    effect(() => {
      const currentTasks = this.tasksSignal();
      this.storage.set(TASKS_STORAGE_KEY, currentTasks);
    });
  }

  private loadTasksFromStorage(): void {
    const storedTasks = this.storage.get<Task[]>(TASKS_STORAGE_KEY);
    if (storedTasks) {
      this.tasksSignal.set(storedTasks);
    }
  }

  addTask(title: string, notes?: string): Task {
    const newTask: Task = {
      id: this.generateUniqueTaskId(),
      title,
      notes,
      createdAt: new Date().toISOString(),
      completed: false,
      totalFocusMinutes: 0,
      pomodorosCompleted: 0,
    };

    this.tasksSignal.update((tasks) => [...tasks, newTask]);
    return newTask;
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
    );
  }

  deleteTask(taskId: string): void {
    const taskToDelete = this.tasksSignal().find((task) => task.id === taskId);
    if (taskToDelete) {
      this.recentlyDeletedTasks.push(taskToDelete);
      this.tasksSignal.update((tasks) => tasks.filter((task) => task.id !== taskId));
    }
  }

  undoDelete(): Task | null {
    const mostRecentlyDeletedTask = this.recentlyDeletedTasks.pop();
    if (mostRecentlyDeletedTask) {
      this.tasksSignal.update((tasks) => [...tasks, mostRecentlyDeletedTask]);
      return mostRecentlyDeletedTask;
    }
    return null;
  }

  toggleComplete(taskId: string): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  }

  incrementPomodoro(taskId: string, focusMinutes: number): void {
    this.tasksSignal.update((tasks) =>
      tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              pomodorosCompleted: task.pomodorosCompleted + 1,
              totalFocusMinutes: task.totalFocusMinutes + focusMinutes,
            }
          : task
      )
    );
  }

  getTaskById(taskId: string): Task | undefined {
    return this.tasksSignal().find((task) => task.id === taskId);
  }

  private generateUniqueTaskId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
