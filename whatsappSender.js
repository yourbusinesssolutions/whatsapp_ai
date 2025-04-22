const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

/**
 * Handles WhatsApp session management and message sending
 */
class WhatsAppSender {
    /**
     * Create a new WhatsApp sender instance
     * @param {Object} sessionConfig - Session configuration
     * @param {ProcessedTracker} processedTracker - Shared tracker for processed numbers
     * @param {Object} options - Additional options
     */
    constructor(sessionConfig, processedTracker, options = {}) {
        this.sessionId = sessionConfig.id;
        this.sessionName = sessionConfig.name || sessionConfig.id;
        this.deviceInfo = sessionConfig.deviceInfo || "Unknown device";
        this.processedTracker = processedTracker;
        this.client = null;
        this.isReady = false;
        this.qrShown = false;
        this.isEnabled = sessionConfig.enabled !== false;
        this.firstMessageSent = false;
        
        // Options
        this.options = {
            minDelay: options.minDelay || 30000, // Min delay between messages (30 seconds)
            maxDelay: options.maxDelay || 60000, // Max delay between messages (60 seconds)
            logDirectory: options.logDirectory || path.join(__dirname, 'logs'),
            sendImmediately: options.sendImmediately !== false // Send first message immediately
        };
        
        // Ensure log directory exists
        if (!fs.existsSync(this.options.logDirectory)) {
            fs.mkdirSync(this.options.logDirectory, { recursive: true });
        }
        
        this.logFile = path.join(this.options.logDirectory, `${this.sessionId}.log`);
        
        // Queue for pending messages
        this.messageQueue = [];
        this.isSending = false;
        this.sentCount = 0;
        this.failedCount = 0;
        this.startTime = null;
        
        // Initialize log file
        this.initLogFile();
    }

    /**
     * Initialize log file
     */
    initLogFile() {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(
            this.logFile, 
            `\n\n--- ${this.sessionName} (${this.deviceInfo}) started at ${timestamp} ---\n\n`,
            'utf-8'
        );
    }

