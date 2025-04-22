/**
 * Conversation Store for Een Vakman Nodig WhatsApp Marketing System
 * Handles persistence of conversation history and blocked numbers
 */

const path = require('path');
const FileStorage = require('./fileStorage');
const appConfig = require('../../config/app.config');

class ConversationStore {
    /**
     * Create a conversation store
     * @param {Object} options - Store options
     */
    constructor(options = {}) {
        this.fileStorage = new FileStorage({
            storageDirectory: options.storageDirectory || appConfig.directories.dataStorage
        });
        
        this.historyFile = options.historyFile || 'conversation_history.json';
        this.blockedNumbersFile = options.blockedNumbersFile || 'blocked_numbers.json';
        
        // Cache for faster access
        this.conversationCache = new Map();
        this.blockedNumbersCache = new Set();
        
        // Load data
        this.loadConversations();
        this.loadBlockedNumbers();
        
        // Set up periodic saving
        this.saveInterval = options.saveInterval || 60000; // 1 minute
        this.autoSaveTimer = setInterval(() => this.saveAll(), this.saveInterval);
    }

    /**
     * Load conversation history from file
     */
    loadConversations() {
        // Clear the cache
        this.conversationCache.clear();
        
        // Read from file
        const historyData = this.fileStorage.readJsonFile(this.historyFile);
        
        if (historyData && typeof historyData === 'object') {
            // Populate the cache
            Object.entries(historyData).forEach(([phoneNumber, history]) => {
                this.conversationCache.set(phoneNumber, history);
            });
            
            console.log(`Loaded ${this.conversationCache.size} conversation histories`);
        } else {
            console.log('No conversation history found or invalid format, starting fresh');
        }
    }

    /**
     * Load blocked numbers from file
     */
    loadBlockedNumbers() {
        // Clear the cache
        this.blockedNumbersCache.clear();
        
        // Read from file
        const blockedData = this.fileStorage.readJsonFile(this.blockedNumbersFile);
        
        if (blockedData && Array.isArray(blockedData.numbers)) {
            // Populate the cache
            blockedData.numbers.forEach(entry => {
                this.blockedNumbersCache.add(entry.phoneNumber);
            });
            
            console.log(`Loaded ${this.blockedNumbersCache.size} blocked numbers`);
        } else {
            console.log('No blocked numbers found or invalid format, starting fresh');
        }
    }

    /**
     * Save all data to disk
     */
    saveAll() {
        this.saveConversations();
        this.saveBlockedNumbers();
    }

    /**
     * Save conversation history to file
     */
    saveConversations() {
        try {
            // Convert Map to Object for JSON serialization
            const historyData = {};
            this.conversationCache.forEach((history, phoneNumber) => {
                historyData[phoneNumber] = history;
            });
            
            // Write to file
            this.fileStorage.writeJsonFile(this.historyFile, historyData);
        } catch (error) {
            console.error('Error saving conversation history:', error.message);
        }
    }

    /**
     * Save blocked numbers to file
     */
    saveBlockedNumbers() {
        try {
            // Create array with metadata
            const blockedData = {
                numbers: Array.from(this.blockedNumbersCache).map(phoneNumber => {
                    // Check if we have history for this number
                    const history = this.getConversation(phoneNumber);
                    return {
                        phoneNumber,
                        blockedAt: history?.blockedAt || new Date().toISOString(),
                        reason: history?.blockReason || 'unknown'
                    };
                }),
                lastUpdated: new Date().toISOString()
            };
            
            // Write to file
            this.fileStorage.writeJsonFile(this.blockedNumbersFile, blockedData);
        } catch (error) {
            console.error('Error saving blocked numbers:', error.message);
        }
    }

    /**
     * Get conversation history for a phone number
     * @param {string} phoneNumber - Phone number
     * @returns {Object|null} - Conversation history or null
     */
    getConversation(phoneNumber) {
        return this.conversationCache.get(phoneNumber) || null;
    }

    /**
     * Store conversation history for a phone number
     * @param {string} phoneNumber - Phone number
     * @param {Object} conversationData - Conversation data
     */
    storeConversation(phoneNumber, conversationData) {
        this.conversationCache.set(phoneNumber, conversationData);
        
        // Periodically save to reduce I/O
        if (Math.random() < 0.1) { // 10% chance each time
            this.saveConversations();
        }
    }

    /**
     * Check if a number is blocked
     * @param {string} phoneNumber - Phone number to check
     * @returns {boolean} - True if blocked
     */
    isNumberBlocked(phoneNumber) {
        return this.blockedNumbersCache.has(phoneNumber);
    }

    /**
     * Block a phone number
     * @param {string} phoneNumber - Phone number to block
     * @param {Object} blockData - Additional data about the block
     */
    blockNumber(phoneNumber, blockData = {}) {
        this.blockedNumbersCache.add(phoneNumber);
        
        // Update conversation history with block info
        const conversation = this.getConversation(phoneNumber) || {};
        const updatedConversation = {
            ...conversation,
            blockedAt: blockData.timestamp || new Date().toISOString(),
            blockReason: blockData.reason || 'manual_block'
        };
        
        this.storeConversation(phoneNumber, updatedConversation);
        this.saveBlockedNumbers();
    }

    /**
     * Unblock a phone number
     * @param {string} phoneNumber - Phone number to unblock
     * @returns {boolean} - True if number was blocked and is now unblocked
     */
    unblockNumber(phoneNumber) {
        const wasBlocked = this.blockedNumbersCache.has(phoneNumber);
        
        if (wasBlocked) {
            this.blockedNumbersCache.delete(phoneNumber);
            this.saveBlockedNumbers();
            
            // Update conversation history
            const conversation = this.getConversation(phoneNumber);
            if (conversation) {
                conversation.unblockedAt = new Date().toISOString();
                this.storeConversation(phoneNumber, conversation);
            }
        }
        
        return wasBlocked;
    }

    /**
     * Get all blocked numbers with metadata
     * @returns {Array} - Array of blocked number objects
     */
    getAllBlockedNumbers() {
        return Array.from(this.blockedNumbersCache).map(phoneNumber => {
            const history = this.getConversation(phoneNumber) || {};
            return {
                phoneNumber,
                blockedAt: history.blockedAt || 'unknown',
                reason: history.blockReason || 'unknown'
            };
        });
    }

    /**
     * Clean up resources (stop auto-save timer)
     */
    cleanup() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }
        // Final save
        this.saveAll();
    }
}

module.exports = ConversationStore;