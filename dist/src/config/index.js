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
exports.ConfigManager = void 0;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const errors_1 = require("../errors");
const types_1 = require("../types");
class ConfigManager {
    constructor() {
        this.configPath = path.join(os.homedir(), '.tita-cli', 'config.json');
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    }
    getDefaultConfig() {
        return {
            defaultVendor: '',
            defaultAuthor: '',
            defaultLicense: 'MIT',
            preferredTemplates: [],
            cacheDirectory: path.join(os.homedir(), '.tita-cli', 'cache'),
            logLevel: types_1.LogLevel.INFO
        };
    }
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf-8');
                const parsedConfig = JSON.parse(configData);
                return { ...this.getDefaultConfig(), ...parsedConfig };
            }
        }
        catch (error) {
            console.warn(`Failed to load config from ${this.configPath}, using defaults`);
        }
        return this.getDefaultConfig();
    }
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            throw new errors_1.FileSystemError('save config', this.configPath, error);
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.saveConfig();
    }
    resetConfig() {
        this.config = this.getDefaultConfig();
        this.saveConfig();
    }
    getConfigPath() {
        return this.configPath;
    }
    // Specific getters for commonly used config values
    getDefaultVendor() {
        return this.config.defaultVendor || '';
    }
    getDefaultAuthor() {
        return this.config.defaultAuthor || '';
    }
    getCacheDirectory() {
        return this.config.cacheDirectory || path.join(os.homedir(), '.tita-cli', 'cache');
    }
    getLogLevel() {
        return this.config.logLevel || types_1.LogLevel.INFO;
    }
    getPreferredTemplates() {
        return this.config.preferredTemplates || [];
    }
    // Specific setters
    setDefaultVendor(vendor) {
        this.updateConfig({ defaultVendor: vendor });
    }
    setDefaultAuthor(author) {
        this.updateConfig({ defaultAuthor: author });
    }
    setLogLevel(level) {
        this.updateConfig({ logLevel: level });
    }
    addPreferredTemplate(templateName) {
        const current = this.getPreferredTemplates();
        if (!current.includes(templateName)) {
            this.updateConfig({ preferredTemplates: [...current, templateName] });
        }
    }
    removePreferredTemplate(templateName) {
        const current = this.getPreferredTemplates();
        this.updateConfig({
            preferredTemplates: current.filter(name => name !== templateName)
        });
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=index.js.map