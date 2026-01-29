/**
 * Logger utility for conditional debug logging
 * Logs are only printed in development mode
 */

const isDev = import.meta.env?.DEV ?? (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

export const logger = {
  log: (prefix: string, message: string, ...data: unknown[]) => {
    if (isDev) {
      console.log(`[${prefix}] ${message}`, ...data);
    }
  },
  warn: (prefix: string, message: string, ...data: unknown[]) => {
    if (isDev) {
      console.warn(`[${prefix}] ${message}`, ...data);
    }
  },
  error: (prefix: string, message: string, ...data: unknown[]) => {
    // Errors are always logged
    console.error(`[${prefix}] ${message}`, ...data);
  },
};

export default logger;
