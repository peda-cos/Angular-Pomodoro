import { inject, Injectable, signal } from '@angular/core';
import { tryExecuteAsync } from '../utils/error-utils';
import { ErrorCategory, GlobalErrorHandler } from './error-handler.service';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly errorHandler = inject(GlobalErrorHandler);
  private readonly userPermission = signal<NotificationPermissionState>('default');

  readonly permission = this.userPermission.asReadonly();
  readonly isSupported = 'Notification' in window;

  constructor() {
    if (this.isSupported) {
      this.userPermission.set(Notification.permission);
    } else {
      console.warn('Notification API is not supported in this browser');
    }
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported) {
      this.errorHandler.logCategorizedError(
        ErrorCategory.NOTIFICATION,
        'Notification API not supported',
        new Error('Browser does not support Notification API'),
        { userAgent: navigator.userAgent }
      );
      return 'denied';
    }

    return await tryExecuteAsync(
      async () => {
        const permissionResult = await Notification.requestPermission();
        this.userPermission.set(permissionResult);
        return permissionResult;
      },
      'denied' as NotificationPermissionState,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.NOTIFICATION,
          'Failed to request notification permission',
          error,
          { currentPermission: this.userPermission() }
        );
      }
    );
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported) {
      console.warn('Notifications not supported - skipping notification');
      return;
    }

    if (this.userPermission() !== 'granted') {
      console.warn('Notification permission not granted - skipping notification');
      return;
    }

    await tryExecuteAsync(
      async () => {
        if (!title || typeof title !== 'string') {
          throw new Error('Invalid notification title');
        }

        const notification = new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          ...options,
        });

        setTimeout(() => {
          try {
            notification.close();
          } catch (error) {}
        }, 5000);

        notification.onerror = (event) => {
          this.errorHandler.logCategorizedError(
            ErrorCategory.NOTIFICATION,
            'Notification error event',
            new Error('Notification error'),
            { title, event }
          );
        };
      },
      undefined,
      (error) => {
        this.errorHandler.logCategorizedError(
          ErrorCategory.NOTIFICATION,
          'Failed to show notification',
          error,
          { title, options }
        );
      }
    );
  }

  async notifySessionComplete(sessionType: string): Promise<void> {
    const validSessionTypes = ['work', 'short-break', 'long-break'];
    if (!validSessionTypes.includes(sessionType)) {
      console.warn(`Invalid session type: ${sessionType}`);
      sessionType = 'work';
    }

    const completionMessages = {
      work: {
        title: 'Work Session Complete! 🎉',
        body: 'Great job! Time for a break.',
      },
      'short-break': {
        title: 'Break Complete! 💪',
        body: 'Ready to get back to work?',
      },
      'long-break': {
        title: 'Long Break Complete! ✨',
        body: 'Refreshed and ready for more focus time!',
      },
    };

    const messageToShow =
      completionMessages[sessionType as keyof typeof completionMessages] || completionMessages.work;

    await this.showNotification(messageToShow.title, {
      body: messageToShow.body,
      tag: 'pomodoro-session',
      requireInteraction: false,
    });
  }

  async notifySessionStart(sessionType: string): Promise<void> {
    const validSessionTypes = ['work', 'short-break', 'long-break'];
    if (!validSessionTypes.includes(sessionType)) {
      console.warn(`Invalid session type: ${sessionType}`);
      sessionType = 'work';
    }

    const startMessages = {
      work: 'Focus time started 🎯',
      'short-break': 'Short break started ☕',
      'long-break': 'Long break started 🌟',
    };

    const messageBody =
      startMessages[sessionType as keyof typeof startMessages] || startMessages.work;

    await this.showNotification('Pomodoro Timer', {
      body: messageBody,
      tag: 'pomodoro-session',
      silent: true,
    });
  }

  areNotificationsEnabled(): boolean {
    return this.isSupported && this.userPermission() === 'granted';
  }
}
