#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import figlet from 'figlet';
import * as fs from 'fs';
import inquirer from 'inquirer';
import ora from 'ora';
import * as path from 'path';

// Import our new modular components
import { URL_TEMPLATES } from '../constants/templates';
import { ConfigManager } from './config';
import {
  ManifestError,
  TitaError,
  ValidationError
} from './errors';
import { TemplateCache } from './services/templateCache';
import {
  CommandContext,
  ComponentInfo,
  LogLevel,
  ProjectDetails,
  TemplateConfig,
  VendorInfo
} from './types';
import { CommandExecutor } from './utils/command';
import { ConsoleLogger } from './utils/logger';
import { ValidationUtils } from './utils/validation';
// Performance optimizations
import { FastFileFinder } from './utils/fast-file-finder';
import { OptimizedCloner } from './utils/optimized-cloner';
import { ParallelInstaller } from './utils/parallel-installer';
import { SmartCache } from './utils/smart-cache';
import { UpdateChecker } from './utils/update-checker';

const program = new Command();

// Initialize global services
const configManager = ConfigManager.getInstance();
const config = configManager.getConfig();
const logger = new ConsoleLogger(config.logLevel, path.join(configManager.getCacheDirectory(), 'tita.log'));
const commandExecutor = new CommandExecutor(logger);
const templateCache = new TemplateCache(configManager.getCacheDirectory(), logger);

// Initialize performance-optimized services
const optimizedCloner = new OptimizedCloner(commandExecutor, logger);
const smartCache = new SmartCache(logger, optimizedCloner);
const parallelInstaller = new ParallelInstaller(commandExecutor, logger);
const fastFileFinder = new FastFileFinder();
const updateChecker = new UpdateChecker(commandExecutor, logger, configManager.getCacheDirectory());

// Convert URL_TEMPLATES to TemplateConfig format
const templates: TemplateConfig[] = Object.entries(URL_TEMPLATES).map(([name, url]) => ({
  name,
  gitlabUrl: url,
  description: `${name.charAt(0).toUpperCase() + name.slice(1)} template`,
  category: 'general',
  tags: []
}));

class TitaCLI {
  private readonly  context: CommandContext;
  private readonly  commandExecutor: CommandExecutor;

  constructor() {
    this.context = {
      config,
      logger,
      workingDirectory: process.cwd()
    };
    this.commandExecutor = commandExecutor;
  }

  private showBanner(): void {
    console.log(chalk.cyan(figlet.textSync('TITA CLI', { horizontalLayout: 'full' })));
    console.log(chalk.gray('CLI for creating projects from GitLab templates\n'));
  }

  private async checkForUpdatesIfNeeded(): Promise<void> {
    try {
      // Check for updates silently in the background (using cache)
      const updateInfo = await updateChecker.checkForUpdates(true);
      if (updateInfo.hasUpdate) {
        updateChecker.displayUpdateNotification(updateInfo);
      }
    } catch (error) {
      // Silently fail - update checks shouldn't interrupt the main workflow
      this.context.logger.debug(`Update check failed: ${error}`);
    }
  }

  private async selectTemplate(): Promise<TemplateConfig> {
    const preferredTemplates = this.context.config.preferredTemplates || [];
    
    // Sort templates with preferred ones first
    const sortedTemplates = [...templates].sort((a, b) => {
      const aPreferred = preferredTemplates.includes(a.name);
      const bPreferred = preferredTemplates.includes(b.name);
      
      if (aPreferred && !bPreferred) return -1;
      if (!aPreferred && bPreferred) return 1;
      return a.name.localeCompare(b.name);
    });

    const choices = sortedTemplates.map(template => ({
      name: `${template.name}${preferredTemplates.includes(template.name) ? ' ⭐' : ''} - ${template.description}`,
      value: template
    }));

    const { selectedTemplate } = await inquirer.prompt([
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

  private async getProjectDetails(defaultDir: string = '.'): Promise<ProjectDetails> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        message: 'Enter initial version:',
        default: '1.0.0',
        validate: (input: string) => {
          try {
            ValidationUtils.validateVersion(input);
            return true;
          } catch (error) {
            return (error as ValidationError).message;
          }
        }
      },
      {
        type: 'input',
        name: 'targetDirectory',
        message: 'Enter target directory:',
        default: defaultDir,
        validate: (input: string) => {
          try {
            ValidationUtils.validateDirectoryPath(input);
            return true;
          } catch (error) {
            return (error as ValidationError).message;
          }
        }
      }
    ]);

