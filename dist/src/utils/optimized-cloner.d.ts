import { Logger } from '../types';
import { CommandExecutor } from './command';
export declare class OptimizedCloner {
    private readonly commandExecutor;
    private readonly logger;
    constructor(commandExecutor: CommandExecutor, logger: Logger);
    cloneTemplate(gitUrl: string, targetPath: string, options?: {
        shallow?: boolean;
        depth?: number;
        branch?: string;
    }): Promise<void>;
    cloneTemplateWithFallback(gitUrl: string, targetPath: string, branch?: string): Promise<void>;
    updateTemplate(templatePath: string): Promise<void>;
    isGitRepository(path: string): Promise<boolean>;
    getRemoteUrl(path: string): Promise<string | null>;
}
//# sourceMappingURL=optimized-cloner.d.ts.map