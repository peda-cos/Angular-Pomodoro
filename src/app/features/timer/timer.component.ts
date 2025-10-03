import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AudioService } from '../../core/services/audio.service';
import { KeyboardShortcutService } from '../../core/services/keyboard-shortcut.service';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { TaskService } from '../../core/services/task.service';
import { TimerService } from '../../core/services/timer.service';
import { WakeLockService } from '../../core/services/wake-lock.service';

@Component({
  selector: 'app-timer',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerComponent implements OnInit, OnDestroy {
  private timerService = inject(TimerService);
  private taskService = inject(TaskService);
  private settingsService = inject(SettingsService);
  private audioService = inject(AudioService);
  private notificationService = inject(NotificationService);
  private keyboardService = inject(KeyboardShortcutService);
  private wakeLockService = inject(WakeLockService);

  readonly timerState = this.timerService.timerState;
  readonly settings = this.settingsService.currentSettings;
  readonly formattedTime = this.timerService.formattedTime;
  readonly progressPercentage = this.timerService.progressPercentage;
  readonly activeTasks = this.taskService.activeTasks;
  readonly currentTaskId = this.timerService.currentTaskId;

  readonly isShowingTaskSelector = signal(false);

  readonly currentTask = computed(() => {
    const taskId = this.currentTaskId();
    if (!taskId) return null;
    return this.activeTasks().find((task) => task.id === taskId) || null;
  });

  readonly circleStrokeDasharray = computed(() => {
    const circleRadius = 140;
    return 2 * Math.PI * circleRadius;
  });

  readonly circleStrokeDashoffset = computed(() => {
    const circumference = this.circleStrokeDasharray();
    const progress = this.progressPercentage();
    return circumference - (progress / 100) * circumference;
  });

  readonly sessionLabel = computed(() => {
    const type = this.timerState().sessionType;
    switch (type) {
      case 'work':
        return 'Focus Time';
      case 'short-break':
        return 'Short Break';
      case 'long-break':
        return 'Long Break';
      default:
        return '';
    }
  });

  readonly isRunning = computed(() => this.timerState().status === 'running');
  readonly isPaused = computed(() => this.timerState().status === 'paused');
  readonly isIdle = computed(() => this.timerState().status === 'idle');

  private previousTimerStatus = this.timerState().status;
  private sessionCompletionWatcherFrameId: number | null = null;

  ngOnInit(): void {
    if (this.isIdle()) {
      this.timerService.initialize(this.settings());
    }

    this.keyboardService.registerHandler('toggle-play-pause', () => this.togglePlayPause());
    this.keyboardService.registerHandler('reset', () => this.reset());
    this.keyboardService.registerHandler('skip-next', () => this.skip());

    this.watchForSessionCompletion();
  }

  ngOnDestroy(): void {
    this.keyboardService.unregisterHandler('toggle-play-pause');
    this.keyboardService.unregisterHandler('reset');
    this.keyboardService.unregisterHandler('skip-next');
    this.wakeLockService.release();

    if (this.sessionCompletionWatcherFrameId !== null) {
      cancelAnimationFrame(this.sessionCompletionWatcherFrameId);
      this.sessionCompletionWatcherFrameId = null;
    }
  }

  private watchForSessionCompletion(): void {
    if (this.sessionCompletionWatcherFrameId !== null) {
      cancelAnimationFrame(this.sessionCompletionWatcherFrameId);
      this.sessionCompletionWatcherFrameId = null;
    }

    if (this.timerState().remainingSeconds === 0 && this.previousTimerStatus === 'running') {
      this.handleSessionCompletion();
    }

    this.previousTimerStatus = this.timerState().status;
    this.sessionCompletionWatcherFrameId = requestAnimationFrame(() =>
      this.watchForSessionCompletion()
    );
  }

  private async handleSessionCompletion(): Promise<void> {
    try {
      const sessionType = this.timerState().sessionType;
      const currentSettings = this.settings();

      if (!this.shouldMuteSessionCompletionSound()) {
        await this.audioService.playSound(currentSettings.soundTheme, currentSettings.volume);
      }

      await this.notificationService.notifySessionComplete(sessionType);
      await this.wakeLockService.release();
    } catch (error) {
      console.error('Error handling session completion:', error);
    }
  }

  private shouldMuteSessionCompletionSound(): boolean {
    const currentSettings = this.settings();
    const sessionType = this.timerState().sessionType;

    if (sessionType === 'work') {
      return currentSettings.muteWork;
    }
    return currentSettings.muteBreak;
  }

  async togglePlayPause(): Promise<void> {
    try {
      const currentTimerStatus = this.timerState().status;

      if (currentTimerStatus === 'running') {
        this.timerService.pause();
        await this.wakeLockService.release();
      } else {
        if (this.notificationService.permission() === 'default') {
          await this.notificationService.requestPermission();
        }

        this.timerService.start(this.settings());

        if (this.timerState().sessionType === 'work') {
          await this.wakeLockService.request();
        }

        await this.notificationService.notifySessionStart(this.timerState().sessionType);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }

  reset(): void {
    this.timerService.reset();
    this.wakeLockService.release();
  }

  skip(): void {
    this.timerService.skip(this.settings());
    this.wakeLockService.release();
  }

  getProgressColor(): string {
    const sessionType = this.timerState().sessionType;
    switch (sessionType) {
      case 'work':
        return 'var(--color-primary)';
      case 'short-break':
        return 'var(--color-success)';
      case 'long-break':
        return 'var(--color-secondary)';
      default:
        return 'var(--color-primary)';
    }
  }

  toggleTaskSelector(): void {
    this.isShowingTaskSelector.update((isShowing) => !isShowing);
  }

  selectTaskForSession(taskId: string | null): void {
    this.timerService.setTaskId(taskId ?? undefined);
    this.isShowingTaskSelector.set(false);
  }

  clearTaskSelection(): void {
    this.timerService.setTaskId(undefined);
    this.isShowingTaskSelector.set(false);
  }
}
