#!/usr/bin/env node
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const fs = __importStar(require("fs"));
const inquirer_1 = __importDefault(require("inquirer"));
const ora_1 = __importDefault(require("ora"));
const path = __importStar(require("path"));
// Import our new modular components
const templates_1 = require("../constants/templates");
const config_1 = require("./config");
const errors_1 = require("./errors");
const templateCache_1 = require("./services/templateCache");
const types_1 = require("./types");
const command_1 = require("./utils/command");
const logger_1 = require("./utils/logger");
const validation_1 = require("./utils/validation");
// Performance optimizations
const fast_file_finder_1 = require("./utils/fast-file-finder");
const optimized_cloner_1 = require("./utils/optimized-cloner");
const parallel_installer_1 = require("./utils/parallel-installer");
const smart_cache_1 = require("./utils/smart-cache");
const program = new commander_1.Command();
// Initialize global services
const configManager = config_1.ConfigManager.getInstance();
const config = configManager.getConfig();
const logger = new logger_1.ConsoleLogger(config.logLevel, path.join(configManager.getCacheDirectory(), 'tita.log'));
const commandExecutor = new command_1.CommandExecutor(logger);
const templateCache = new templateCache_1.TemplateCache(configManager.getCacheDirectory(), logger);
// Initialize performance-optimized services
const optimizedCloner = new optimized_cloner_1.OptimizedCloner(commandExecutor, logger);
const smartCache = new smart_cache_1.SmartCache(logger, optimizedCloner);
const parallelInstaller = new parallel_installer_1.ParallelInstaller(commandExecutor, logger);
const fastFileFinder = new fast_file_finder_1.FastFileFinder();
// Convert URL_TEMPLATES to TemplateConfig format
const templates = Object.entries(templates_1.URL_TEMPLATES).map(([name, url]) => ({
    name,
    gitlabUrl: url,
    description: `${name.charAt(0).toUpperCase() + name.slice(1)} template`,
    category: 'general',
    tags: []
}));
class TitaCLI {
    constructor() {
        this.context = {
            config,
            logger,
            workingDirectory: process.cwd()
        };
        this.commandExecutor = commandExecutor;
    }
    showBanner() {
        console.log(chalk_1.default.cyan(figlet_1.default.textSync('TITA CLI', { horizontalLayout: 'full' })));
        console.log(chalk_1.default.gray('CLI for creating projects from GitLab templates\n'));
    }
    async selectTemplate() {
        const preferredTemplates = this.context.config.preferredTemplates || [];
        // Sort templates with preferred ones first
        const sortedTemplates = [...templates].sort((a, b) => {
            const aPreferred = preferredTemplates.includes(a.name);
            const bPreferred = preferredTemplates.includes(b.name);
            if (aPreferred && !bPreferred)
                return -1;
            if (!aPreferred && bPreferred)
                return 1;
            return a.name.localeCompare(b.name);
        });
        const choices = sortedTemplates.map(template => ({
            name: `${template.name}${preferredTemplates.includes(template.name) ? ' ⭐' : ''} - ${template.description}`,
            value: template
        }));
        const { selectedTemplate } = await inquirer_1.default.prompt([
            {
                type: 'list',
                name: 'selectedTemplate',
                message: 'Select a template:',
                choices,
                pageSize: 10
            }
        ]);
        return selectedTemplate;
    }
    async getProjectDetails(defaultDir = '.') {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'name',
                message: 'Enter project name:',
                validate: (input) => {
                    try {
                        validation_1.ValidationUtils.validateProjectName(input);
                        return true;
                    }
                    catch (error) {
                        return error.message;
                    }
                }
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter project description:',
                validate: (input) => {
                    try {
                        validation_1.ValidationUtils.validateDescription(input);
                        return true;
                    }
                    catch (error) {
                        return error.message;
                    }
                }
            },
            {
                type: 'input',
                name: 'version',
                message: 'Enter initial version:',
                default: '1.0.0',
                validate: (input) => {
                    try {
                        validation_1.ValidationUtils.validateVersion(input);
                        return true;
                    }
                    catch (error) {
                        return error.message;
                    }
                }
            },
            {
                type: 'input',
                name: 'targetDirectory',
                message: 'Enter target directory:',
                default: defaultDir,
                validate: (input) => {
                    try {
                        validation_1.ValidationUtils.validateDirectoryPath(input);
                        return true;
                    }
                    catch (error) {
                        return error.message;
                    }
                }
            }
        ]);
        return {
            name: answers.name,
            description: answers.description,
            version: answers.version,
            targetDirectory: answers.targetDirectory
        };
    }
    async getVendorInfo() {
        const defaultVendor = this.context.config.defaultVendor;
        const { vendor } = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'vendor',
                message: 'Enter vendor name:',
                default: defaultVendor,
                validate: (input) => {
                    try {
                        validation_1.ValidationUtils.validateVendorName(input);
                        return true;
                    }
                    catch (error) {
                        return error.message;
                    }
                }
            }
        ]);
        // Save as default if user wants
        if (vendor !== defaultVendor && vendor.trim()) {
            const { saveAsDefault } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'saveAsDefault',
                    message: 'Save this vendor as default for future projects?',
                    default: false
                }
            ]);
            if (saveAsDefault) {
                configManager.setDefaultVendor(vendor);
                this.context.logger.info('Vendor saved as default');
            }
        }
        return { vendor };
    }
    async getComponentInfo(defaultName) {
        const answers = await inquirer_1.default.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter component title:',
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Component title cannot be empty';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'description',
                message: 'Enter component description:',
                validate: (input) => {
                    if (!input.trim()) {
                        return 'Component description cannot be empty';
                    }
                    return true;
                }
            }
        ]);
        return {
            name: defaultName ?? '',
            title: answers.title,
            description: answers.description
        };
    }
    async installDependencies(projectPath) {
        const packageJsonDirs = fastFileFinder.findPackageJsonFiles(projectPath);
        if (packageJsonDirs.length === 0) {
            this.context.logger.info('No package.json files found, skipping dependency installation');
            return;
        }
        const spinner = (0, ora_1.default)('Installing dependencies with Yarn (parallel)...').start();
        try {
            await parallelInstaller.installDependencies(packageJsonDirs);
            spinner.succeed(chalk_1.default.green('All dependencies installed successfully'));
        }
        catch (error) {
            spinner.fail(chalk_1.default.red('Failed to install dependencies'));
            // Non-critical error, but log it
            this.context.logger.error('Dependency installation failed', error);
            this.context.logger.info('You can manually install dependencies later using: yarn install');
        }
    }
    findManifestFile(projectPath) {
        const manifestDirs = fastFileFinder.findManifestFiles(projectPath);
        if (manifestDirs.length > 0) {
            return path.join(manifestDirs[0], 'manifest.json');
        }
        return null;
    }
    updateManifestInfo(projectPath, vendor, componentInfo, projectDetails) {
        const manifestPath = this.findManifestFile(projectPath);
        if (!manifestPath) {
            this.context.logger.warn('No manifest.json file found. Skipping manifest update.');
            return;
        }
        const spinner = (0, ora_1.default)('Updating manifest.json...').start();
        try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);
            // Update manifest fields
            manifest.vendor = vendor;
            manifest.name = componentInfo.name;
            manifest.title = componentInfo.title;
            manifest.description = componentInfo.description;
            if (projectDetails?.version) {
                manifest.version = projectDetails.version;
            }
            // Write back to file with proper formatting
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
            const relativePath = path.relative(projectPath, manifestPath);
            spinner.succeed(chalk_1.default.green(`Component info updated in ${relativePath}`));
            this.context.logger.info(`Manifest updated:`);
            this.context.logger.info(`  • Vendor: ${vendor}`);
            this.context.logger.info(`  • Name: ${componentInfo.name}`);
            this.context.logger.info(`  • Title: ${componentInfo.title}`);
            this.context.logger.info(`  • Description: ${componentInfo.description}`);
        }
        catch (error) {
            spinner.fail(chalk_1.default.red('Failed to update manifest.json'));
            throw new errors_1.ManifestError('update', manifestPath, error);
        }
    }
    async confirmAction(message) {
        const { confirmed } = await inquirer_1.default.prompt([
            {
                type: 'confirm',
                name: 'confirmed',
                message,
                default: false
            }
        ]);
        return confirmed;
    }
    async checkPrerequisites() {
        const requirements = [
            { name: 'Git', command: 'git' },
            { name: 'Yarn', command: 'yarn' }
        ];
        this.context.logger.info('Checking prerequisites...');
        for (const req of requirements) {
            try {
                await this.commandExecutor.ensurePrerequisite(req.command);
                this.context.logger.success(`${req.name} is available`);
            }
            catch (error) {
                this.context.logger.error(`${req.name} is not available`);
                throw error;
            }
        }
    }
    // Command implementations
    async createProject() {
        try {
            this.showBanner();
            await this.checkPrerequisites();
            const template = await this.selectTemplate();
            const projectDetails = await this.getProjectDetails();
            const vendorInfo = await this.getVendorInfo();
            const componentInfo = await this.getComponentInfo(projectDetails.name);
            // Use project name as component name
            componentInfo.name = projectDetails.name;
            const projectPath = path.resolve(projectDetails.targetDirectory, projectDetails.name);
            // Check if directory already exists
            if (fs.existsSync(projectPath)) {
                const overwrite = await this.confirmAction(`Directory "${projectPath}" already exists. Do you want to overwrite it?`);
                if (!overwrite) {
                    this.context.logger.info('Project creation cancelled');
                    return;
                }
                fs.rmSync(projectPath, { recursive: true, force: true });
            }
            // Check cache first using SmartCache
            let sourcePath;
            if (smartCache.hasTemplate(template.name) && await smartCache.isTemplateValid(template.name, template.gitlabUrl)) {
                this.context.logger.info('Using cached template');
                sourcePath = await smartCache.getTemplate(template.name, template.gitlabUrl);
            }
            else {
                // Clone and cache using SmartCache
                const spinner = (0, ora_1.default)('Cloning template...').start();
                try {
                    sourcePath = await smartCache.getTemplate(template.name, template.gitlabUrl);
                    spinner.succeed(chalk_1.default.green('Template cloned and cached'));
                }
                catch (error) {
                    spinner.fail(chalk_1.default.red('Failed to clone template'));
                    throw error;
                }
            }
            // Copy from cache to project location
            this.copyDirectory(sourcePath, projectPath);
            // Clean git history
            await this.commandExecutor.removeGitHistory(projectPath);
            // Update manifest
            this.updateManifestInfo(projectPath, vendorInfo.vendor, componentInfo, projectDetails);
            // Install dependencies
            await this.installDependencies(projectPath);
            // Initialize new git repository
            await this.commandExecutor.gitInit(projectPath);
            // Add template to preferred if successful
            configManager.addPreferredTemplate(template.name);
            this.context.logger.success(`\n🎉 Project "${projectDetails.name}" created successfully!`);
            this.context.logger.info(`📁 Location: ${projectPath}`);
            this.context.logger.info('🚀 Your project is ready to use!');
        }
        catch (error) {
            this.handleError(error);
        }
    }
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const items = fs.readdirSync(src);
        for (const item of items) {
            if (item === '.git')
                continue; // Skip .git directory
            const srcPath = path.join(src, item);
            const destPath = path.join(dest, item);
            const stats = fs.statSync(srcPath);
            if (stats.isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }
    async listTemplates() {
        this.context.logger.info('\n📋 Available Templates:\n');
        templates.forEach((template, index) => {
            const preferred = configManager.getPreferredTemplates().includes(template.name);
            console.log(`${index + 1}. ${chalk_1.default.cyan(template.name)}${preferred ? ' ⭐' : ''}`);
            console.log(`   ${chalk_1.default.gray(template.description)}`);
            console.log(`   ${chalk_1.default.blue(template.gitlabUrl)}\n`);
        });
    }
    handleError(error) {
        if (error instanceof errors_1.TitaError) {
            this.context.logger.error(error.message);
            if (this.context.config.logLevel === types_1.LogLevel.DEBUG) {
                this.context.logger.debug(`Error code: ${error.code}`);
                this.context.logger.debug(`Error details: ${JSON.stringify(error.details, null, 2)}`);
            }
        }
        else {
            this.context.logger.error('An unexpected error occurred', error);
        }
        process.exit(1);
    }
}
// Initialize CLI
const cli = new TitaCLI();
// Configure program
program
    .name('tita')
    .description('CLI for creating projects from GitLab templates')
    .version('1.1.0');
