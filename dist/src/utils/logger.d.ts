import { LogLevel, Logger } from '../types';
export declare class ConsoleLogger implements Logger {
    private logLevel;
    private readonly logFile?;
    constructor(logLevel?: LogLevel, logFile?: string);
    private writeToFile;
    error(message: string, error?: Error): void;
    warn(message: string): void;
    warning(message: string): void;
    info(message: string): void;
    debug(message: string): void;
    success(message: string): void;
    setLogLevel(level: LogLevel): void;
}
//# sourceMappingURL=logger.d.ts.map