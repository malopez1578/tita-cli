import { Logger } from '../types';
import { CommandExecutor } from './command';
export declare class ParallelInstaller {
    private readonly commandExecutor;
    private readonly logger;
    private readonly maxConcurrency;
    constructor(commandExecutor: CommandExecutor, logger: Logger, maxConcurrency?: number);
    installDependencies(packageJsonDirs: string[]): Promise<void>;
    private createBatches;
    private processBatch;
    installSingle(directory: string, silent?: boolean): Promise<void>;
}
//# sourceMappingURL=parallel-installer.d.ts.map