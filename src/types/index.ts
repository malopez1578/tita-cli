
export interface TemplateConfig {
  name: string;
  gitlabUrl: string;
  description: string;
}

export interface UserConfig {
  defaultVendor?: string;
  defaultAuthor?: string;
  defaultLicense?: string;
  preferredTemplates?: string[];
  cacheDirectory?: string;
  logLevel?: LogLevel;
}

export interface ProjectDetails {
  version: string;
  targetDirectory: string;
}

export interface VendorInfo {
  vendor: string;
}

export interface ComponentInfo {
  name: string;
  title: string;
  description: string;
}

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface CommandContext {
  config: UserConfig;
  logger: Logger;
  workingDirectory: string;
}

export interface Logger {
  error(message: string, error?: Error): void;
  warn(message: string): void;
  warning(message: string): void;
  info(message: string): void;
  debug(message: string): void;
  success(message: string): void;
}
