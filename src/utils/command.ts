
import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import { CommandExecutionError, PrerequisiteError } from '../errors';
import { Logger } from '../types';

const execAsync = promisify(exec);

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

export class CommandExecutor {
  constructor(private readonly logger: Logger) {}

  async execute(command: string, options: CommandOptions = {}): Promise<CommandResult> {
    const {
      cwd = process.cwd(),
      silent = false,
      timeout = 30000,
      env = process.env
    } = options;

    if (!silent) {
      this.logger.debug(`Executing command: ${command}`);
    }

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        env: { ...env }
      });

      if (!silent && stderr) {
        this.logger.warn(`Command stderr: ${stderr}`);
      }

      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0
      };
    } catch (error: any) {
      const exitCode = error.code ?? 1;
      const stderr = error.stderr?.toString() ?? error.message;
      const stdout = error.stdout?.toString() ?? '';

      this.logger.error(`Command failed with exit code ${exitCode}: ${command}`);
      if (stderr) {
        this.logger.error(`Error output: ${stderr}`);
      }

      throw new CommandExecutionError(command, exitCode, {
        stdout,
        stderr,
        cwd,
        timeout
      });
    }
  }

  executeSync(command: string, options: CommandOptions = {}): CommandResult {
    const {
      cwd = process.cwd(),
      silent = false,
      env = process.env
    } = options;

    if (!silent) {
      this.logger.debug(`Executing command sync: ${command}`);
    }

    try {
      const stdout = execSync(command, {
        cwd,
        env: { ...env },
        stdio: silent ? 'pipe' : 'inherit',
        encoding: 'utf-8'
      });

      return {
        stdout: stdout?.toString() ?? '',
        stderr: '',
        exitCode: 0
      };
    } catch (error: any) {
      const exitCode = error.status ?? 1;
      const stderr = error.stderr?.toString() ?? error.message;
      const stdout = error.stdout?.toString() ?? '';

      this.logger.error(`Command failed with exit code ${exitCode}: ${command}`);
      if (stderr) {
        this.logger.error(`Error output: ${stderr}`);
      }

      throw new CommandExecutionError(command, exitCode, {
        stdout,
        stderr,
        cwd
      });
    }
  }

  async checkPrerequisite(tool: string, versionCommand?: string): Promise<boolean> {
    try {
      const command = versionCommand ?? `${tool} --version`;
      await this.execute(command, { silent: true });
      return true;
    }catch{
      return false;
    }
  }

  async ensurePrerequisite(tool: string, versionCommand?: string): Promise<void> {
    const isAvailable = await this.checkPrerequisite(tool, versionCommand);
    if (!isAvailable) {
      throw new PrerequisiteError(tool, {
        message: `${tool} is required but not found in PATH`,
        suggestion: `Please install ${tool} and ensure it's available in your PATH`
      });
    }
  }

  async gitClone(repository: string, targetDir: string, options: { branch?: string; depth?: number } = {}): Promise<void> {
    await this.ensurePrerequisite('git');

    let command = `git clone`;
    
    if (options.depth) {
      command += ` --depth ${options.depth}`;
    }
    
    if (options.branch) {
      command += ` --branch ${options.branch}`;
    }
    
    command += ` "${repository}" "${targetDir}"`;

    try {
      await this.execute(command, { silent: false });
      this.logger.success(`Successfully cloned repository to ${targetDir}`);
    } catch (error) {
      throw new CommandExecutionError(command, 1, {
        repository,
        targetDir,
        originalError: error
      });
    }
  }

  async yarnInstall(projectDir: string, silent: boolean = true): Promise<void> {
    await this.ensurePrerequisite('yarn');

    try {
      await this.execute('yarn && yarn prepare', {
        cwd: projectDir,
        silent
      });
      
      if (!silent) {
        this.logger.success('Dependencies installed successfully');
      }
    } catch (error) {
      throw new CommandExecutionError('yarn', 1, {
        projectDir,
        originalError: error
      });
    }
  }

  async gitInit(projectDir: string): Promise<void> {
    await this.ensurePrerequisite('git');

    try {
      await this.execute('git init', {
        cwd: projectDir,
        silent: true
      });
      
      this.logger.debug('Git repository initialized');
    } catch (error) {
      throw new CommandExecutionError('git init', 1, {
        projectDir,
        originalError: error
      });
    }
  }

  async removeGitHistory(projectDir: string): Promise<void> {
    try {
      // Remove .git directory to clean git history
      await this.execute('rm -rf .git', {
        cwd: projectDir,
        silent: true
      });
      
      this.logger.debug('Git history removed');
    } catch {
      // Non-critical error, just log it
      this.logger.warn('Failed to remove git history, continuing...');
    }
  }
}
