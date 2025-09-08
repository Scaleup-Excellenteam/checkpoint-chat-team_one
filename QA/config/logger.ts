import * as fs from 'fs';
import * as path from 'path';

/**
 * A simple logger class to write to both console and a file.
 */
export class TestLogger {
    private logFilePath: string;
    private logDir = path.join(process.cwd(), 'logs'); // Place logs in QA/logs

    constructor() {
        // Ensure the log directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }

        // Create a unique log file name with a timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFilePath = path.join(this.logDir, `test-run-${timestamp}.log`);
        this.log(`📝 Log file created at: ${this.logFilePath}`);
    }

    /**
     * Logs a standard message to the console and the log file.
     * @param message The message to log.
     */
    public log(message: string): void {
        console.log(message);
        fs.appendFileSync(this.logFilePath, message + '\n');
    }

    /**
     * Logs an error message to the console and the log file.
     * @param message The primary error message.
     * @param details Additional error details (e.g., from an API response).
     */
    public error(message: string, details?: any): void {
        const fullMessage = details ? `${message} ${JSON.stringify(details)}` : message;
        console.error(fullMessage);
        fs.appendFileSync(this.logFilePath, `ERROR: ${fullMessage}\n`);
    }
}
