import { Injectable, signal } from '@angular/core';

export type NotificationPermissionState = 'default' | 'granted' | 'denied';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly permissionStateSignal = signal<NotificationPermissionState>('default');

  readonly permission = this.permissionStateSignal.asReadonly();
  readonly isSupported = 'Notification' in window;

  constructor() {
    if (this.isSupported) {
      this.permissionStateSignal.set(Notification.permission);
    }
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    if (!this.isSupported) {
      return 'denied';
    }

    try {
      const permissionResult = await Notification.requestPermission();
      this.permissionStateSignal.set(permissionResult);
      return permissionResult;
    } catch (error) {
      console.error('Failed to request notification permission', error);
      return 'denied';
    }
  }

  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.isSupported || this.permissionStateSignal() !== 'granted') {
      console.warn('Notifications not available or not permitted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options,
      });

      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error('Failed to show notification', error);
    }
  }

  async notifySessionComplete(sessionType: string): Promise<void> {
    const notificationMessages = {
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

    const selectedMessage =
      notificationMessages[sessionType as keyof typeof notificationMessages] ||
      notificationMessages.work;

    await this.showNotification(selectedMessage.title, {
      body: selectedMessage.body,
      tag: 'pomodoro-session',
      requireInteraction: false,
    });
  }

  async notifySessionStart(sessionType: string): Promise<void> {
    const sessionStartMessages = {
      work: 'Focus time started 🎯',
      'short-break': 'Short break started ☕',
      'long-break': 'Long break started 🌟',
    };

    const notificationBody =
      sessionStartMessages[sessionType as keyof typeof sessionStartMessages] ||
      sessionStartMessages.work;

    await this.showNotification('Pomodoro Timer', {
      body: notificationBody,
      tag: 'pomodoro-session',
      silent: true,
    });
  }
}
