/**
 * Message Scheduler for Een Vakman Nodig WhatsApp Marketing System
 * Handles distribution of messages across multiple WhatsApp sessions
 * with optimized timing and load balancing
 */

const appConfig = require('../../config/app.config');
const delayUtils = require('../utils/delayUtils');

class MessageScheduler {
    /**
     * Create a new message scheduler
     * @param {Array} whatsappSenders - Array of WhatsAppSender instances
     * @param {Object} messageTemplates - Message templates by category
     * @param {Object} options - Scheduler options
     */
    constructor(whatsappSenders, messageTemplates, options = {}) {
        this.senders = whatsappSenders;
        this.messageTemplates = messageTemplates;
        this.options = {
            // Maximum messages to send per hour across all sessions
            maxMessagesPerHour: options.maxMessagesPerHour || appConfig.messaging.maxMessagesPerHour || 60,
            
            // Distribution patterns affect how messages are spaced out
            distributionPattern: options.distributionPattern || appConfig.messaging.distributionPattern || 'random',
            
            // Whether to randomly assign categories to sessions or use round-robin
            randomAssignment: options.randomAssignment !== false,
            
            // Max batch size to process at once
            batchSize: options.batchSize || 50,
            
            // Resume from pending file if available
            resumeFromPending: options.resumeFromPending !== false
        };
        
        // Stats tracking
        this.stats = {
            totalQueued: 0,
            queuedByCategory: {},
            queuedBySession: {},
            startTime: new Date(),
            lastScheduled: null,
            schedulingActive: false
        };
        
        // Initialize session stats
        this.senders.forEach(sender => {
            if (!this.stats.queuedBySession[sender.sessionId]) {
                this.stats.queuedBySession[sender.sessionId] = 0;
            }
        });
        
        console.log(`MessageScheduler initialized with ${this.senders.length} senders`);
        console.log(`Maximum rate: ${this.options.maxMessagesPerHour} messages per hour`);
        console.log(`Distribution pattern: ${this.options.distributionPattern}`);
    }

    /**
     * Calculate delay between messages based on distribution pattern
     * @returns {number} - Delay in milliseconds
     */
    calculateDelay() {
        // Base delay for maximum hourly rate
        const baseDelay = (3600 * 1000) / this.options.maxMessagesPerHour;
        
        // Use delay utility with selected pattern
        return delayUtils.distributionDelay(
            this.options.distributionPattern,
            baseDelay
        );
    }

    /**
     * Select the best WhatsApp sender for a message
     * @returns {Object|null} - Selected sender or null if none available
     */
    selectSender() {
        // Filter to only enabled and ready senders
        const availableSenders = this.senders.filter(
            sender => sender.isEnabled && sender.isReady
        );
        
        if (availableSenders.length === 0) {
            // If no senders are ready, return null
            return null;
        }
        
        if (this.options.randomAssignment) {
            // Random assignment among available senders
            return availableSenders[Math.floor(Math.random() * availableSenders.length)];
        } else {
            // Find sender with shortest queue
            return availableSenders.reduce((best, current) => 
                current.getPendingCount() < best.getPendingCount() ? current : best,
                availableSenders[0]
            );
        }
    }

    /**
     * Get message template for a category
     * @param {string} category - Professional category
     * @returns {string} - Message template
     */
    getMessageForCategory(category) {
        const normalizedCategory = category.toLowerCase().trim();
        return this.messageTemplates[normalizedCategory] || this.messageTemplates.default;
    }

    /**
     * Schedule messages for a batch of contacts
     * @param {Array} contacts - Array of contact objects
     * @returns {number} - Number of messages scheduled
     */
    scheduleMessages(contacts) {
        if (!contacts || contacts.length === 0) {
            console.log('No contacts to schedule');
            return 0;
        }
        
        this.stats.schedulingActive = true;
        
        // Process contacts in batches to avoid memory issues with large datasets
        const batchSize = Math.min(this.options.batchSize, contacts.length);
        console.log(`Scheduling messages for ${batchSize} contacts out of ${contacts.length} total`);
        
        const scheduledBatch = contacts.slice(0, batchSize);
        let scheduledCount = 0;
        
        // Schedule each contact
        scheduledBatch.forEach(contact => {
            // Select appropriate sender
            const sender = this.selectSender();
            
            if (!sender) {
                console.log('No available senders. Try again when a session is ready.');
                return;
            }
            
            // Get message for this category
            const message = this.getMessageForCategory(contact.category);
            
            // Queue the message
            const queued = sender.queueMessage(contact.phoneNumber, message, contact.category);
            
            if (queued) {
                // Update statistics
                scheduledCount++;
                this.stats.totalQueued++;
                this.stats.queuedBySession[sender.sessionId] = 
                    (this.stats.queuedBySession[sender.sessionId] || 0) + 1;
                
                // Track by category
                if (!this.stats.queuedByCategory[contact.category]) {
                    this.stats.queuedByCategory[contact.category] = 0;
                }
                this.stats.queuedByCategory[contact.category]++;
            }
        });
        
        this.stats.lastScheduled = new Date();
        this.stats.schedulingActive = false;
        
        console.log(`Scheduled ${scheduledCount} messages across ${this.senders.length} sessions`);
        
        // Schedule remaining contacts with a delay if there are more
        if (contacts.length > batchSize) {
            const delay = this.calculateDelay() * batchSize;
            console.log(`Scheduling next batch in ${Math.round(delay/1000)} seconds`);
            
            setTimeout(() => {
                this.scheduleMessages(contacts.slice(batchSize));
            }, delay);
        }
        
        return scheduledCount;
    }

    /**
     * Get messaging statistics
     * @returns {Object} - Current stats
     */
    getStats() {
        // Calculate messages per hour
        const uptime = (new Date() - this.stats.startTime) / 1000 / 3600; // hours
        const messagesPerHour = uptime > 0 ? Math.round(this.stats.totalQueued / uptime) : 0;
        
        return {
            ...this.stats,
            uptime: uptime.toFixed(2) + ' hours',
            messagesPerHour,
            isActive: this.stats.schedulingActive
        };
    }
}

module.exports = MessageScheduler;