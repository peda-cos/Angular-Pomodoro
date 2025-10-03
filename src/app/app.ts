import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { KeyboardShortcutService } from './core/services/keyboard-shortcut.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit, OnDestroy {
  private keyboardShortcutService = inject(KeyboardShortcutService);
  private router = inject(Router);

  readonly title = 'Pomodoro Timer';
  readonly isShowingKeyboardShortcutsHelp = signal(false);
  readonly allKeyboardShortcuts = this.keyboardShortcutService.allShortcuts;

  ngOnInit(): void {
    this.registerGlobalKeyboardShortcuts();
  }

  ngOnDestroy(): void {
    this.unregisterGlobalKeyboardShortcuts();
  }

  private registerGlobalKeyboardShortcuts(): void {
    this.keyboardShortcutService.registerHandler('open-task-quick-add', () => {
      this.navigateToTasksAndOpenQuickAdd();
    });

    this.keyboardShortcutService.registerHandler('open-settings', () => {
      this.navigateToSettings();
    });

    this.keyboardShortcutService.registerHandler('show-help', () => {
      this.toggleKeyboardShortcutsHelp();
    });
  }

  private unregisterGlobalKeyboardShortcuts(): void {
    this.keyboardShortcutService.unregisterHandler('open-task-quick-add');
    this.keyboardShortcutService.unregisterHandler('open-settings');
    this.keyboardShortcutService.unregisterHandler('show-help');
  }

  private navigateToTasksAndOpenQuickAdd(): void {
    this.router.navigate(['/tasks']).then(() => {
      const addTaskEvent = new CustomEvent('trigger-add-task');
      window.dispatchEvent(addTaskEvent);
    });
  }

  private navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  private toggleKeyboardShortcutsHelp(): void {
    this.isShowingKeyboardShortcutsHelp.update((isShowing) => !isShowing);
  }

  closeKeyboardShortcutsHelp(): void {
    this.isShowingKeyboardShortcutsHelp.set(false);
  }
}