    return {
      version: answers.version,
      targetDirectory: answers.targetDirectory
    };
  }

  private async getVendorInfo(): Promise<VendorInfo> {
    const defaultVendor = this.context.config.defaultVendor;
    
    const { vendor } = await inquirer.prompt([
      {
        type: 'input',
        name: 'vendor',
        message: 'Enter vendor name:',
        default: defaultVendor,
        validate: (input: string) => {
          try {
            ValidationUtils.validateVendorName(input);
            return true;
          } catch (error) {
            return (error as ValidationError).message;
          }
        }
      }
    ]);

    // Save as default if user wants
    if (vendor !== defaultVendor && vendor.trim()) {
      const { saveAsDefault } = await inquirer.prompt([
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

  private async getComponentInfo(defaultName?: string): Promise<ComponentInfo> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Enter component title:',
        validate: (input: string) => {
          try {
            ValidationUtils.validateProjectName(input);
            return true;
          } catch (error) {
            return (error as ValidationError).message;
          }
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Enter component description:',
        validate: (input: string) => {
          if (!input.trim()) {
            return 'Component description cannot be empty';
          }
          return true;
        }
      }
    ]);

    return {
      title: answers.title,
      description: answers.description
    };
  }

  private async installDependencies(projectPath: string): Promise<void> {
    const packageJsonDirs = fastFileFinder.findPackageJsonFiles(projectPath);
    
    if (packageJsonDirs.length === 0) {
      this.context.logger.info('No package.json files found, skipping dependency installation');
      return;
    }

    const spinner = ora('Installing dependencies with Yarn (parallel)...').start();
    
    try {
      await parallelInstaller.installDependencies(packageJsonDirs);
      spinner.succeed(chalk.green('All dependencies installed successfully'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to install dependencies'));
      
      // Non-critical error, but log it
      this.context.logger.error('Dependency installation failed', error as Error);
      this.context.logger.info('You can manually install dependencies later using: yarn install');
    }
  }

  private findManifestFile(projectPath: string): string | null {
    const manifestDirs = fastFileFinder.findManifestFiles(projectPath);
    if (manifestDirs.length > 0) {
      return path.join(manifestDirs[0], 'manifest.json');
    }
    return null;
  }

  private updateManifestInfo(
    projectPath: string, 
    vendor: string, 
    componentInfo: ComponentInfo,
    projectDetails?: ProjectDetails
  ): void {
    const manifestPath = this.findManifestFile(projectPath);
    
    if (!manifestPath) {
      this.context.logger.warn('No manifest.json file found. Skipping manifest update.');
      return;
    }

    const spinner = ora('Updating manifest.json...').start();
    
    try {
      const manifestContent = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestContent);
      
      // Update manifest fields
      manifest.vendor = vendor;
      manifest.name = componentInfo.title;
      manifest.title = componentInfo.title;
      manifest.description = componentInfo.description;
      
      if (projectDetails?.version) {
        manifest.version = projectDetails.version;
      }
      
      // Write back to file with proper formatting
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
      
      const relativePath = path.relative(projectPath, manifestPath);
      spinner.succeed(chalk.green(`Component info updated in ${relativePath}`));
      
      this.context.logger.info(`Manifest updated:`);
      this.context.logger.info(`  • Vendor: ${vendor}`);
      this.context.logger.info(`  • Name: ${componentInfo.title}`);
      this.context.logger.info(`  • Title: ${componentInfo.title}`);
      this.context.logger.info(`  • Description: ${componentInfo.description}`);
    } catch (error) {
      spinner.fail(chalk.red('Failed to update manifest.json'));
      throw new ManifestError('update', manifestPath, error);
    }
  }

  private async confirmAction(message: string): Promise<boolean> {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: false
      }
    ]);
    return confirmed;
  }

  private async checkPrerequisites(): Promise<void> {
    const requirements = [
      { name: 'Git', command: 'git' },
      { name: 'Yarn', command: 'yarn' }
    ];

    this.context.logger.info('Checking prerequisites...');

    for (const req of requirements) {
      try {
        await this.commandExecutor.ensurePrerequisite(req.command);
        this.context.logger.success(`${req.name} is available`);
      } catch (error) {
        this.context.logger.error(`${req.name} is not available`);
        throw error;
      }
    }
  }

  // Command implementations
  async createProject(): Promise<void> {
    try {
      this.showBanner();
      
      await this.checkPrerequisites();
      
      const template = await this.selectTemplate();
      const projectDetails = await this.getProjectDetails();
      const vendorInfo = await this.getVendorInfo();
      const componentInfo = await this.getComponentInfo();
      
      // Use project name as component name
      
      const projectPath = path.resolve(projectDetails.targetDirectory, componentInfo.title);
      
      // Check if directory already exists
      if (fs.existsSync(projectPath)) {
        const overwrite = await this.confirmAction(
          `Directory "${projectPath}" already exists. Do you want to overwrite it?`
        );
        if (!overwrite) {
          this.context.logger.info('Project creation cancelled');
          return;
        }
        fs.rmSync(projectPath, { recursive: true, force: true });
      }

      // Check cache first using SmartCache
      let sourcePath: string;
      if (smartCache.hasTemplate(template.name) && await smartCache.isTemplateValid(template.name, template.gitlabUrl)) {
        this.context.logger.info('Using cached template');
        sourcePath = await smartCache.getTemplate(template.name, template.gitlabUrl);
      } else {
        // Clone and cache using SmartCache
        const spinner = ora('Cloning template...').start();
        try {
          sourcePath = await smartCache.getTemplate(template.name, template.gitlabUrl);
          spinner.succeed(chalk.green('Template cloned and cached'));
        } catch (error) {
          spinner.fail(chalk.red('Failed to clone template'));
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
      
      this.context.logger.success(`\n🎉 Project "${componentInfo.title}" created successfully!`);
      this.context.logger.info(`📁 Location: ${projectPath}`);
      this.context.logger.info('🚀 Your project is ready to use!');
      
    } catch (error) {
      this.handleError(error);
    }
  }

  private copyDirectory(src: string, dest: string): void {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      if (item === '.git') continue; // Skip .git directory
      
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async listTemplates(): Promise<void> {
    this.context.logger.info('\n📋 Available Templates:\n');
    
    templates.forEach((template, index) => {
      const preferred = configManager.getPreferredTemplates().includes(template.name);
      console.log(`${index + 1}. ${chalk.cyan(template.name)}${preferred ? ' ⭐' : ''}`);
      console.log(`   ${chalk.gray(template.description)}`);
      console.log(`   ${chalk.blue(template.gitlabUrl)}\n`);
    });
  }

  private handleError(error: any): void {
    if (error instanceof TitaError) {
      this.context.logger.error(error.message);
      if (this.context.config.logLevel === LogLevel.DEBUG) {
        this.context.logger.debug(`Error code: ${error.code}`);
        this.context.logger.debug(`Error details: ${JSON.stringify(error.details, null, 2)}`);
      }
    } else {
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
    // Check for updates silently before starting
    await cli['checkForUpdatesIfNeeded']();
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
      console.log(chalk.green('✅ Cache cleared successfully'));
    } else if (options.stats) {
      const stats = smartCache.getCacheStats();
      console.log(chalk.cyan('\n📊 Cache Statistics:'));
      console.log(`Templates: ${stats.totalTemplates}`);
      console.log(`Total size: ${stats.totalSize}`);
      console.log(`Oldest cache: ${stats.oldestCache}`);
      console.log(`Most used: ${stats.mostUsed}`);
      console.log(`Avg hit rate: ${stats.hitRate}`);
    } else if (options.list) {
      const metadata = smartCache.getMetadata();
      const templates = Object.keys(metadata);
      
      if (templates.length === 0) {
        console.log(chalk.yellow('No templates are currently cached'));
      } else {
        console.log(chalk.cyan('\n📋 Cached Templates:'));
        templates.forEach(templateName => {
          const meta = metadata[templateName];
          const sizeMB = (meta.size / 1024 / 1024).toFixed(2);
          console.log(`• ${templateName} (${sizeMB} MB)`);
          console.log(`  Updated: ${new Date(meta.lastUpdated).toLocaleString()}`);
          console.log(`  Last accessed: ${new Date(meta.lastAccessed).toLocaleString()}`);
          console.log(`  Hits: ${meta.hits}`);
        });
      }
    } else {
      console.log(chalk.yellow('Please specify an option: --clear, --stats, or --list'));
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
      console.log(chalk.cyan('\n⚙️  Current Configuration:'));
      console.log(JSON.stringify(config, null, 2));
    } else if (options.reset) {
      const confirmed = await cli['confirmAction']('Reset all configuration to defaults?');
      if (confirmed) {
        configManager.resetConfig();
        console.log(chalk.green('✅ Configuration reset to defaults'));
      }
    } else if (options.setVendor) {
      configManager.setDefaultVendor(options.setVendor);
      console.log(chalk.green(`✅ Default vendor set to: ${options.setVendor}`));
    } else if (options.setLogLevel) {
      const level = LogLevel[options.setLogLevel.toUpperCase() as keyof typeof LogLevel];
      if (level !== undefined) {
        configManager.setLogLevel(level);
        console.log(chalk.green(`✅ Log level set to: ${options.setLogLevel.toUpperCase()}`));
      } else {
        console.log(chalk.red('❌ Invalid log level. Valid options: ERROR, WARN, INFO, DEBUG'));
      }
    } else {
      console.log(chalk.yellow('Please specify an option: --show, --reset, --set-vendor, or --set-log-level'));
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
      console.log(chalk.cyan('\n📊 Performance Statistics:'));
      console.log(`  Templates cached: ${stats.totalTemplates}`);
      console.log(`  Total cache size: ${stats.totalSize}`);
      console.log(`  Oldest cache: ${stats.oldestCache}`);
      console.log(`  Most used template: ${stats.mostUsed}`);
      console.log(`  Average hit rate: ${stats.hitRate}`);
      
      console.log(chalk.green('\n⚡ Performance Tips:'));
      console.log('  • Templates are cached for 24 hours by default');
      console.log('  • Shallow cloning reduces download time by 3-10x');
      console.log('  • Parallel dependency installation is up to 3x faster');
      console.log('  • Use frequently accessed templates for best performance');
      
    } else if (options.clean) {
      const cleaned = await smartCache.cleanOldCache();
      if (cleaned > 0) {
        console.log(chalk.green(`✅ Cleaned ${cleaned} old cache entries`));
      } else {
        console.log(chalk.yellow('No old cache entries found'));
      }
      
    } else if (options.optimize) {
      console.log(chalk.cyan('🔧 Optimizing cache...'));
      const cleaned = await smartCache.cleanOldCache();
      // Note: enforcesCacheLimits is called internally during operations
      console.log(chalk.green(`✅ Cache optimized (${cleaned} entries cleaned)`));
      
    } else if (options.clearAll) {
      const confirmed = await cli['confirmAction']('Clear all cached templates? This cannot be undone.');
      if (confirmed) {
        await smartCache.clearAll();
        console.log(chalk.green('✅ All cached templates cleared'));
      }
      
    } else {
      console.log(chalk.yellow('Please specify an option: --stats, --clean, --optimize, or --clear-all'));
    }
  });

program
  .command('update')
  .description('Check for CLI updates')
  .option('--check', 'Check for updates without installing')
  .action(async (options) => {
    if (options.check) {
      await updateChecker.showUpdateInfo();
    } else {
      await updateChecker.showUpdateInfo();
    }
  });

// Parse command line arguments
program.parse();
