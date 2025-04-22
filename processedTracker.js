const fs = require('fs');
const path = require('path');

/**
 * Tracks which phone numbers have been processed across all sessions
 * to prevent duplicate messages and manage pending numbers
 */
class ProcessedTracker {
    constructor(options = {}) {
        this.processedFilePath = options.processedFilePath || path.join(__dirname, 'processed_numbers.json');
        this.pendingFilePath = options.pendingFilePath || path.join(__dirname, 'pending_numbers.json');
        this.logDirectory = options.logDirectory || path.join(__dirname, 'logs');
        
        // Ensure log directory exists
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
        
        this.processedNumbers = new Map(); // Map to store number -> {timestamp, session, category}
        this.pendingNumbers = new Map();   // Map to store pending numbers
        
        this.loadProcessedNumbers();
        this.loadPendingNumbers();
        
        // Create a detailed log file for message history
        this.messageLogPath = path.join(this.logDirectory, 'message_history.log');
        if (!fs.existsSync(this.messageLogPath)) {
            fs.writeFileSync(this.messageLogPath, 'TIMESTAMP,PHONE_NUMBER,CATEGORY,SESSION,STATUS\n', 'utf-8');
        }
    }

    /**
     * Load previously processed numbers from storage
     */
    loadProcessedNumbers() {
        try {
            if (fs.existsSync(this.processedFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.processedFilePath, 'utf-8'));
                if (data && typeof data === 'object') {
                    // Convert from object format to Map
                    Object.keys(data).forEach(number => {
                        this.processedNumbers.set(number, data[number]);
                    });
                    console.log(`Loaded ${this.processedNumbers.size} previously processed numbers`);
                }
            } else {
                // Initialize empty file if it doesn't exist
                this.saveProcessedNumbers();
                console.log('Initialized new processed numbers tracking file');
            }
        } catch (error) {
            console.error('Error loading processed numbers:', error.message);
        }
    }

    /**
     * Load pending numbers from storage
     */
    loadPendingNumbers() {
        try {
            if (fs.existsSync(this.pendingFilePath)) {
                const data = JSON.parse(fs.readFileSync(this.pendingFilePath, 'utf-8'));
                if (data && typeof data === 'object') {
                    // Convert from object format to Map
                    Object.keys(data).forEach(number => {
                        this.pendingNumbers.set(number, data[number]);
                    });
                    console.log(`Loaded ${this.pendingNumbers.size} pending numbers`);
                }
            } else {
                // Initialize empty file if it doesn't exist
                this.savePendingNumbers();
                console.log('Initialized new pending numbers tracking file');
            }
        } catch (error) {
            console.error('Error loading pending numbers:', error.message);
        }
    }

    /**
     * Save processed numbers to storage
     */
    saveProcessedNumbers() {
        try {
            // Convert Map to object for storage
            const dataObj = {};
            this.processedNumbers.forEach((value, key) => {
                dataObj[key] = value;
            });
            
            fs.writeFileSync(
                this.processedFilePath,
                JSON.stringify(dataObj, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Error saving processed numbers:', error.message);
        }
    }

    /**
     * Save pending numbers to storage
     */
    savePendingNumbers() {
        try {
            // Convert Map to object for storage
            const dataObj = {};
            this.pendingNumbers.forEach((value, key) => {
                dataObj[key] = value;
            });
            
            fs.writeFileSync(
                this.pendingFilePath,
                JSON.stringify(dataObj, null, 2),
                'utf-8'
            );
        } catch (error) {
            console.error('Error saving pending numbers:', error.message);
        }
    }

    /**
     * Check if a number has been processed
     * @param {string} phoneNumber - The phone number to check
     * @returns {boolean} - True if already processed, false otherwise
     */
    isProcessed(phoneNumber) {
        return this.processedNumbers.has(phoneNumber);
    }

    /**
     * Check if a number is pending
     * @param {string} phoneNumber - The phone number to check
     * @returns {boolean} - True if pending, false otherwise
     */
    isPending(phoneNumber) {
        return this.pendingNumbers.has(phoneNumber);
    }

    /**
     * Mark a number as pending
     * @param {string} phoneNumber - The phone number to mark
     * @param {string} category - The professional category
     */
    markAsPending(phoneNumber, category) {
        if (!this.pendingNumbers.has(phoneNumber) && !this.processedNumbers.has(phoneNumber)) {
            this.pendingNumbers.set(phoneNumber, {
                timestamp: new Date().toISOString(),
                category: category
            });
            this.savePendingNumbers();
        }
    }

    /**
     * Mark a number as processed
     * @param {string} phoneNumber - The phone number to mark
     * @param {string} sessionId - The WhatsApp session ID that processed it
     * @param {string} category - The professional category
     * @param {boolean} success - Whether the message was sent successfully
     */
    markAsProcessed(phoneNumber, sessionId, category, success = true) {
        const timestamp = new Date().toISOString();
        
        // Add to processed numbers
        this.processedNumbers.set(phoneNumber, {
            timestamp: timestamp,
            sessionId: sessionId,
            category: category,
            success: success
        });
        
        // Remove from pending if it was there
        if (this.pendingNumbers.has(phoneNumber)) {
            this.pendingNumbers.delete(phoneNumber);
            this.savePendingNumbers();
        }
        
        // Save to processed file
        this.saveProcessedNumbers();
        
        // Log to message history
        this.logMessageHistory(phoneNumber, category, sessionId, success ? 'SENT' : 'FAILED');
    }

    /**
     * Log message details to history file
     * @param {string} phoneNumber - The phone number
     * @param {string} category - The professional category
     * @param {string} sessionId - The WhatsApp session ID
     * @param {string} status - Message status (SENT/FAILED)
     */
    logMessageHistory(phoneNumber, category, sessionId, status) {
        try {
            const timestamp = new Date().toISOString();
            const logLine = `${timestamp},${phoneNumber},${category},${sessionId},${status}\n`;
            fs.appendFileSync(this.messageLogPath, logLine, 'utf-8');
        } catch (error) {
            console.error('Error writing to message history log:', error.message);
        }
    }

    /**
     * Get all pending numbers
     * @returns {Array} - Array of pending number objects with data
     */
    getAllPending() {
        const result = [];
        this.pendingNumbers.forEach((data, number) => {
            result.push({
                phoneNumber: number,
                ...data
            });
        });
        return result;
    }

    /**
     * Get count of processed numbers
     * @returns {number} - Count of processed numbers
     */
    getProcessedCount() {
        return this.processedNumbers.size;
    }

    /**
     * Get count of pending numbers
     * @returns {number} - Count of pending numbers
     */
    getPendingCount() {
        return this.pendingNumbers.size;
    }
}

module.exports = ProcessedTracker;