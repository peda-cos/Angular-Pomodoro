import { effect, Injectable, signal } from '@angular/core';
import {
  DEFAULT_SHORTCUTS,
  KeyboardShortcut,
  ShortcutAction,
} from '../models/keyboard-shortcut.model';
import { StorageService } from './storage.service';

const KEYBOARD_SHORTCUTS_STORAGE_KEY = 'keyboard_shortcuts';

export type ShortcutHandler = () => void;

@Injectable({
  providedIn: 'root',
})
export class KeyboardShortcutService {
  private readonly shortcutsSignal = signal<KeyboardShortcut[]>([...DEFAULT_SHORTCUTS]);
  private readonly shortcutHandlerRegistry = new Map<ShortcutAction, ShortcutHandler>();
  private readonly isEnabledSignal = signal(true);

  readonly allShortcuts = this.shortcutsSignal.asReadonly();
  readonly isEnabled = this.isEnabledSignal.asReadonly();

  constructor(private storage: StorageService) {
    this.loadShortcutsFromStorage();
    this.setupGlobalKeyboardListener();

    effect(() => {
      this.storage.set(KEYBOARD_SHORTCUTS_STORAGE_KEY, this.shortcutsSignal());
    });
  }

  private loadShortcutsFromStorage(): void {
    const savedShortcuts = this.storage.get<KeyboardShortcut[]>(KEYBOARD_SHORTCUTS_STORAGE_KEY);
    if (savedShortcuts) {
      this.shortcutsSignal.set(savedShortcuts);
    }
  }

  private setupGlobalKeyboardListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (!this.isEnabledSignal()) {
        return;
      }

      const targetElement = event.target as HTMLElement;
      if (
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.isContentEditable
      ) {
        return;
      }

      const matchedShortcut = this.findMatchingShortcut(event);
      if (matchedShortcut) {
        event.preventDefault();
        const shortcutHandler = this.shortcutHandlerRegistry.get(matchedShortcut.action);
        if (shortcutHandler) {
          shortcutHandler();
        }
      }
    });
  }

  private findMatchingShortcut(keyboardEvent: KeyboardEvent): KeyboardShortcut | undefined {
    return this.shortcutsSignal().find((shortcut) => {
      const keyMatches = shortcut.key.toLowerCase() === keyboardEvent.key.toLowerCase();
      const ctrlMatches = !shortcut.modifiers?.ctrl || keyboardEvent.ctrlKey;
      const altMatches = !shortcut.modifiers?.alt || keyboardEvent.altKey;
      const shiftMatches = !shortcut.modifiers?.shift || keyboardEvent.shiftKey;

      return keyMatches && ctrlMatches && altMatches && shiftMatches;
    });
  }

  registerHandler(action: ShortcutAction, handler: ShortcutHandler): void {
    this.shortcutHandlerRegistry.set(action, handler);
  }

  unregisterHandler(action: ShortcutAction): void {
    this.shortcutHandlerRegistry.delete(action);
  }

  updateShortcut(
    action: ShortcutAction,
    newKey: string,
    modifiers?: KeyboardShortcut['modifiers']
  ): void {
    this.shortcutsSignal.update((shortcuts) =>
      shortcuts.map((shortcut) =>
        shortcut.action === action ? { ...shortcut, key: newKey, modifiers } : shortcut
      )
    );
  }

  resetToDefaults(): void {
    this.shortcutsSignal.set([...DEFAULT_SHORTCUTS]);
  }

  enable(): void {
    this.isEnabledSignal.set(true);
  }

  disable(): void {
    this.isEnabledSignal.set(false);
  }

  getShortcut(action: ShortcutAction): KeyboardShortcut | undefined {
    return this.shortcutsSignal().find((shortcut) => shortcut.action === action);
  }
}
