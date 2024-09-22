"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Logging function based on verbosity levels
const log = (message, level) => {
    const logFile = process.env.LOG_FILE || 'app.log'; // Default log file if not provided
    const logLevel = parseInt(process.env.LOG_LEVEL || '0'); // Default verbosity level to 0 (silent)
    // Ensure the log directory exists
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    // Touch the log file (create it even if logLevel is 0)
    if (!fs.existsSync(logFile)) {
        fs.writeFileSync(logFile, ''); // Create an empty log file
    }
    // Only log if the provided level is less than or equal to the log verbosity level
    if (level <= logLevel) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${message}\n`;
        // Append the message to the log file
        fs.appendFileSync(logFile, logMessage);
    }
};
exports.log = log;
