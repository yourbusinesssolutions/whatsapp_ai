/**
 * Processed Numbers Tracker for Een Vakman Nodig WhatsApp Marketing System
 * Tracks which phone numbers have been processed across all sessions
 * to prevent duplicate messages and manage pending numbers
 */

const fs = require('fs');
const path = require('path');
const FileStorage = require('../db/fileStorage');
const appConfig = require('../../config/app.config');

class ProcessedTracker {
    /**
     * Create a processed numbers tracker
     * @param {Object} options - Tracker options
     */
    constructor(options = {}) {
        this.processedFilePath = options.processedFilePath || 
            path.join(appConfig.directories.dataStorage, appConfig.files.processedNumbersFile);
        
        this.pendingFilePath = options.pendingFilePath || 
            path.join(appConfig.directories.dataStorage, appConfig.files.pendingNumbersFile);
        
        this.logDirectory = options.logDirectory || appConfig.directories.logDirectory;
        
        // Use file storage for consistent I/O operations
        this.fileStorage = new FileStorage({
            storageDirectory: path.dirname(this.processedFilePath)
        });
        
        // In-memory trackers
        this.processedNumbers = new Map(); // Map to store number -> {timestamp, session, category}
        this.pendingNumbers = new Map();   // Map to store pending numbers
        
        // Load existing data
        this.loadProcessedNumbers();
        this.loadPendingNumbers();
        
        // Create a detailed log file for message history
        this.messageLogPath = path.join(this.logDirectory, 'message_history.log');
        this.ensureMessageLogExists();
        
        console.log(`ProcessedTracker initialized with ${this.processedNumbers.size} processed and ${this.pendingNumbers.size} pending numbers`);
    }

    /**
     * Ensure the message log file exists
     */
    ensureMessageLogExists() {
        // Create directory if needed
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
        
        // Create log file with header if it doesn't exist
        if (!fs.existsSync(this.messageLogPath)) {
            fs.writeFileSync(
                this.messageLogPath, 
                'TIMESTAMP,PHONE_NUMBER,CATEGORY,SESSION,STATUS\n', 
                'utf-8'
            );
        }
    }

    /**
     * Load previously processed numbers from storage
     */
    loadProcessedNumbers() {
        try {
            const data = this.fileStorage.readJsonFile(this.processedFilePath);
            
            if (data && typeof data === 'object') {
                // Convert from object format to Map
                Object.keys(data).forEach(number => {
                    this.processedNumbers.set(number, data[number]);
                });
                console.log(`Loaded ${this.processedNumbers.size} previously processed numbers`);
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
            const data = this.fileStorage.readJsonFile(this.pendingFilePath);
            
            if (data && typeof data === 'object') {
                // Convert from object format to Map
                Object.keys(data).forEach(number => {
                    this.pendingNumbers.set(number, data[number]);
                });
                console.log(`Loaded ${this.pendingNumbers.size} pending numbers`);
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
            
            this.fileStorage.writeJsonFile(this.processedFilePath, dataObj);
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
            
            this.fileStorage.writeJsonFile(this.pendingFilePath, dataObj);
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
            this.fileStorage.appendToFile(this.messageLogPath, logLine);
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
     * Get all processed numbers
     * @returns {Array} - Array of processed number objects with data
     */
    getAllProcessed() {
        const result = [];
        this.processedNumbers.forEach((data, number) => {
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
    
    /**
     * Get statistics on processed numbers
     * @returns {Object} - Statistics object
     */
    getStats() {
        // Create counters for each category and session
        const categoryCounts = {};
        const sessionCounts = {};
        const successCount = { total: 0 };
        const failedCount = { total: 0 };
        
        // Analyze processed numbers
        this.processedNumbers.forEach((data, number) => {
            // Count by category
            const category = data.category || 'unknown';
            categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            
            // Count by session
            const session = data.sessionId || 'unknown';
            sessionCounts[session] = (sessionCounts[session] || 0) + 1;
            
            // Count success/failure
            if (data.success) {
                successCount.total++;
                successCount[category] = (successCount[category] || 0) + 1;
            } else {
                failedCount.total++;
                failedCount[category] = (failedCount[category] || 0) + 1;
            }
        });
        
        return {
            processed: {
                total: this.processedNumbers.size,
                byCategory: categoryCounts,
                bySession: sessionCounts,
                successful: successCount,
                failed: failedCount
            },
            pending: {
                total: this.pendingNumbers.size
            }
        };
    }
    
    /**
     * Clear pending numbers
     * @returns {number} - Number of pending numbers cleared
     */
    clearPending() {
        const count = this.pendingNumbers.size;
        this.pendingNumbers.clear();
        this.savePendingNumbers();
        return count;
    }
}

module.exports = ProcessedTracker;