import { computed, effect, Injectable, signal } from '@angular/core';
import { PomodoroSettings } from '../models/pomodoro-settings.model';
import { SessionRecord } from '../models/session-record.model';
import {
  INITIAL_TIMER_STATE,
  SessionType,
  TimerState,
  TimerStatus,
} from '../models/timer-state.model';
import { HistoryService } from './history.service';
import { StorageService } from './storage.service';

const TIMER_STATE_STORAGE_KEY = 'timer_state';
const TICK_INTERVAL_MILLISECONDS = 100;
const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;

@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private readonly timerStateSignal = signal<TimerState>({ ...INITIAL_TIMER_STATE });
  private countdownIntervalId: number | null = null;
  private sessionStartTimestamp = 0;
  private sessionRemainingSecondsAtStart = 0;
  private activeSessionId: string | null = null;
  private activeSessionStartedAt: string | null = null;

  readonly timerState = this.timerStateSignal.asReadonly();
  readonly status = computed(() => this.timerStateSignal().status);
  readonly sessionType = computed(() => this.timerStateSignal().sessionType);
  readonly remainingSeconds = computed(() => this.timerStateSignal().remainingSeconds);
  readonly totalSeconds = computed(() => this.timerStateSignal().totalSeconds);
  readonly completedSessions = computed(() => this.timerStateSignal().completedSessions);
  readonly currentTaskId = computed(() => this.timerStateSignal().currentTaskId);

  readonly progressPercentage = computed(() => {
    const totalDurationInSeconds = this.timerStateSignal().totalSeconds;
    const remainingDurationInSeconds = this.timerStateSignal().remainingSeconds;
    const hasValidDuration = totalDurationInSeconds > 0;

    if (!hasValidDuration) {
      return 0;
    }

    const elapsedDurationInSeconds = totalDurationInSeconds - remainingDurationInSeconds;
    return (elapsedDurationInSeconds / totalDurationInSeconds) * 100;
  });

  readonly formattedTime = computed(() => {
    const totalSeconds = this.timerStateSignal().remainingSeconds;
    const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
    const seconds = totalSeconds % SECONDS_PER_MINUTE;

    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
  });

  constructor(private storageService: StorageService, private historyService: HistoryService) {
    this.restorePersistedState();
    this.setupAutomaticStatePersistence();
  }

  private restorePersistedState(): void {
    const persistedTimerState = this.storageService.get<TimerState>(TIMER_STATE_STORAGE_KEY);
    const hasPersistedState = persistedTimerState && persistedTimerState.status !== 'idle';

    if (!hasPersistedState) {
      return;
    }

    const wasRunningBeforeReload =
      persistedTimerState.status === 'running' && persistedTimerState.sessionStartTime;

    if (wasRunningBeforeReload) {
      const elapsedMillisecondsSinceStart =
        performance.now() - persistedTimerState.sessionStartTime!;
      const elapsedSecondsSinceStart = Math.floor(
        elapsedMillisecondsSinceStart / MILLISECONDS_PER_SECOND
      );
      const calculatedRemainingSeconds = Math.max(
        0,
        persistedTimerState.remainingSeconds - elapsedSecondsSinceStart
      );
      const sessionHasTimeRemaining = calculatedRemainingSeconds > 0;

      this.timerStateSignal.set({
        ...persistedTimerState,
        remainingSeconds: calculatedRemainingSeconds,
        status: sessionHasTimeRemaining ? 'paused' : 'completed',
      });
    } else {
      this.timerStateSignal.set(persistedTimerState);
    }
  }

  private setupAutomaticStatePersistence(): void {
    effect(() => {
      const currentTimerState = this.timerStateSignal();
      const shouldPersistState = currentTimerState.status !== 'idle';

      if (shouldPersistState) {
        this.storageService.set(TIMER_STATE_STORAGE_KEY, currentTimerState);
      }
    });
  }

  initialize(pomodoroSettings: PomodoroSettings, assignedTaskId?: string): void {
    const workDurationInSeconds = pomodoroSettings.workMinutes * SECONDS_PER_MINUTE;

    this.timerStateSignal.set({
      status: 'idle',
      sessionType: 'work',
      remainingSeconds: workDurationInSeconds,
      totalSeconds: workDurationInSeconds,
      completedSessions: 0,
      currentTaskId: assignedTaskId,
    });
  }

  start(pomodoroSettings: PomodoroSettings): void {
    const currentTimerState = this.timerStateSignal();
    const isStartingFromIdle = currentTimerState.status === 'idle';

    if (isStartingFromIdle) {
      const sessionDurationInSeconds = this.calculateSessionDurationInSeconds(
        pomodoroSettings,
        currentTimerState.sessionType
      );

      this.timerStateSignal.update((state) => ({
        ...state,
        status: 'running',
        remainingSeconds: sessionDurationInSeconds,
        totalSeconds: sessionDurationInSeconds,
        sessionStartTime: performance.now(),
      }));
    } else {
      this.timerStateSignal.update((state) => ({
        ...state,
        status: 'running',
        sessionStartTime: performance.now(),
      }));
    }

    this.activeSessionId = this.generateUniqueSessionId();
    this.activeSessionStartedAt = new Date().toISOString();
    this.beginCountdownTicking();
  }

  pause(): void {
    this.stopCountdownTicking();
    this.timerStateSignal.update((state) => ({ ...state, status: 'paused' }));
  }

  reset(): void {
    this.stopCountdownTicking();
    this.recordSessionInHistory(true);
    this.timerStateSignal.set({ ...INITIAL_TIMER_STATE });
    this.storageService.remove(TIMER_STATE_STORAGE_KEY);
  }

  skip(pomodoroSettings: PomodoroSettings): void {
    this.stopCountdownTicking();
    this.recordSessionInHistory(true);

    const currentTimerState = this.timerStateSignal();
    const nextSessionType = this.determineNextSessionType(currentTimerState, pomodoroSettings);
    const nextSessionDurationInSeconds = this.calculateSessionDurationInSeconds(
      pomodoroSettings,
      nextSessionType
    );

    this.timerStateSignal.update((state) => ({
      ...state,
      sessionType: nextSessionType,
      remainingSeconds: nextSessionDurationInSeconds,
      totalSeconds: nextSessionDurationInSeconds,
      status: 'idle',
    }));
  }

  setTaskId(assignedTaskId: string | undefined): void {
    this.timerStateSignal.update((state) => ({
      ...state,
      currentTaskId: assignedTaskId,
    }));
  }

  private beginCountdownTicking(): void {
    const isAlreadyTicking = this.countdownIntervalId !== null;

    if (isAlreadyTicking) {
      return;
    }

    this.sessionStartTimestamp = performance.now();
    this.sessionRemainingSecondsAtStart = this.timerStateSignal().remainingSeconds;

    this.countdownIntervalId = window.setInterval(() => {
      const elapsedMillisecondsSinceStart = performance.now() - this.sessionStartTimestamp;
      const elapsedSecondsSinceStart = Math.floor(
        elapsedMillisecondsSinceStart / MILLISECONDS_PER_SECOND
      );
      const calculatedRemainingSeconds = Math.max(
        0,
        this.sessionRemainingSecondsAtStart - elapsedSecondsSinceStart
      );

      const currentRemainingSeconds = this.timerStateSignal().remainingSeconds;
      const remainingSecondsHasChanged = calculatedRemainingSeconds !== currentRemainingSeconds;

      if (remainingSecondsHasChanged) {
        this.updateRemainingSeconds(calculatedRemainingSeconds);
      }
    }, TICK_INTERVAL_MILLISECONDS);
  }

  private stopCountdownTicking(): void {
    const isCurrentlyTicking = this.countdownIntervalId !== null;

    if (isCurrentlyTicking) {
      clearInterval(this.countdownIntervalId!);
      this.countdownIntervalId = null;
    }
  }

  private updateRemainingSeconds(newRemainingSeconds: number): void {
    this.timerStateSignal.update((state) => {
      const sessionHasCompleted = newRemainingSeconds === 0 && state.remainingSeconds > 0;

      if (sessionHasCompleted) {
        this.handleSessionCompletion();
        return {
          ...state,
          remainingSeconds: 0,
          status: 'completed' as TimerStatus,
        };
      }

      return {
        ...state,
        remainingSeconds: newRemainingSeconds,
      };
    });
  }

  private handleSessionCompletion(): void {
    this.stopCountdownTicking();
    this.recordSessionInHistory(false);

    const currentTimerState = this.timerStateSignal();
    const completedSessionWasWorkSession = currentTimerState.sessionType === 'work';

    if (completedSessionWasWorkSession) {
      this.timerStateSignal.update((state) => ({
        ...state,
        completedSessions: state.completedSessions + 1,
      }));
    }
  }

  private recordSessionInHistory(wasInterruptedByUser: boolean): void {
    const hasActiveSession = this.activeSessionId && this.activeSessionStartedAt;

    if (!hasActiveSession) {
      return;
    }

    const currentTimerState = this.timerStateSignal();
    const sessionEndedAt = new Date().toISOString();
    const sessionStartTimestamp = new Date(this.activeSessionStartedAt!).getTime();
    const sessionEndTimestamp = new Date(sessionEndedAt).getTime();
    const sessionDurationInSeconds = Math.floor(
      (sessionEndTimestamp - sessionStartTimestamp) / MILLISECONDS_PER_SECOND
    );

    const completedSessionRecord: SessionRecord = {
      id: this.activeSessionId!,
      taskId: currentTimerState.currentTaskId,
      type: currentTimerState.sessionType,
      startedAt: this.activeSessionStartedAt!,
      endedAt: sessionEndedAt,
      durationSeconds: sessionDurationInSeconds,
      interrupted: wasInterruptedByUser,
    };

    this.historyService.addSession(completedSessionRecord);
    this.activeSessionId = null;
    this.activeSessionStartedAt = null;
  }

  private calculateSessionDurationInSeconds(
    pomodoroSettings: PomodoroSettings,
    sessionType: SessionType
  ): number {
    const durationMappings = {
      work: pomodoroSettings.workMinutes,
      'short-break': pomodoroSettings.shortBreakMinutes,
      'long-break': pomodoroSettings.longBreakMinutes,
    };

    const durationInMinutes = durationMappings[sessionType];
    return durationInMinutes * SECONDS_PER_MINUTE;
  }

  private determineNextSessionType(
    currentTimerState: TimerState,
    pomodoroSettings: PomodoroSettings
  ): SessionType {
    const currentSessionIsBreak = currentTimerState.sessionType !== 'work';

    if (currentSessionIsBreak) {
      return 'work';
    }

    const upcomingCompletedSessionsCount = currentTimerState.completedSessions + 1;
    const shouldTakeLongBreak =
      upcomingCompletedSessionsCount % pomodoroSettings.sessionsBeforeLongBreak === 0;

    return shouldTakeLongBreak ? 'long-break' : 'short-break';
  }

  private generateUniqueSessionId(): string {
    const timestampComponent = Date.now();
    const randomComponent = Math.random().toString(36).slice(2, 11);
    return `${timestampComponent}-${randomComponent}`;
  }
}
