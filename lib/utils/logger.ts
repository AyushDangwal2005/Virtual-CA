export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: Record<string, any>;
  error?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, service, message } = entry;
    return `[${timestamp}] [${level}] [${service}] ${message}`;
  }

  private log(entry: LogEntry): void {
    const formatted = this.formatMessage(entry);

    // Log based on level
    switch (entry.level) {
      case LogLevel.DEBUG:
        if (this.isDevelopment) console.debug(formatted, entry.data);
        break;
      case LogLevel.INFO:
        console.log(formatted, entry.data);
        break;
      case LogLevel.WARN:
        console.warn(formatted, entry.data);
        break;
      case LogLevel.ERROR:
        console.error(formatted, entry.error || entry.data);
        break;
    }

    // In production, send to monitoring service (e.g., Sentry)
    // if (!this.isDevelopment) {
    //   sendToMonitoring(entry);
    // }
  }

  debug(service: string, message: string, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      service,
      message,
      data,
    });
  }

  info(service: string, message: string, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      service,
      message,
      data,
    });
  }

  warn(service: string, message: string, data?: Record<string, any>): void {
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      service,
      message,
      data,
    });
  }

  error(service: string, message: string, error?: Error | unknown, data?: Record<string, any>): void {
    const errorStr = error instanceof Error ? error.stack : String(error);
    this.log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      service,
      message,
      error: errorStr,
      data,
    });
  }
}

export const logger = new Logger();
