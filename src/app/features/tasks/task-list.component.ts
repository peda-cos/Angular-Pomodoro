import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task.service';
import { TimerService } from '../../core/services/timer.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.scss'],
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private timerService = inject(TimerService);

  readonly activeTasks = this.taskService.activeTasks;
  readonly completedTasks = this.taskService.completedTasks;
  readonly currentTaskId = this.timerService.currentTaskId;

  readonly isShowingCompletedTasks = signal(false);
  readonly isShowingAddTaskForm = signal(false);
  readonly editingTaskId = signal<string | null>(null);

  readonly newTaskTitle = signal('');
  readonly newTaskNotes = signal('');

  readonly editTaskTitle = signal('');
  readonly editTaskNotes = signal('');

  readonly hasActiveTasks = computed(() => this.activeTasks().length > 0);
  readonly hasCompletedTasks = computed(() => this.completedTasks().length > 0);

  private quickAddEventListener = this.handleQuickAddTrigger.bind(this);

  ngOnInit(): void {
    window.addEventListener('trigger-add-task', this.quickAddEventListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('trigger-add-task', this.quickAddEventListener);
  }

  private handleQuickAddTrigger(): void {
    this.showAddTaskForm();
    setTimeout(() => {
      const titleInput = document.querySelector<HTMLInputElement>('.task-form input[type="text"]');
      titleInput?.focus();
    }, 100);
  }

  toggleShowCompletedTasks(): void {
    this.isShowingCompletedTasks.update((isShowing) => !isShowing);
  }

  showAddTaskForm(): void {
    this.isShowingAddTaskForm.set(true);
    this.newTaskTitle.set('');
    this.newTaskNotes.set('');
  }

  cancelAddTask(): void {
    this.isShowingAddTaskForm.set(false);
  }

  addTask(): void {
    const trimmedTitle = this.newTaskTitle().trim();
    if (!trimmedTitle) {
      return;
    }

    this.taskService.addTask(trimmedTitle, this.newTaskNotes().trim() || undefined);
    this.isShowingAddTaskForm.set(false);
    this.newTaskTitle.set('');
    this.newTaskNotes.set('');
  }

  startEditingTask(task: Task): void {
    this.editingTaskId.set(task.id);
    this.editTaskTitle.set(task.title);
    this.editTaskNotes.set(task.notes || '');
  }

  cancelEditTask(): void {
    this.editingTaskId.set(null);
  }

  saveEditedTask(taskId: string): void {
    const trimmedTitle = this.editTaskTitle().trim();
    if (!trimmedTitle) {
      return;
    }

    this.taskService.updateTask(taskId, {
      title: trimmedTitle,
      notes: this.editTaskNotes().trim() || undefined,
    });
    this.editingTaskId.set(null);
  }

  deleteTask(taskId: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(taskId);
    }
  }

  toggleTaskComplete(taskId: string): void {
    this.taskService.toggleComplete(taskId);
  }

  selectTaskForTimer(taskId: string): void {
    this.timerService.setTaskId(taskId);
  }

  isTaskBeingEdited(taskId: string): boolean {
    return this.editingTaskId() === taskId;
  }

  isTaskSelected(taskId: string): boolean {
    return this.currentTaskId() === taskId;
  }

  trackByTaskId(index: number, task: Task): string {
    return task.id;
  }

  formatMinutesToReadableTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
}