    /**
     * Log a message to file
     * @param {string} message - Message to log
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${this.sessionName}] ${message}\n`;
        
        console.log(logEntry.trim());
        
        try {
            fs.appendFileSync(this.logFile, logEntry, 'utf-8');
        } catch (error) {
            console.error(`Error writing to log file: ${error.message}`);
        }
    }

    /**
     * Initialize WhatsApp client
     */
    initialize() {
        if (!this.isEnabled) {
            this.log('Session is disabled in configuration. Skipping initialization.');
            return;
        }
        
        this.log(`Initializing WhatsApp client for ${this.sessionName} (${this.deviceInfo})...`);
        this.startTime = new Date();
        
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: this.sessionId }),
            puppeteer: {
                headless: false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage'
                ],
            }
        });

        // Set up event handlers
        this.client.on('qr', (qr) => {
            if (!this.qrShown) {
                this.log(`QR code received for ${this.sessionName} (${this.deviceInfo}). Scan with WhatsApp to authenticate:`);
                qrcode.generate(qr, { small: true });
                this.qrShown = true;
            } else {
                this.log('New QR code received, but not displayed to avoid clutter');
            }
        });

        this.client.on('ready', async () => {
            this.isReady = true;
            this.qrShown = false; // Reset for potential reconnection
            this.log(`${this.sessionName} (${this.deviceInfo}) is ready and connected!`);
            
            // Get client info
            try {
                const info = await this.client.getState();
                this.log(`Connection state: ${info}`);
                
                // Get info about the connected account - using info object instead of getWid
                // which may not be available in some versions of whatsapp-web.js
                this.log(`Connected to WhatsApp`);
                
                // If we have messages waiting, send first one immediately
                if (this.messageQueue.length > 0 && this.options.sendImmediately && !this.firstMessageSent) {
                    this.log('Sending first message immediately...');
                    this.sendFirstMessageImmediately();
                } else if (this.messageQueue.length > 0) {
                    this.log('Starting message processor...');
                    this.processMessageQueue();
                } else {
                    this.log('No messages in queue. Ready to process when messages are added.');
                }
            } catch (error) {
                this.log(`Error getting client info: ${error.message}`);
            }
        });

        this.client.on('authenticated', () => {
            this.log(`${this.sessionName} (${this.deviceInfo}) authenticated successfully`);
        });

        this.client.on('auth_failure', (msg) => {
            this.log(`Authentication failed: ${msg}`);
            this.qrShown = false; // Reset to show QR code again
        });

        this.client.on('disconnected', (reason) => {
            this.isReady = false;
            this.log(`${this.sessionName} (${this.deviceInfo}) disconnected: ${reason}`);
        });

        this.client.on('message', async (message) => {
            // Log incoming replies
            this.log(`Received message from ${message.from}: ${message.body}`);
        });

        // Initialize the client
        this.client.initialize();
    }

    /**
     * Add a message to the queue
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} message - Message content
     * @param {string} category - Professional category (for logging)
     */
    queueMessage(phoneNumber, message, category) {
        if (!this.isEnabled) {
            return false;
        }
        
        // Check if number has already been processed
        if (this.processedTracker.isProcessed(phoneNumber)) {
            this.log(`Skipping ${phoneNumber} (${category}) - already processed`);
            return false;
        }
        
        // Mark as pending to prevent other sessions from queueing it
        this.processedTracker.markAsPending(phoneNumber, category);
        
        this.messageQueue.push({
            phoneNumber,
            message,
            category,
            timestamp: new Date()
        });
        
        this.log(`Queued message to ${phoneNumber} (${category}). Queue size: ${this.messageQueue.length}`);
        
        // Start processing if not already running and the session is ready
        if (this.isReady && !this.isSending && !this.firstMessageSent && this.options.sendImmediately) {
            this.sendFirstMessageImmediately();
        } else if (this.isReady && !this.isSending) {
            this.processMessageQueue();
        }
        
        return true;
    }

    /**
     * Send the first message immediately after connection
     */
    async sendFirstMessageImmediately() {
        if (this.messageQueue.length === 0 || this.isSending || !this.isReady || this.firstMessageSent) {
            return;
        }
        
        this.isSending = true;
        this.firstMessageSent = true;
        
        try {
            // Get next message
            const messageData = this.messageQueue.shift();
            const { phoneNumber, message, category } = messageData;
            
            // Double-check number hasn't been processed by another session
            if (this.processedTracker.isProcessed(phoneNumber)) {
                this.log(`Skipping ${phoneNumber} (${category}) - processed by another session`);
                this.isSending = false;
                
                // Try to send another first message
                if (this.messageQueue.length > 0) {
                    this.sendFirstMessageImmediately();
                }
                return;
            }
            
            // Format number for WhatsApp (ensure it has country code)
            let formattedNumber = phoneNumber;
            if (!formattedNumber.includes('@c.us')) {
                // Remove any '+' prefix and add WhatsApp suffix
                formattedNumber = formattedNumber.replace(/^\+/, '') + '@c.us';
            }
            
            this.log(`IMMEDIATE: Sending first message to ${phoneNumber} (${category})`);
            
            // Send the message
            let success = false;
            try {
                await this.client.sendMessage(formattedNumber, message);
                this.log(`✓ IMMEDIATE: First message sent successfully to ${phoneNumber} (${category})`);
                success = true;
                this.sentCount++;
            } catch (error) {
                this.log(`✗ IMMEDIATE: Failed to send first message to ${phoneNumber}: ${error.message}`);
                this.failedCount++;
            }
            
            // Mark as processed
            this.processedTracker.markAsProcessed(
                phoneNumber, 
                this.sessionId, 
                category, 
                success
            );
            
            // Wait 3600 seconds (1 hour) before starting regular queue processing
            const hourDelay = 3600 * 1000;
            this.log(`First message sent immediately. Waiting 1 hour before sending next message...`);
            
            setTimeout(() => {
                this.isSending = false;
                this.processMessageQueue();
            }, hourDelay);
            
        } catch (error) {
            this.log(`Error sending immediate message: ${error.message}`);
            this.isSending = false;
        }
    }

    /**
     * Process the message queue with random delays
     */
    async processMessageQueue() {
        if (!this.isReady || this.isSending || this.messageQueue.length === 0) {
            return;
        }
        
        this.isSending = true;
        
        try {
            // Get next message
            const messageData = this.messageQueue.shift();
            const { phoneNumber, message, category } = messageData;
            
            // Double-check number hasn't been processed by another session
            if (this.processedTracker.isProcessed(phoneNumber)) {
                this.log(`Skipping ${phoneNumber} (${category}) - processed by another session`);
                this.isSending = false;
                this.processMessageQueue();
                return;
            }
            
            // Format number for WhatsApp (ensure it has country code)
            let formattedNumber = phoneNumber;
            if (!formattedNumber.includes('@c.us')) {
                // Remove any '+' prefix and add WhatsApp suffix
                formattedNumber = formattedNumber.replace(/^\+/, '') + '@c.us';
            }
            
            this.log(`Sending message to ${phoneNumber} (${category})`);
            
            // Send the message
            let success = false;
            try {
                await this.client.sendMessage(formattedNumber, message);
                this.log(`✓ Message sent successfully to ${phoneNumber} (${category})`);
                success = true;
                this.sentCount++;
            } catch (error) {
                this.log(`✗ Failed to send message to ${phoneNumber}: ${error.message}`);
                this.failedCount++;
            }
            
            // Mark as processed
            this.processedTracker.markAsProcessed(
                phoneNumber, 
                this.sessionId, 
                category, 
                success
            );
            
            // Random delay before next message
            const delay = Math.floor(
                Math.random() * (this.options.maxDelay - this.options.minDelay) + 
                this.options.minDelay
            );
            
            this.log(`Waiting ${Math.round(delay/1000)} seconds before next message...`);
            
            setTimeout(() => {
                this.isSending = false;
                this.processMessageQueue();
            }, delay);
            
        } catch (error) {
            this.log(`Error processing message queue: ${error.message}`);
            this.isSending = false;
        }
    }

    /**
     * Get session statistics
     * @returns {Object} - Session statistics
     */
    getStats() {
        const runTime = this.startTime ? Math.floor((new Date() - this.startTime) / 1000) : 0;
        
        return {
            sessionId: this.sessionId,
            sessionName: this.sessionName,
            deviceInfo: this.deviceInfo,
            isReady: this.isReady,
            enabled: this.isEnabled,
            queueSize: this.messageQueue.length,
            sentCount: this.sentCount,
            failedCount: this.failedCount,
            runTime: runTime,
            isCurrentlySending: this.isSending,
            firstMessageSent: this.firstMessageSent
        };
    }

    /**
     * Get the count of pending messages
     * @returns {number} - Pending message count
     */
    getPendingCount() {
        return this.messageQueue.length;
    }
}

module.exports = WhatsAppSender;