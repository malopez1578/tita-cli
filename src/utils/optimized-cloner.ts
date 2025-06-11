import { Logger } from '../types';
import { CommandExecutor } from './command';

export class OptimizedCloner {
  private readonly commandExecutor: CommandExecutor;
  private readonly logger: Logger;

  constructor(commandExecutor: CommandExecutor, logger: Logger) {
    this.commandExecutor = commandExecutor;
    this.logger = logger;
  }

  async cloneTemplate(gitUrl: string, targetPath: string, options: { 
    shallow?: boolean; 
    depth?: number; 
    branch?: string; 
  } = {}): Promise<void> {
    const { shallow = true, depth = 1, branch } = options;

    let cloneCmd: string;
    
    if (shallow) {
      // Clone shallow (solo el último commit) para reducir datos descargados
      cloneCmd = `git clone --depth ${depth} --single-branch`;
      
      if (branch) {
        cloneCmd += ` --branch "${branch}"`;
      }
      
      cloneCmd += ` "${gitUrl}" "${targetPath}"`;
      
      this.logger.debug('Performing shallow clone to optimize download size...');
    } else {
      // Full clone como fallback
      cloneCmd = `git clone "${gitUrl}" "${targetPath}"`;
      this.logger.debug('Performing full clone...');
    }

    try {
      await this.commandExecutor.execute(cloneCmd, { silent: true });
      this.logger.success(`Template cloned successfully${shallow ? ' (optimized)' : ''}`);
    } catch (error) {
      if (shallow) {
        // Si falla el shallow clone, intentar con full clone
        this.logger.warn('Shallow clone failed, retrying with full clone...');
        await this.cloneTemplate(gitUrl, targetPath, { shallow: false });
      } else {
        throw error;
      }
    }
  }

  async cloneTemplateWithFallback(gitUrl: string, targetPath: string, branch?: string): Promise<void> {
    try {
      // Intentar clone shallow primero (más rápido)
      await this.cloneTemplate(gitUrl, targetPath, { shallow: true, branch });
    } catch {
      this.logger.warn('Optimized clone failed, falling back to standard clone...');
      
      try {
        // Fallback a clone completo si falla
        await this.cloneTemplate(gitUrl, targetPath, { shallow: false, branch });
      } catch (fallbackError) {
        this.logger.error('Both optimized and standard clone failed');
        throw fallbackError;
      }
    }
  }

  async updateTemplate(templatePath: string): Promise<void> {
    this.logger.debug('Updating template from remote...');
    
    try {
      // Intentar pull optimizado
      await this.commandExecutor.execute('git pull --depth 1', { 
        cwd: templatePath, 
        silent: true 
      });
      this.logger.success('Template updated successfully');
    } catch (error) {
      this.logger.warn('Failed to update template, it may need to be re-cloned');
      throw error;
    }
  }

  async isGitRepository(path: string): Promise<boolean> {
    try {
      await this.commandExecutor.execute('git rev-parse --git-dir', { 
        cwd: path, 
        silent: true 
      });
      return true;
    } catch {
      return false;
    }
  }

  async getRemoteUrl(path: string): Promise<string | null> {
    try {
      const result = await this.commandExecutor.execute('git remote get-url origin', { 
        cwd: path, 
        silent: true 
      });
      return result.stdout.trim();
    } catch {
      return null;
    }
  }
}
