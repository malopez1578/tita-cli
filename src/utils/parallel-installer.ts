import * as path from 'path';
import { Logger } from '../types';
import { CommandExecutor } from './command';

export class ParallelInstaller {
  private readonly commandExecutor: CommandExecutor;
  private readonly logger: Logger;
  private readonly maxConcurrency: number;

  constructor(commandExecutor: CommandExecutor, logger: Logger, maxConcurrency = 3) {
    this.commandExecutor = commandExecutor;
    this.logger = logger;
    this.maxConcurrency = maxConcurrency;
  }

  async installDependencies(packageJsonDirs: string[]): Promise<void> {
    if (packageJsonDirs.length === 0) {
      this.logger.info('No package.json files found');
      return;
    }

    this.logger.info(`Found ${packageJsonDirs.length} package.json file(s), installing in parallel...`);
    
    // Procesar en lotes para evitar sobrecargar el sistema
    const batches = this.createBatches(packageJsonDirs, this.maxConcurrency);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.debug(`Processing batch ${i + 1}/${batches.length} (${batch.length} directories)`);
      await this.processBatch(batch);
    }

    this.logger.success('All dependencies installed successfully');
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(directories: string[]): Promise<void> {
    const promises = directories.map(async (dir) => {
      const relativePath = path.relative(process.cwd(), dir) || '.';
      this.logger.debug(`Installing dependencies in: ${relativePath}`);
      
      try {
        await this.commandExecutor.yarnInstall(dir, true); // Silent install
        this.logger.success(`✓ Dependencies installed in ${relativePath}`);
      } catch (error) {
        this.logger.error(`✗ Failed to install dependencies in ${relativePath}`, error as Error);
        throw error;
      }
    });

    await Promise.all(promises);
  }

  async installSingle(directory: string, silent = true): Promise<void> {
    const relativePath = path.relative(process.cwd(), directory) || '.';
    
    if (!silent) {
      this.logger.info(`Installing dependencies in: ${relativePath}`);
    }
    
    try {
      await this.commandExecutor.yarnInstall(directory, silent);
      
      if (!silent) {
        this.logger.success(`Dependencies installed in ${relativePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to install dependencies in ${relativePath}`, error as Error);
      throw error;
    }
  }
}
