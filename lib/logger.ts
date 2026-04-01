/**
 * lib/logger.ts
 * 
 * A professional, structured logger for standardizing error reporting.
 * In production, this can be easily connected to Axiom, Datadog, or Sentry.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  context?: string;
  data?: any;
  userId?: string;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const payload: LogPayload = {
      message,
      level,
      timestamp: new Date().toISOString(),
      context,
      data,
    };

    if (this.isDev) {
      const color = {
        info:  "\x1b[36m", // Cyan
        warn:  "\x1b[33m", // Yellow
        error: "\x1b[31m", // Red
        debug: "\x1b[90m", // Gray
      }[level];
      const reset = "\x1b[0m";

      console.log(
        `${color}[${level.toUpperCase()}]${reset} ${message}`,
        data ? "\n" + JSON.stringify(data, null, 2) : ""
      );
    } else {
      // In production, send to persistent logging service
      // Example: fetch('/api/logs', { method: 'POST', body: JSON.stringify(payload) }).catch(() => {});
      console.log(JSON.stringify(payload));
    }
  }

  info(message: string, data?: any, context?: string) {
    this.log("info", message, data, context);
  }

  warn(message: string, data?: any, context?: string) {
    this.log("warn", message, data, context);
  }

  error(message: string, error?: any, context?: string) {
    // Extract stack if it's an actual Error object
    const errorData = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;
      
    this.log("error", message, errorData, context);
  }

  debug(message: string, data?: any, context?: string) {
    if (this.isDev) this.log("debug", message, data, context);
  }
}

export const logger = new Logger();
