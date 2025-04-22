/**
 * Enhanced WhatsApp Sender with AI Response capabilities
 * This component integrates the base WhatsApp sender with AIResponder
 */

const fs = require('fs');
const path = require('path');
const WhatsAppSender = require('../core/WhatsAppSender');
const AIResponder = require('./AIResponder');
const appConfig = require('../../config/app.config');
const aiConfig = require('../../config/ai.config');

class AIEnabledSender extends WhatsAppSender {
    /**
     * Create a new AI-enabled WhatsApp sender
     * @param {Object} sessionConfig - Session configuration
     * @param {Object} processedTracker - Tracker for processed numbers
     * @param {Object} options - Additional options
     */
    constructor(sessionConfig, processedTracker, options = {}) {
        // Initialize base WhatsApp sender
        super(sessionConfig, processedTracker, options);
        
        this.log(`[AIEnabledSender] Initializing for session: ${sessionConfig.name}`);
        
        // Initialize AI responder
        this.aiResponder = new AIResponder({
            apiKey: options.apiKey || aiConfig.apiKey || process.env.DEEPSEEK_API_KEY,
            apiUrl: options.apiUrl || aiConfig.apiUrl,
            model: options.model || aiConfig.model,
            logDirectory: options.logDirectory || appConfig.directories.logDirectory,
            temperature: options.temperature || aiConfig.temperature,
            maxTokens: options.maxResponseLength || aiConfig.maxResponseLength,
            responseDelay: options.responseDelay || aiConfig.responseDelay,
            debug: options.debug || appConfig.debug
        });
        
        console.log("AI Responder created successfully:", !!this.aiResponder);
        this.log(`[AIEnabledSender] AI responder initialized with ${aiConfig.provider} provider`);
        
        // Set up debug logging
        this.aiDebugLogFile = path.join(
            options.logDirectory || appConfig.directories.logDirectory, 
            `${this.sessionId}_ai_integration_debug.log`
        );
        
        fs.appendFileSync(
            this.aiDebugLogFile,
            `\n\n--- AI Integration Debug started for ${sessionConfig.name} at ${new Date().toISOString()} ---\n\n`,
            'utf-8'
        );
    }
    
