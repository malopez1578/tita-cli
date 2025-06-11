import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { LogLevel, Logger } from '../types';

export class ConsoleLogger implements Logger {
  private logLevel: LogLevel;
  private readonly logFile?: string;

  constructor(logLevel: LogLevel = LogLevel.INFO, logFile?: string) {
    this.logLevel = logLevel;
    this.logFile = logFile;
  }

  private writeToFile(level: string, message: string, error?: Error): void {
    if (!this.logFile) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };

    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (writeError) {
      // Fallback to console if file writing fails
      console.error('Failed to write to log file:', writeError);
    }
  }

  error(message: string, error?: Error): void {
    if (this.logLevel >= LogLevel.ERROR) {
      console.error(chalk.red(`❌ ${message}`));
      if (error && this.logLevel >= LogLevel.DEBUG) {
        console.error(chalk.red(error.stack ?? error.message));
      }
    }
    this.writeToFile('ERROR', message, error);
  }

  warn(message: string): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(chalk.yellow(`⚠️  ${message}`));
    }
    this.writeToFile('WARN', message);
  }

  warning(message: string): void {
    if (this.logLevel >= LogLevel.WARN) {
      console.warn(chalk.yellow(`⚠️  ${message}`));
    }
    this.writeToFile('WARNING', message);
  }

  info(message: string): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.info(chalk.blue(`ℹ️  ${message}`));
    }
    this.writeToFile('INFO', message);
  }

  debug(message: string): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      console.debug(chalk.gray(`🔍 ${message}`));
    }
    this.writeToFile('DEBUG', message);
  }

  success(message: string): void {
    if (this.logLevel >= LogLevel.INFO) {
      console.log(chalk.green(`✅ ${message}`));
    }
    this.writeToFile('SUCCESS', message);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}
