/**
 * Handles distribution of messages across multiple WhatsApp sessions
 * with optimized timing and load balancing
 */
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
            maxMessagesPerHour: options.maxMessagesPerHour || 100,
            
            // Distribution patterns affect how messages are spaced out
            distributionPattern: options.distributionPattern || 'random', // 'even', 'random', 'burst'
            
            // Whether to randomly assign categories to sessions or use round-robin
            randomAssignment: options.randomAssignment !== false,
            
            // Max batch size to process at once
            batchSize: options.batchSize || 50,
            
            // Resume from pending file if available
            resumeFromPending: options.resumeFromPending !== false
        };
        
        this.stats = {
            totalQueued: 0,
            queuedByCategory: {},
            queuedBySession: {}
        };
        
        // Initialize session stats
        this.senders.forEach(sender => {
            if (!this.stats.queuedBySession[sender.sessionId]) {
                this.stats.queuedBySession[sender.sessionId] = 0;
            }
        });
        
        // Check for pending numbers to resume from
        if (this.options.resumeFromPending) {
            this.resumePendingNumbers();
        }
    }

    /**
     * Resume pending numbers from previous run
     */
    resumePendingNumbers() {
        // Get the first sender with a processedTracker
        if (this.senders.length === 0) return;
        
        const firstSender = this.senders[0];
        if (!firstSender.processedTracker) return;
        
        const pendingNumbers = firstSender.processedTracker.getAllPending();
        
        if (pendingNumbers.length > 0) {
            console.log(`Found ${pendingNumbers.length} pending numbers from previous run. Resuming...`);
            this.scheduleMessages(pendingNumbers);
        }
    }

    /**
     * Calculate delay between messages based on distribution pattern
     * @returns {number} - Delay in milliseconds
     */
    calculateDelay() {
        // Base delay for maximum hourly rate
        const baseDelay = (3600 * 1000) / this.options.maxMessagesPerHour;
        
        switch (this.options.distributionPattern) {
            case 'even':
                // Consistent spacing
                return baseDelay;
                
            case 'burst':
                // Send in bursts with longer pauses
                return Math.random() < 0.7 
                    ? baseDelay * 0.5 
                    : baseDelay * 2.5;
                
            case 'random':
            default:
                // Random variation around the base delay
                return baseDelay * (0.5 + Math.random());
        }
    }

    /**
     * Select the best WhatsApp sender for a message
     * @returns {WhatsAppSender} - Selected sender
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
        
        // Process contacts in batches to avoid memory issues with large datasets
        const batchSize = Math.min(this.options.batchSize, contacts.length);
        console.log(`Scheduling messages for ${batchSize} contacts...`);
        
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
                this.stats.queuedBySession[sender.sessionId]++;
                
                // Track by category
                if (!this.stats.queuedByCategory[contact.category]) {
                    this.stats.queuedByCategory[contact.category] = 0;
                }
                this.stats.queuedByCategory[contact.category]++;
            }
        });
        
        console.log(`Scheduled ${scheduledCount} messages across ${this.senders.length} sessions`);
        return scheduledCount;
    }

    /**
     * Get messaging statistics
     * @returns {Object} - Current stats
     */
    getStats() {
        return this.stats;
    }
}

module.exports = MessageScheduler;