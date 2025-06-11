"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizedCloner = void 0;
class OptimizedCloner {
    constructor(commandExecutor, logger) {
        this.commandExecutor = commandExecutor;
        this.logger = logger;
    }
    async cloneTemplate(gitUrl, targetPath, options = {}) {
        const { shallow = true, depth = 1, branch } = options;
        let cloneCmd;
        if (shallow) {
            // Clone shallow (solo el último commit) para reducir datos descargados
            cloneCmd = `git clone --depth ${depth} --single-branch`;
            if (branch) {
                cloneCmd += ` --branch "${branch}"`;
            }
            cloneCmd += ` "${gitUrl}" "${targetPath}"`;
            this.logger.debug('Performing shallow clone to optimize download size...');
        }
        else {
            // Full clone como fallback
            cloneCmd = `git clone "${gitUrl}" "${targetPath}"`;
            this.logger.debug('Performing full clone...');
        }
        try {
            await this.commandExecutor.execute(cloneCmd, { silent: true });
            this.logger.success(`Template cloned successfully${shallow ? ' (optimized)' : ''}`);
        }
        catch (error) {
            if (shallow) {
                // Si falla el shallow clone, intentar con full clone
                this.logger.warn('Shallow clone failed, retrying with full clone...');
                await this.cloneTemplate(gitUrl, targetPath, { shallow: false });
            }
            else {
                throw error;
            }
        }
    }
    async cloneTemplateWithFallback(gitUrl, targetPath, branch) {
        try {
            // Intentar clone shallow primero (más rápido)
            await this.cloneTemplate(gitUrl, targetPath, { shallow: true, branch });
        }
        catch {
            this.logger.warn('Optimized clone failed, falling back to standard clone...');
            try {
                // Fallback a clone completo si falla
                await this.cloneTemplate(gitUrl, targetPath, { shallow: false, branch });
            }
            catch (fallbackError) {
                this.logger.error('Both optimized and standard clone failed');
                throw fallbackError;
            }
        }
    }
    async updateTemplate(templatePath) {
        this.logger.debug('Updating template from remote...');
        try {
            // Intentar pull optimizado
            await this.commandExecutor.execute('git pull --depth 1', {
                cwd: templatePath,
                silent: true
            });
            this.logger.success('Template updated successfully');
        }
        catch (error) {
            this.logger.warn('Failed to update template, it may need to be re-cloned');
            throw error;
        }
    }
    async isGitRepository(path) {
        try {
            await this.commandExecutor.execute('git rev-parse --git-dir', {
                cwd: path,
                silent: true
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async getRemoteUrl(path) {
        try {
            const result = await this.commandExecutor.execute('git remote get-url origin', {
                cwd: path,
                silent: true
            });
            return result.stdout.trim();
        }
        catch {
            return null;
        }
    }
}
exports.OptimizedCloner = OptimizedCloner;
//# sourceMappingURL=optimized-cloner.js.map