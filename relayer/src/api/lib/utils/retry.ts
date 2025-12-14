import { logger } from './logger';

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn({ attempt: i + 1, error: err }, 'Retry attempt failed');
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }

  throw lastError;
}
