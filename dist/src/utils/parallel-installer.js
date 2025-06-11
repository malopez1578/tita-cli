"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParallelInstaller = void 0;
const path = __importStar(require("path"));
class ParallelInstaller {
    constructor(commandExecutor, logger, maxConcurrency = 3) {
        this.commandExecutor = commandExecutor;
        this.logger = logger;
        this.maxConcurrency = maxConcurrency;
    }
    async installDependencies(packageJsonDirs) {
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
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    async processBatch(directories) {
        const promises = directories.map(async (dir) => {
            const relativePath = path.relative(process.cwd(), dir) || '.';
            this.logger.debug(`Installing dependencies in: ${relativePath}`);
            try {
                await this.commandExecutor.yarnInstall(dir, true); // Silent install
                this.logger.success(`✓ Dependencies installed in ${relativePath}`);
            }
            catch (error) {
                this.logger.error(`✗ Failed to install dependencies in ${relativePath}`, error);
                throw error;
            }
        });
        await Promise.all(promises);
    }
    async installSingle(directory, silent = true) {
        const relativePath = path.relative(process.cwd(), directory) || '.';
        if (!silent) {
            this.logger.info(`Installing dependencies in: ${relativePath}`);
        }
        try {
            await this.commandExecutor.yarnInstall(directory, silent);
            if (!silent) {
                this.logger.success(`Dependencies installed in ${relativePath}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to install dependencies in ${relativePath}`, error);
            throw error;
        }
    }
}
exports.ParallelInstaller = ParallelInstaller;
//# sourceMappingURL=parallel-installer.js.map