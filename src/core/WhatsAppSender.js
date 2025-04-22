/**
 * WhatsApp Sender for Een Vakman Nodig WhatsApp Marketing System
 * Handles WhatsApp session management and message sending
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const delayUtils = require('../utils/delayUtils');
const phoneUtils = require('../utils/phoneUtils');
const Logger = require('../utils/logger');
const appConfig = require('../../config/app.config');

class WhatsAppSender {
    /**
     * Create a new WhatsApp sender instance
     * @param {Object} sessionConfig - Session configuration
     * @param {Object} processedTracker - Shared tracker for processed numbers
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
            logDirectory: options.logDirectory || appConfig.directories.logDirectory,
            sendImmediately: options.sendOnStartup !== false, // Send first message immediately
            debug: options.debug || false
        };
        
        // Initialize logger
        this.logger = new Logger({
            component: 'whatsapp-sender',
            sessionId: this.sessionId,
            logDirectory: this.options.logDirectory,
            logLevel: this.options.debug ? 'debug' : 'info'
        });
        
        // Queue for pending messages
        this.messageQueue = [];
        this.isSending = false;
        this.sentCount = 0;
        this.failedCount = 0;
        this.startTime = null;
        
        this.logger.info(`WhatsApp Sender initialized for ${this.sessionName} (${this.deviceInfo})`);
    }

    /**
     * Initialize WhatsApp client
     */
    initialize() {
        if (!this.isEnabled) {
            this.logger.warn('Session is disabled in configuration. Skipping initialization.');
            return;
        }
        
        this.logger.info(`Initializing WhatsApp client...`);
        this.startTime = new Date();
        
        this.client = new Client({
            authStrategy: new LocalAuth({ clientId: this.sessionId }),
            puppeteer: {
                headless: process.env.WHATSAPP_HEADLESS === 'true',
                executablePath: process.platform === 'darwin' ? 
                    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-dev-shm-usage'
                ],
                timeout: 60000 // Increased timeout to 60 seconds
            }
        });

        // Set up event handlers
        this.client.on('qr', (qr) => {
            if (!this.qrShown) {
                this.logger.info(`QR code received. Scan with WhatsApp to authenticate:`);
                qrcode.generate(qr, { small: true });
                this.qrShown = true;
            } else {
                this.logger.debug('New QR code received, but not displayed to avoid clutter');
            }
        });

        this.client.on('ready', async () => {
            this.isReady = true;
            this.qrShown = false; // Reset for potential reconnection
            this.logger.info(`WhatsApp client is ready and connected!`);
            
            // Get client info
            try {
                const info = await this.client.getState();
                this.logger.info(`Connection state: ${info}`);
                
                // If we have messages waiting, send first one immediately
                if (this.messageQueue.length > 0 && this.options.sendImmediately && !this.firstMessageSent) {
                    this.logger.info('Sending first message immediately...');
                    this.sendFirstMessageImmediately();
                } else if (this.messageQueue.length > 0) {
                    this.logger.info('Starting message processor...');
                    this.processMessageQueue();
                } else {
                    this.logger.info('No messages in queue. Ready to process when messages are added.');
                }
            } catch (error) {
                this.logger.error(`Error getting client info:`, error);
            }
        });

        this.client.on('authenticated', () => {
            this.logger.info(`Authenticated successfully`);
        });

        this.client.on('auth_failure', (msg) => {
            this.logger.error(`Authentication failed: ${msg}`);
            this.qrShown = false; // Reset to show QR code again
        });

        this.client.on('disconnected', (reason) => {
            this.isReady = false;
            this.logger.warn(`Disconnected: ${reason}`);
        });

        // Set up message handler using the extensible method
        this.setupBaseMessageHandler();

        // Initialize the client
        this.client.initialize();
    }

    /**
     * Set up the base message handler - can be overridden by subclasses
     */
    setupBaseMessageHandler() {
        this.client.on('message', async (message) => {
            // Basic message handler for standard WhatsAppSender
            this.logger.info(`Received message from ${message.from}: ${message.body}`);
        });
        
        this.logger.debug('Base message handler set up');
    }

    /**
     * Add a message to the queue
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} message - Message content
     * @param {string} category - Professional category (for logging)
     * @returns {boolean} - True if message was queued successfully
     */
    queueMessage(phoneNumber, message, category) {
        if (!this.isEnabled) {
            return false;
        }
        
        // Check if number has already been processed
        if (this.processedTracker.isProcessed(phoneNumber)) {
            this.logger.debug(`Skipping ${phoneNumber} (${category}) - already processed`);
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
        
        this.logger.info(`Queued message to ${phoneNumber} (${category}). Queue size: ${this.messageQueue.length}`);
        
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
                this.logger.debug(`Skipping ${phoneNumber} (${category}) - processed by another session`);
                this.isSending = false;
                
                // Try to send another first message
                if (this.messageQueue.length > 0) {
                    this.sendFirstMessageImmediately();
                }
                return;
            }
            
            // Format number for WhatsApp
            const formattedNumber = phoneUtils.formatPhoneNumberForWhatsApp(phoneNumber);
            
            this.logger.info(`IMMEDIATE: Sending first message to ${phoneNumber} (${category})`);
            
            // Send the message
            let success = false;
            try {
                await this.client.sendMessage(formattedNumber, message);
                this.logger.info(`✓ IMMEDIATE: First message sent successfully to ${phoneNumber} (${category})`);
                success = true;
                this.sentCount++;
            } catch (error) {
                this.logger.error(`✗ IMMEDIATE: Failed to send first message to ${phoneNumber}:`, error);
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
            this.logger.info(`First message sent immediately. Waiting 1 hour before sending next message...`);
            
            setTimeout(() => {
                this.isSending = false;
                this.processMessageQueue();
            }, hourDelay);
            
        } catch (error) {
            this.logger.error(`Error sending immediate message:`, error);
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
                this.logger.debug(`Skipping ${phoneNumber} (${category}) - processed by another session`);
                this.isSending = false;
                this.processMessageQueue();
                return;
            }
            
            // Format number for WhatsApp
            const formattedNumber = phoneUtils.formatPhoneNumberForWhatsApp(phoneNumber);
            
            this.logger.info(`Sending message to ${phoneNumber} (${category})`);
            
            // Send the message
            let success = false;
            try {
                await this.client.sendMessage(formattedNumber, message);
                this.logger.info(`✓ Message sent successfully to ${phoneNumber} (${category})`);
                success = true;
                this.sentCount++;
            } catch (error) {
                this.logger.error(`✗ Failed to send message to ${phoneNumber}:`, error);
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
            const delay = delayUtils.randomDelay(this.options.minDelay, this.options.maxDelay);
            
            this.logger.info(`Waiting ${Math.round(delay/1000)} seconds before next message...`);
            
            setTimeout(() => {
                this.isSending = false;
                this.processMessageQueue();
            }, delay);
            
        } catch (error) {
            this.logger.error(`Error processing message queue:`, error);
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