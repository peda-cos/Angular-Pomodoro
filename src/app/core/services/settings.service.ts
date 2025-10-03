import { computed, effect, Injectable, signal } from '@angular/core';
import { DEFAULT_SETTINGS, PomodoroSettings } from '../models/pomodoro-settings.model';
import { StorageService } from './storage.service';

const SETTINGS_STORAGE_KEY = 'settings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly settingsSignal = signal<PomodoroSettings>({ ...DEFAULT_SETTINGS });

  readonly currentSettings = this.settingsSignal.asReadonly();
  readonly workMinutes = computed(() => this.settingsSignal().workMinutes);
  readonly shortBreakMinutes = computed(() => this.settingsSignal().shortBreakMinutes);
  readonly longBreakMinutes = computed(() => this.settingsSignal().longBreakMinutes);
  readonly sessionsBeforeLongBreak = computed(() => this.settingsSignal().sessionsBeforeLongBreak);
  readonly soundTheme = computed(() => this.settingsSignal().soundTheme);
  readonly volume = computed(() => this.settingsSignal().volume);
  readonly themeId = computed(() => this.settingsSignal().themeId);
  readonly fontFamily = computed(() => this.settingsSignal().fontFamily);

  constructor(private storage: StorageService) {
    this.loadSettingsFromStorage();

    effect(() => {
      this.storage.set(SETTINGS_STORAGE_KEY, this.settingsSignal());
    });
  }

  private loadSettingsFromStorage(): void {
    const savedSettings = this.storage.get<PomodoroSettings>(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      this.settingsSignal.set({ ...DEFAULT_SETTINGS, ...savedSettings });
    }
  }

  updateSettings(updates: Partial<PomodoroSettings>): void {
    this.settingsSignal.update((currentSettings) => ({
      ...currentSettings,
      ...updates,
    }));
  }

  resetToDefaults(): void {
    this.settingsSignal.set({ ...DEFAULT_SETTINGS });
  }

  validateSettings(settings: Partial<PomodoroSettings>): string[] {
    const validationErrors: string[] = [];

    if (settings.workMinutes !== undefined) {
      if (settings.workMinutes < 1 || settings.workMinutes > 90) {
        validationErrors.push('Work duration must be between 1 and 90 minutes');
      }
    }

    if (settings.shortBreakMinutes !== undefined) {
      if (settings.shortBreakMinutes < 1 || settings.shortBreakMinutes > 30) {
        validationErrors.push('Short break must be between 1 and 30 minutes');
      }
    }

    if (settings.longBreakMinutes !== undefined) {
      if (settings.longBreakMinutes < 1 || settings.longBreakMinutes > 60) {
        validationErrors.push('Long break must be between 1 and 60 minutes');
      }
    }

    if (settings.sessionsBeforeLongBreak !== undefined) {
      if (settings.sessionsBeforeLongBreak < 2 || settings.sessionsBeforeLongBreak > 10) {
        validationErrors.push('Sessions before long break must be between 2 and 10');
      }
    }

    if (settings.volume !== undefined) {
      if (settings.volume < 0 || settings.volume > 1) {
        validationErrors.push('Volume must be between 0 and 1');
      }
    }

    return validationErrors;
  }
}
