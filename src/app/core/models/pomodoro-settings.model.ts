export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  soundTheme: 'soft' | 'bell' | 'none';
  volume: number; // 0..1
  themeId: string;
  fontFamily: string;
  muteWork: boolean;
  muteBreak: boolean;
}

export const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  soundTheme: 'soft',
  volume: 0.7,
  themeId: 'default',
  fontFamily: 'system-ui',
  muteWork: false,
  muteBreak: false,
};
