import { ErrorHandler, Injectable, isDevMode } from '@angular/core';

export enum ErrorCategory {
  STORAGE = 'STORAGE',
  AUDIO = 'AUDIO',
  NOTIFICATION = 'NOTIFICATION',
  WAKE_LOCK = 'WAKE_LOCK',
  TIMER = 'TIMER',
  TASK = 'TASK',
  UNKNOWN = 'UNKNOWN',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AppError {
  category: ErrorCategory;
  message: string;
  originalError: Error;
  timestamp: Date;
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
  userId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GlobalErrorHandler implements ErrorHandler {
  private capturedErrors: AppError[] = [];
  private readonly maximumCapturedErrorsCount = 50;
  private isErrorReportingToExternalServiceEnabled = false;
  private reportedErrorHashSet = new Set<string>();
  private readonly maximumDuplicateErrorTrackingSize = 100;

  handleError(error: Error | AppError): void {
    const appError = this.normalizeError(error);
    this.logError(appError);
    this.reportError(appError);
  }

  logCategorizedError(
    category: ErrorCategory,
    message: string,
    originalError: Error,
    context?: Record<string, unknown>,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM
  ): void {
    const appError: AppError = {
      category,
      message,
      originalError,
      timestamp: new Date(),
      severity,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logError(appError);
    this.reportError(appError);
  }

  enableErrorReporting(): void {
    this.isErrorReportingToExternalServiceEnabled = true;
  }

  disableErrorReporting(): void {
    this.isErrorReportingToExternalServiceEnabled = false;
  }

  getRecentErrors(): ReadonlyArray<AppError> {
    return [...this.capturedErrors];
  }

  clearErrorLog(): void {
    this.capturedErrors = [];
  }

  private normalizeError(error: Error | AppError): AppError {
    if (this.isAppError(error)) {
      return error;
    }

    return {
      category: ErrorCategory.UNKNOWN,
      message: error.message || 'An unknown error occurred',
      originalError: error,
      timestamp: new Date(),
    };
  }

  private isAppError(error: Error | AppError): error is AppError {
    return 'category' in error && 'timestamp' in error;
  }

  private logError(error: AppError): void {
    this.capturedErrors.unshift(error);

    if (this.capturedErrors.length > this.maximumCapturedErrorsCount) {
      this.capturedErrors = this.capturedErrors.slice(0, this.maximumCapturedErrorsCount);
    }

    console.error(`[${error.category}] ${error.message}`, {
      timestamp: error.timestamp.toISOString(),
      error: error.originalError,
      context: error.context,
    });
  }

  private reportError(error: AppError): void {
    if (!this.isProductionEnvironment() || !this.isErrorReportingToExternalServiceEnabled) {
      return;
    }

    const errorHash = this.hashError(error);
    if (this.reportedErrorHashSet.has(errorHash)) {
      return;
    }

    this.reportedErrorHashSet.add(errorHash);

    if (this.reportedErrorHashSet.size > this.maximumDuplicateErrorTrackingSize) {
      this.reportedErrorHashSet.clear();
      this.reportedErrorHashSet.add(errorHash);
    }

    this.sendToErrorTracking(error);
  }

  private sendToErrorTracking(error: AppError): void {
    try {
      if (typeof (window as any).Sentry !== 'undefined') {
        (window as any).Sentry.captureException(error.originalError, {
          level: this.mapSeverityToSentryLevel(error.severity),
          tags: {
            category: error.category,
          },
          contexts: {
            error_details: {
              message: error.message,
              timestamp: error.timestamp.toISOString(),
              url: error.url,
              userAgent: error.userAgent,
            },
          },
          extra: error.context,
        });
      }

      if (this.shouldSendToCustomApi()) {
        this.sendToCustomApi(error);
      }

      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent('app-error', {
            detail: {
              category: error.category,
              message: error.message,
              severity: error.severity,
              timestamp: error.timestamp.toISOString(),
              context: error.context,
            },
          })
        );
      }
    } catch (reportingError) {
      console.warn('Failed to report error to tracking service', reportingError);
    }
  }

  private async sendToCustomApi(error: AppError): Promise<void> {
    try {
      const apiEndpoint = '/api/errors';

      const errorPayload = {
        category: error.category,
        message: error.message,
        severity: error.severity,
        timestamp: error.timestamp.toISOString(),
        url: error.url,
        userAgent: error.userAgent,
        userId: error.userId,
        stack: error.originalError.stack,
        context: error.context,
      };

      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 5000);

      await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorPayload),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
    } catch (error) {
      console.warn('Failed to send error to custom API', error);
    }
  }

  private hashError(error: AppError): string {
    const errorSignature = `${error.category}:${error.message}:${
      error.originalError.stack?.split('\n')[0] || ''
    }`;

    let hashValue = 0;
    for (let i = 0; i < errorSignature.length; i++) {
      const characterCode = errorSignature.charCodeAt(i);
      hashValue = (hashValue << 5) - hashValue + characterCode;
      hashValue = hashValue & hashValue;
    }
    return hashValue.toString(36);
  }

  private mapSeverityToSentryLevel(severity?: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'error';
    }
  }

  private shouldSendToCustomApi(): boolean {
    return false;
  }

  private isProductionEnvironment(): boolean {
    return !isDevMode();
  }
}
