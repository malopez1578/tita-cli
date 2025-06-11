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
exports.ConsoleLogger = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../types");
class ConsoleLogger {
    constructor(logLevel = types_1.LogLevel.INFO, logFile) {
        this.logLevel = logLevel;
        this.logFile = logFile;
    }
    writeToFile(level, message, error) {
        if (!this.logFile)
            return;
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack
            } : undefined
        };
        try {
            const logDir = path.dirname(this.logFile);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
        }
        catch (writeError) {
            // Fallback to console if file writing fails
            console.error('Failed to write to log file:', writeError);
        }
    }
    error(message, error) {
        if (this.logLevel >= types_1.LogLevel.ERROR) {
            console.error(chalk_1.default.red(`❌ ${message}`));
            if (error && this.logLevel >= types_1.LogLevel.DEBUG) {
                console.error(chalk_1.default.red(error.stack ?? error.message));
            }
        }
        this.writeToFile('ERROR', message, error);
    }
    warn(message) {
        if (this.logLevel >= types_1.LogLevel.WARN) {
            console.warn(chalk_1.default.yellow(`⚠️  ${message}`));
        }
        this.writeToFile('WARN', message);
    }
    warning(message) {
        if (this.logLevel >= types_1.LogLevel.WARN) {
            console.warn(chalk_1.default.yellow(`⚠️  ${message}`));
        }
        this.writeToFile('WARNING', message);
    }
    info(message) {
        if (this.logLevel >= types_1.LogLevel.INFO) {
            console.info(chalk_1.default.blue(`ℹ️  ${message}`));
        }
        this.writeToFile('INFO', message);
    }
    debug(message) {
        if (this.logLevel >= types_1.LogLevel.DEBUG) {
            console.debug(chalk_1.default.gray(`🔍 ${message}`));
        }
        this.writeToFile('DEBUG', message);
    }
    success(message) {
        if (this.logLevel >= types_1.LogLevel.INFO) {
            console.log(chalk_1.default.green(`✅ ${message}`));
        }
        this.writeToFile('SUCCESS', message);
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
}
exports.ConsoleLogger = ConsoleLogger;
//# sourceMappingURL=logger.js.map