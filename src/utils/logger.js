/**
 * Centralized logging utility for Een Vakman Nodig WhatsApp Marketing System
 * Provides consistent logging across all components
 */

const fs = require('fs');
const path = require('path');
const appConfig = require('../../config/app.config');

// Default log directory
const DEFAULT_LOG_DIR = path.join(__dirname, '../../logs');

class Logger {
    /**
     * Create a new logger instance
     * @param {Object} options - Logger options
     */
    constructor(options = {}) {
        this.component = options.component || 'app';
        this.logDirectory = options.logDirectory || appConfig.directories.logDirectory || DEFAULT_LOG_DIR;
        this.logToConsole = options.logToConsole !== false;
        this.logLevel = options.logLevel || 'info'; // debug, info, warn, error
        this.sessionId = options.sessionId || null;
        
        // Determine log file path
        this.logFile = options.logFile || path.join(
            this.logDirectory, 
            `${this.sessionId || this.component}.log`
        );
        
        // Debug-specific log file (optional)
        this.debugLogFile = options.debugLogFile || path.join(
            this.logDirectory,
            `${this.sessionId || this.component}_debug.log`
        );
        
        // Create log directory if it doesn't exist
        this.ensureLogDirectory();
        
        // Write session start to log
        this.initLogFile();
    }

    /**
     * Ensure log directory exists
     */
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
            console.log(`Created log directory: ${this.logDirectory}`);
        }
    }

    /**
     * Initialize log file with session start
     */
    initLogFile() {
        const timestamp = new Date().toISOString();
        const sessionInfo = this.sessionId ? ` (${this.sessionId})` : '';
        
        fs.appendFileSync(
            this.logFile,
            `\n\n--- ${this.component}${sessionInfo} started at ${timestamp} ---\n\n`,
            'utf-8'
        );
        
        if (this.logLevel === 'debug') {
            fs.appendFileSync(
                this.debugLogFile,
                `\n\n--- ${this.component}${sessionInfo} debug log started at ${timestamp} ---\n\n`,
                'utf-8'
            );
        }
    }

    /**
     * Format a log entry
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @returns {string} - Formatted log entry
     */
    formatLogEntry(level, message) {
        const timestamp = new Date().toISOString();
        const sessionInfo = this.sessionId ? `[${this.sessionId}]` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${sessionInfo} ${message}\n`;
    }

    /**
     * Write to log file
     * @param {string} entry - Log entry
     * @param {string} level - Log level
     */
    writeToLog(entry, level) {
        try {
            fs.appendFileSync(this.logFile, entry, 'utf-8');
            
            // Write to debug log file as well if in debug mode
            if (level === 'debug' && this.logLevel === 'debug') {
                fs.appendFileSync(this.debugLogFile, entry, 'utf-8');
            }
        } catch (error) {
            console.error(`Error writing to log file: ${error.message}`);
        }
    }

    /**
     * Log a debug message
     * @param {string} message - Log message
     */
    debug(message) {
        if (this.logLevel !== 'debug') return;
        
        const entry = this.formatLogEntry('debug', message);
        
        if (this.logToConsole) {
            console.debug(entry.trim());
        }
        
        this.writeToLog(entry, 'debug');
    }

    /**
     * Log an info message
     * @param {string} message - Log message
     */
    info(message) {
        if (this.logLevel === 'warn' || this.logLevel === 'error') return;
        
        const entry = this.formatLogEntry('info', message);
        
        if (this.logToConsole) {
            console.log(entry.trim());
        }
        
        this.writeToLog(entry, 'info');
    }

    /**
     * Log a warning message
     * @param {string} message - Log message
     */
    warn(message) {
        if (this.logLevel === 'error') return;
        
        const entry = this.formatLogEntry('warn', message);
        
        if (this.logToConsole) {
            console.warn(entry.trim());
        }
        
        this.writeToLog(entry, 'warn');
    }

    /**
     * Log an error message
     * @param {string} message - Log message
     * @param {Error} [error] - Optional error object
     */
    error(message, error) {
        let errorDetails = '';
        
        if (error) {
            errorDetails = `: ${error.message}`;
            if (error.stack) {
                errorDetails += `\nStack: ${error.stack}`;
            }
        }
        
        const entry = this.formatLogEntry('error', `${message}${errorDetails}`);
        
        if (this.logToConsole) {
            console.error(entry.trim());
        }
        
        this.writeToLog(entry, 'error');
    }
}

module.exports = Logger;