    /**
     * Log debug message for AI integration
     * @param {string} message - Debug message
     */
    debugMessage(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}\n`;
        console.log(`[AI DEBUG] ${message}`);
        
        try {
            fs.appendFileSync(this.aiDebugLogFile, logEntry, 'utf-8');
        } catch (error) {
            console.error(`Error writing to debug log: ${error.message}`);
        }
    }
    
    /**
     * Send typing indicators to simulate human typing
     * @param {string} phoneNumber - Recipient phone number
     * @param {boolean} isTyping - Whether typing is active
     */
    async sendTypingIndicator(phoneNumber, isTyping = true) {
        if (!this.client) return;
        
        try {
            // Try different methods that various WhatsApp libraries might use
            // Method 1: sendPresenceUpdate
            if (typeof this.client.sendPresenceUpdate === 'function') {
                await this.client.sendPresenceUpdate(isTyping ? 'composing' : 'paused', phoneNumber);
                this.debugMessage(`Set typing indicator ${isTyping ? 'ON' : 'OFF'} for ${phoneNumber} using sendPresenceUpdate`);
                return;
            }
            
            // Method 2: sendChatState
            if (typeof this.client.sendChatState === 'function') {
                await this.client.sendChatState(isTyping ? 'composing' : 'paused', phoneNumber);
                this.debugMessage(`Set typing indicator ${isTyping ? 'ON' : 'OFF'} for ${phoneNumber} using sendChatState`);
                return;
            }
            
            // Method 3: startTyping/stopTyping
            if (isTyping && typeof this.client.startTyping === 'function') {
                await this.client.startTyping(phoneNumber);
                this.debugMessage(`Set typing indicator ON for ${phoneNumber} using startTyping`);
                return;
            } else if (!isTyping && typeof this.client.stopTyping === 'function') {
                await this.client.stopTyping(phoneNumber);
                this.debugMessage(`Set typing indicator OFF for ${phoneNumber} using stopTyping`);
                return;
            }
            
            // Method 4: setChatState
            if (typeof this.client.setChatState === 'function') {
                await this.client.setChatState(phoneNumber, isTyping ? 'composing' : 'paused');
                this.debugMessage(`Set typing indicator ${isTyping ? 'ON' : 'OFF'} for ${phoneNumber} using setChatState`);
                return;
            }
            
            // Method 5: setPresence
            if (typeof this.client.setPresence === 'function') {
                await this.client.setPresence(isTyping ? 'available' : 'unavailable', phoneNumber);
                this.debugMessage(`Set presence ${isTyping ? 'available' : 'unavailable'} for ${phoneNumber}`);
                return;
            }
            
            // If we reach here, none of the known methods are available
            this.debugMessage(`WARNING: Could not set typing indicator - no compatible method found in WhatsApp client`);
            
        } catch (error) {
            this.debugMessage(`Failed to set typing indicator: ${error.message}`);
        }
    }
    
    /**
     * Override the base message handler with AI-enabled functionality
     */
    setupBaseMessageHandler() {
        // Clear any existing message listeners to avoid duplicates
        this.client.removeAllListeners('message');
        
        // Set up AI-enabled message handler
        this.client.on('message', async (message) => {
            this.debugMessage(`=== INCOMING MESSAGE ===`);
            this.debugMessage(`From: ${message.from}`);
            this.debugMessage(`Body: ${message.body}`);
            this.debugMessage(`Type: ${message.type}`);
            
            // Direct console log for debugging purposes
            console.log(`RECEIVED MESSAGE: ${message.from}: ${message.body}`);
            
            try {
                // Skip group messages, broadcast lists, and status updates
                if (message.from.includes('@g.us') || 
                    message.from.includes('@broadcast') || 
                    (message.isStatus !== undefined && message.isStatus)) {
                    this.debugMessage('Skipping message: group, broadcast, or status');
                    return;
                }
                
                // Skip if message is from us (self)
                if (message.fromMe) {
                    this.debugMessage('Skipping message: sent by self');
                    return;
                }
                
                // Add a small random delay before marking as read (1-5 seconds)
                // This makes it more human-like - humans don't instantly see messages
                const initialDelay = Math.floor(Math.random() * 4000) + 1000;
                this.debugMessage(`Waiting ${initialDelay}ms before marking as read`);
                await new Promise(resolve => setTimeout(resolve, initialDelay));
                
                // Mark message as read
                if (message.id) {
                    try {
                        await this.client.sendReadReceipt(message.from, message.id);
                        this.debugMessage('Marked message as read');
                    } catch (error) {
                        this.debugMessage(`Failed to mark as read: ${error.message}`);
                    }
                }
                
                // Sometimes add a small delay between reading and typing
                // Humans sometimes read a message but pause before responding
                if (Math.random() < 0.3) {
                    const pauseDelay = Math.floor(Math.random() * 3000) + 2000;
                    this.debugMessage(`Adding a ${pauseDelay}ms pause before typing`);
                    await new Promise(resolve => setTimeout(resolve, pauseDelay));
                }
                
                // Show typing indicator before processing
                await this.sendTypingIndicator(message.from, true);
                
                // Try sending a simple test message directly - for debugging only
                // Comment this out once the AI responder is working correctly
                try {
                    await this.client.sendMessage(message.from, "Test response: I received your message");
                    console.log("Test response sent successfully");
                } catch (error) {
                    console.error("Failed to send test response:", error);
                }
                
                // Process message with AI responder
                const response = await this.aiResponder.processIncomingMessage(
                    message.body,
                    message.from
                );
                
                if (response) {
                    this.debugMessage(`AI generated response: "${response}"`);
                    
                    // Simulate typing time based on response length
                    const typingTime = Math.min(response.length * 30, 8000);
                    this.debugMessage(`Showing typing indicator for ${typingTime}ms`);
                    await new Promise(resolve => setTimeout(resolve, typingTime));
                    
                    // Stop typing indicator before sending
                    await this.sendTypingIndicator(message.from, false);
                    
                    // Send response
                    await this.client.sendMessage(message.from, response);
                    this.debugMessage(`AI response sent successfully`);
                } else {
                    this.debugMessage('No response generated (conversation ended or message filtered)');
                    await this.sendTypingIndicator(message.from, false);
                }
            } catch (error) {
                this.debugMessage(`ERROR handling message: ${error.message}`);
                if (error.stack) {
                    this.debugMessage(`Stack trace: ${error.stack}`);
                }
                
                // Turn off typing indicator if there was an error
                await this.sendTypingIndicator(message.from, false);
            }
            
            this.debugMessage('=== MESSAGE HANDLING COMPLETE ===\n');
        });
        
        this.debugMessage('AI-enabled message handler setup complete');
    }
    
    /**
     * Initialize WhatsApp client with AI capability
     */
    initialize() {
        this.debugMessage('Initializing AI-enabled WhatsApp sender...');
        super.initialize();
        
        // Add event listeners but don't duplicate message handler
        this.client.on('authenticated', () => {
            this.debugMessage('Client authenticated');
        });
        
        this.client.on('auth_failure', (msg) => {
            this.debugMessage(`Authentication failed: ${msg}`);
        });
        
        this.client.on('disconnected', (reason) => {
            this.debugMessage(`Client disconnected: ${reason}`);
        });
    }
    
    /**
     * Log a message - wrapper for logger
     * @param {string} message - Message to log
     */
    log(message) {
        if (this.logger) {
            this.logger.info(message);
        } else {
            console.log(message);
        }
    }
    
    /**
     * Get enhanced statistics including AI info
     * @returns {Object} - Enhanced statistics
     */
    getStats() {
        const baseStats = super.getStats();
        
        // Add AI specific stats
        return {
            ...baseStats,
            aiEnabled: true,
            aiProvider: aiConfig.provider,
            aiModel: aiConfig.model
        };
    }
}

module.exports = AIEnabledSender;