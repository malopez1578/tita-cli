"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandExecutor = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const errors_1 = require("../errors");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class CommandExecutor {
    constructor(logger) {
        this.logger = logger;
    }
    async execute(command, options = {}) {
        const { cwd = process.cwd(), silent = false, timeout = 30000, env = process.env } = options;
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
        }
        catch (error) {
            const exitCode = error.code ?? 1;
            const stderr = error.stderr?.toString() ?? error.message;
            const stdout = error.stdout?.toString() ?? '';
            this.logger.error(`Command failed with exit code ${exitCode}: ${command}`);
            if (stderr) {
                this.logger.error(`Error output: ${stderr}`);
            }
            throw new errors_1.CommandExecutionError(command, exitCode, {
                stdout,
                stderr,
                cwd,
                timeout
            });
        }
    }
    executeSync(command, options = {}) {
        const { cwd = process.cwd(), silent = false, env = process.env } = options;
        if (!silent) {
            this.logger.debug(`Executing command sync: ${command}`);
        }
        try {
            const stdout = (0, child_process_1.execSync)(command, {
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
        }
        catch (error) {
            const exitCode = error.status ?? 1;
            const stderr = error.stderr?.toString() ?? error.message;
            const stdout = error.stdout?.toString() ?? '';
            this.logger.error(`Command failed with exit code ${exitCode}: ${command}`);
            if (stderr) {
                this.logger.error(`Error output: ${stderr}`);
            }
            throw new errors_1.CommandExecutionError(command, exitCode, {
                stdout,
                stderr,
                cwd
            });
        }
    }
    async checkPrerequisite(tool, versionCommand) {
        try {
            const command = versionCommand ?? `${tool} --version`;
            await this.execute(command, { silent: true });
            return true;
        }
        catch {
            return false;
        }
    }
    async ensurePrerequisite(tool, versionCommand) {
        const isAvailable = await this.checkPrerequisite(tool, versionCommand);
        if (!isAvailable) {
            throw new errors_1.PrerequisiteError(tool, {
                message: `${tool} is required but not found in PATH`,
                suggestion: `Please install ${tool} and ensure it's available in your PATH`
            });
        }
    }
    async gitClone(repository, targetDir, options = {}) {
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
        }
        catch (error) {
            throw new errors_1.CommandExecutionError(command, 1, {
                repository,
                targetDir,
                originalError: error
            });
        }
    }
    async yarnInstall(projectDir, silent = true) {
        await this.ensurePrerequisite('yarn');
        try {
            await this.execute('yarn install', {
                cwd: projectDir,
                silent
            });
            if (!silent) {
                this.logger.success('Dependencies installed successfully');
            }
        }
        catch (error) {
            throw new errors_1.CommandExecutionError('yarn install', 1, {
                projectDir,
                originalError: error
            });
        }
    }
    async gitInit(projectDir) {
        await this.ensurePrerequisite('git');
        try {
            await this.execute('git init', {
                cwd: projectDir,
                silent: true
            });
            this.logger.debug('Git repository initialized');
        }
        catch (error) {
            throw new errors_1.CommandExecutionError('git init', 1, {
                projectDir,
                originalError: error
            });
        }
    }
    async removeGitHistory(projectDir) {
        try {
            // Remove .git directory to clean git history
            await this.execute('rm -rf .git', {
                cwd: projectDir,
                silent: true
            });
            this.logger.debug('Git history removed');
        }
        catch {
            // Non-critical error, just log it
            this.logger.warn('Failed to remove git history, continuing...');
        }
    }
}
exports.CommandExecutor = CommandExecutor;
//# sourceMappingURL=command.js.map