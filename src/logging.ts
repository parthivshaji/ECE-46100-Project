import * as fs from 'fs';
import * as path from 'path';

// Logging function based on verbosity levels
export const log = (message: string, level: number) => {
    const logFile = process.env.LOG_FILE || 'app.log'; // Default log file if not provided
    const logLevel = parseInt(process.env.LOG_LEVEL || '0'); // Default verbosity level to 0 (silent)
    
    // Only log if the provided level is less than or equal to the log verbosity level
    if (level <= logLevel) {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${message}\n`;

        // Ensure the log directory exists
        const logDir = path.dirname(logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        // Append the message to the log file
        fs.appendFileSync(logFile, logMessage);
    }
};