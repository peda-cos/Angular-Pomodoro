export function tryExecute<T>(
  operation: () => T,
  fallbackValue: T,
  errorHandler?: (error: Error) => void
): T {
  try {
    return operation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
    return fallbackValue;
  }
}

export async function tryExecuteAsync<T>(
  asyncOperation: () => Promise<T>,
  fallbackValue: T,
  errorHandler?: (error: Error) => void
): Promise<T> {
  try {
    return await asyncOperation();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
    return fallbackValue;
  }
}

export async function retryWithExponentialBackoff<T>(
  asyncOperation: () => Promise<T>,
  retryConfiguration: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attemptNumber: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 100,
    maxDelayMs = 5000,
    backoffMultiplier = 2,
    onRetry,
  } = retryConfiguration;

  let mostRecentError: Error | null = null;

  for (let attemptIndex = 0; attemptIndex <= maxRetries; attemptIndex++) {
    try {
      return await asyncOperation();
    } catch (error) {
      mostRecentError = error instanceof Error ? error : new Error(String(error));

      if (attemptIndex === maxRetries) {
        throw mostRecentError;
      }

      if (onRetry) {
        onRetry(attemptIndex + 1, mostRecentError);
      }

      const delayBeforeNextAttempt = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attemptIndex),
        maxDelayMs
      );
      await delayExecution(delayBeforeNextAttempt);
    }
  }

  throw mostRecentError || new Error('Retry failed');
}

export function delayExecution(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function wrapWithErrorHandling<T extends (...args: any[]) => any>(
  operation: T,
  errorHandler?: (error: Error) => void
): T {
  return ((...args: Parameters<T>): ReturnType<T> | undefined => {
    try {
      return operation(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error instanceof Error ? error : new Error(String(error)));
      }
      return undefined;
    }
  }) as T;
}

export function coalesceToDefault<T>(value: T | null | undefined, defaultValue: T): T {
  return value ?? defaultValue;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

export function parseJsonWithFallback<T>(
  jsonString: string,
  fallbackValue: T,
  errorHandler?: (error: Error) => void
): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
    return fallbackValue;
  }
}

export function stringifyJsonWithFallback(
  value: unknown,
  fallbackValue = '{}',
  errorHandler?: (error: Error) => void
): string {
  try {
    return JSON.stringify(value);
  } catch (error) {
    if (errorHandler) {
      errorHandler(error instanceof Error ? error : new Error(String(error)));
    }
    return fallbackValue;
  }
}
