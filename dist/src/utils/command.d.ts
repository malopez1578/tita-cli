import { Logger } from '../types';
export interface CommandOptions {
    cwd?: string;
    silent?: boolean;
    timeout?: number;
    env?: Record<string, string>;
}
export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}
export declare class CommandExecutor {
    private readonly logger;
    constructor(logger: Logger);
    execute(command: string, options?: CommandOptions): Promise<CommandResult>;
    executeSync(command: string, options?: CommandOptions): CommandResult;
    checkPrerequisite(tool: string, versionCommand?: string): Promise<boolean>;
    ensurePrerequisite(tool: string, versionCommand?: string): Promise<void>;
    gitClone(repository: string, targetDir: string, options?: {
        branch?: string;
        depth?: number;
    }): Promise<void>;
    yarnInstall(projectDir: string, silent?: boolean): Promise<void>;
    gitInit(projectDir: string): Promise<void>;
    removeGitHistory(projectDir: string): Promise<void>;
}
//# sourceMappingURL=command.d.ts.map