program
    .command('create')
    .description('Create a new project from a template')
    .action(async () => {
    await cli.createProject();
});
program
    .command('list')
    .description('List all available templates')
    .action(async () => {
    await cli.listTemplates();
});
program
    .command('cache')
    .description('Manage template cache')
    .option('--clear', 'Clear the template cache')
    .option('--stats', 'Show cache statistics')
    .option('--list', 'List cached templates')
    .action(async (options) => {
    if (options.clear) {
        await smartCache.clearAll();
        console.log(chalk_1.default.green('✅ Cache cleared successfully'));
    }
    else if (options.stats) {
        const stats = smartCache.getCacheStats();
        console.log(chalk_1.default.cyan('\n📊 Cache Statistics:'));
        console.log(`Templates: ${stats.totalTemplates}`);
        console.log(`Total size: ${stats.totalSize}`);
        console.log(`Oldest cache: ${stats.oldestCache}`);
        console.log(`Most used: ${stats.mostUsed}`);
        console.log(`Avg hit rate: ${stats.hitRate}`);
    }
    else if (options.list) {
        const metadata = smartCache.getMetadata();
        const templates = Object.keys(metadata);
        if (templates.length === 0) {
            console.log(chalk_1.default.yellow('No templates are currently cached'));
        }
        else {
            console.log(chalk_1.default.cyan('\n📋 Cached Templates:'));
            templates.forEach(templateName => {
                const meta = metadata[templateName];
                const sizeMB = (meta.size / 1024 / 1024).toFixed(2);
                console.log(`• ${templateName} (${sizeMB} MB)`);
                console.log(`  Updated: ${new Date(meta.lastUpdated).toLocaleString()}`);
                console.log(`  Last accessed: ${new Date(meta.lastAccessed).toLocaleString()}`);
                console.log(`  Hits: ${meta.hits}`);
            });
        }
    }
    else {
        console.log(chalk_1.default.yellow('Please specify an option: --clear, --stats, or --list'));
    }
});
program
    .command('config')
    .description('Manage configuration')
    .option('--show', 'Show current configuration')
    .option('--reset', 'Reset configuration to defaults')
    .option('--set-vendor <vendor>', 'Set default vendor')
    .option('--set-log-level <level>', 'Set log level (ERROR, WARN, INFO, DEBUG)')
    .action(async (options) => {
    if (options.show) {
        const config = configManager.getConfig();
        console.log(chalk_1.default.cyan('\n⚙️  Current Configuration:'));
        console.log(JSON.stringify(config, null, 2));
    }
    else if (options.reset) {
        const confirmed = await cli['confirmAction']('Reset all configuration to defaults?');
        if (confirmed) {
            configManager.resetConfig();
            console.log(chalk_1.default.green('✅ Configuration reset to defaults'));
        }
    }
    else if (options.setVendor) {
        configManager.setDefaultVendor(options.setVendor);
        console.log(chalk_1.default.green(`✅ Default vendor set to: ${options.setVendor}`));
    }
    else if (options.setLogLevel) {
        const level = types_1.LogLevel[options.setLogLevel.toUpperCase()];
        if (level !== undefined) {
            configManager.setLogLevel(level);
            console.log(chalk_1.default.green(`✅ Log level set to: ${options.setLogLevel.toUpperCase()}`));
        }
        else {
            console.log(chalk_1.default.red('❌ Invalid log level. Valid options: ERROR, WARN, INFO, DEBUG'));
        }
    }
    else {
        console.log(chalk_1.default.yellow('Please specify an option: --show, --reset, --set-vendor, or --set-log-level'));
    }
});
program
    .command('perf')
    .description('Performance management and cache statistics')
    .option('--stats', 'Show cache statistics and performance metrics')
    .option('--clean', 'Clean old cache entries (older than 7 days)')
    .option('--optimize', 'Optimize cache (clean + enforce limits)')
    .option('--clear-all', 'Clear entire cache (use with caution)')
    .action(async (options) => {
    if (options.stats) {
        const stats = smartCache.getCacheStats();
        console.log(chalk_1.default.cyan('\n📊 Performance Statistics:'));
        console.log(`  Templates cached: ${stats.totalTemplates}`);
        console.log(`  Total cache size: ${stats.totalSize}`);
        console.log(`  Oldest cache: ${stats.oldestCache}`);
        console.log(`  Most used template: ${stats.mostUsed}`);
        console.log(`  Average hit rate: ${stats.hitRate}`);
        console.log(chalk_1.default.green('\n⚡ Performance Tips:'));
        console.log('  • Templates are cached for 24 hours by default');
        console.log('  • Shallow cloning reduces download time by 3-10x');
        console.log('  • Parallel dependency installation is up to 3x faster');
        console.log('  • Use frequently accessed templates for best performance');
    }
    else if (options.clean) {
        const cleaned = await smartCache.cleanOldCache();
        if (cleaned > 0) {
            console.log(chalk_1.default.green(`✅ Cleaned ${cleaned} old cache entries`));
        }
        else {
            console.log(chalk_1.default.yellow('No old cache entries found'));
        }
    }
    else if (options.optimize) {
        console.log(chalk_1.default.cyan('🔧 Optimizing cache...'));
        const cleaned = await smartCache.cleanOldCache();
        // Note: enforcesCacheLimits is called internally during operations
        console.log(chalk_1.default.green(`✅ Cache optimized (${cleaned} entries cleaned)`));
    }
    else if (options.clearAll) {
        const confirmed = await cli['confirmAction']('Clear all cached templates? This cannot be undone.');
        if (confirmed) {
            await smartCache.clearAll();
            console.log(chalk_1.default.green('✅ All cached templates cleared'));
        }
    }
    else {
        console.log(chalk_1.default.yellow('Please specify an option: --stats, --clean, --optimize, or --clear-all'));
    }
});
// Parse command line arguments
program.parse();
//# sourceMappingURL=index.js.map