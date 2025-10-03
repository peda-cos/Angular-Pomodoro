export interface KeyboardShortcut {
  key: string;
  action: ShortcutAction;
  description: string;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
  };
}

export type ShortcutAction =
  | 'toggle-play-pause'
  | 'reset'
  | 'skip-next'
  | 'skip-previous'
  | 'toggle-focus-mode'
  | 'open-task-quick-add'
  | 'open-settings'
  | 'show-help';

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  { key: ' ', action: 'toggle-play-pause', description: 'Toggle play/pause' },
  { key: 'k', action: 'toggle-play-pause', description: 'Toggle play/pause' },
  { key: 'r', action: 'reset', description: 'Reset timer' },
  { key: 'n', action: 'skip-next', description: 'Skip to next phase' },
  { key: 'p', action: 'skip-previous', description: 'Skip to previous phase' },
  { key: 'f', action: 'toggle-focus-mode', description: 'Toggle focus mode' },
  { key: 't', action: 'open-task-quick-add', description: 'Quick add task' },
  { key: 's', action: 'open-settings', description: 'Open settings' },
  { key: 'h', action: 'show-help', description: 'Show keyboard shortcuts' },
];
