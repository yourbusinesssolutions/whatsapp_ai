/**
 * Conversation Manager for Een Vakman Nodig WhatsApp AI Responder
 * Manages conversation state, history, and stop requests
 */

const fs = require('fs');
const path = require('path');
const triggerPatterns = require('../../config/triggers.config');

class ConversationManager {
    constructor(options = {}) {
        // Configuration
        this.logDirectory = options.logDirectory || path.join(__dirname, '../../logs');
        this.conversationHistoryPath = options.conversationHistoryPath || 
            path.join(this.logDirectory, 'conversation_history.json');
        
        // Track conversation state and history for each phone number
        this.conversationState = new Map();
        this.conversationHistory = new Map();
        this.blockedNumbers = new Set();
        
        // Debug logging
        this.debug = options.debug || false;
        this.debugLogFile = path.join(this.logDirectory, 'conversation_debug.log');
        
        // Ensure directory exists
        this.ensureDirectoryExists(this.logDirectory);
        
        // Load existing history and blocked numbers
        this.loadConversationHistory();
        this.initDebugLog();
    }

    /**
     * Ensure the necessary directories exist
     * @param {string} directory - Directory path to check/create
     */
    ensureDirectoryExists(directory) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
            this.logDebug(`Created directory: ${directory}`);
        }
    }

    /**
     * Initialize debug log file
     */
    initDebugLog() {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(
            this.debugLogFile,
            `\n\n--- Conversation Manager Debug started at ${timestamp} ---\n\n`,
            'utf-8'
        );
    }

    /**
     * Log debug messages
     * @param {string} message - Debug message
     */
    logDebug(message) {
        if (!this.debug) return;
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] DEBUG: ${message}\n`;
        
        console.log(logEntry.trim());
        
        try {
            fs.appendFileSync(this.debugLogFile, logEntry, 'utf-8');
        } catch (error) {
            console.error(`Error writing to debug log: ${error.message}`);
        }
    }

    /**
     * Load conversation history from file
     */
    loadConversationHistory() {
        try {
            if (fs.existsSync(this.conversationHistoryPath)) {
                const historyData = JSON.parse(fs.readFileSync(this.conversationHistoryPath, 'utf-8'));
                
                // Load conversation history
                if (historyData.conversations) {
                    Object.entries(historyData.conversations).forEach(([phoneNumber, history]) => {
                        this.conversationHistory.set(phoneNumber, history);
                    });
                }
                
                // Load blocked numbers
                if (historyData.blockedNumbers && Array.isArray(historyData.blockedNumbers)) {
                    historyData.blockedNumbers.forEach(number => {
                        this.blockedNumbers.add(number);
                    });
                }
                
                this.logDebug(`Loaded conversation history for ${this.conversationHistory.size} contacts`);
                this.logDebug(`Loaded ${this.blockedNumbers.size} blocked numbers`);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error.message);
            // Initialize empty history file if it doesn't exist
            this.saveConversationHistory();
        }
    }

    /**
     * Save conversation history to file
     */
    saveConversationHistory() {
        try {
            // Prepare data for storage
            const historyData = {
                conversations: {},
                blockedNumbers: Array.from(this.blockedNumbers)
            };
            
            // Convert Map to Object for JSON serialization
            this.conversationHistory.forEach((history, phoneNumber) => {
                historyData.conversations[phoneNumber] = history;
            });
            
            // Write to file
            fs.writeFileSync(
                this.conversationHistoryPath, 
                JSON.stringify(historyData, null, 2), 
                'utf-8'
            );
            
            this.logDebug('Conversation history saved successfully');
        } catch (error) {
            console.error('Error saving conversation history:', error.message);
        }
    }

    /**
     * Check if a number is blocked
     * @param {string} phoneNumber - The phone number to check
     * @returns {boolean} - True if the number is blocked
     */
    isBlocked(phoneNumber) {
        return this.blockedNumbers.has(phoneNumber);
    }

    /**
     * Block a phone number from receiving future messages
     * @param {string} phoneNumber - The phone number to block
     * @param {string} reason - The reason for blocking
     */
    blockNumber(phoneNumber, reason = 'user_request') {
        this.blockedNumbers.add(phoneNumber);
        
        // Add a note in the conversation history
        this.updateConversationHistory(
            phoneNumber,
            "SYSTEM",
            `Number blocked. Reason: ${reason}`,
            { blockReason: reason, blockedAt: new Date().toISOString() }
        );
        
        this.logDebug(`Blocked number ${phoneNumber}. Reason: ${reason}`);
        this.saveConversationHistory();
    }

    /**
     * Check if a conversation should end based on user message
     * @param {string} message - User message
     * @param {string} phoneNumber - User phone number
     * @returns {boolean} - True if conversation should end
     */
    shouldEndConversation(message, phoneNumber) {
        // Already blocked
        if (this.isBlocked(phoneNumber)) {
            this.logDebug(`Conversation already ended for ${phoneNumber} - Number is blocked`);
            return true;
        }
        
        // Get conversation state
        const state = this.conversationState.get(phoneNumber) || { 
            messageCount: 0, 
            endConversation: false 
        };
        
        // If already marked to end conversation
        if (state.endConversation) {
            this.logDebug(`Conversation already marked to end for ${phoneNumber}`);
            return true;
        }
        
        // Check for explicit stop/aggressive messages
        if (triggerPatterns.stopConversation.test(message) || triggerPatterns.aggressive.test(message)) {
            this.logDebug(`Conversation should end for ${phoneNumber} - Stop/Aggressive trigger detected`);
            
            // Update state
            state.endConversation = true;
            this.conversationState.set(phoneNumber, state);
            
            // Block the number to prevent future messages
            this.blockNumber(phoneNumber, triggerPatterns.aggressive.test(message) 
                ? 'aggressive_message' 
                : 'stop_request'
            );
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Update the conversation state
     * @param {string} phoneNumber - User phone number 
     * @param {Object} stateUpdate - State updates to apply
     */
    updateConversationState(phoneNumber, stateUpdate) {
        const currentState = this.conversationState.get(phoneNumber) || {
            messageCount: 0,
            endConversation: false,
            lastMessageTimestamp: null,
            topics: [],
            profession: null
        };
        
        // Update state with new data
        const updatedState = {
            ...currentState,
            ...stateUpdate,
            lastMessageTimestamp: new Date().toISOString()
        };
        
        this.conversationState.set(phoneNumber, updatedState);
        return updatedState;
    }
    
    /**
     * Get the current conversation state
     * @param {string} phoneNumber - User phone number
     * @returns {Object} - Current conversation state
     */
    getConversationState(phoneNumber) {
        return this.conversationState.get(phoneNumber) || {
            messageCount: 0,
            endConversation: false,
            lastMessageTimestamp: null,
            topics: [],
            profession: null
        };
    }
    
    /**
     * Update conversation history with a new message
     * @param {string} phoneNumber - User phone number
     * @param {string} message - User message
     * @param {string} response - AI response
     * @param {Object} metadata - Additional metadata
     */
    updateConversationHistory(phoneNumber, message, response, metadata = {}) {
        // Get existing history or create new one
        const history = this.conversationHistory.get(phoneNumber) || {
            messages: [],
            contactInfo: {},
            lastInteraction: null,
            firstContact: new Date().toISOString(),
            topicsDiscussed: [],
            languagePreference: "Nederlands"
        };
        
        // Add new message to history
        history.messages.push({
            timestamp: new Date().toISOString(),
            userMessage: message,
            aiResponse: response,
            ...metadata
        });
        
        // Keep only last 20 messages to prevent memory issues
        const maxMessages = 20;
        if (history.messages.length > maxMessages) {
            history.messages = history.messages.slice(-maxMessages);
        }
        
        // Extract profession if mentioned
        if (message !== "SYSTEM" && triggerPatterns.profession.test(message)) {
            const professionMatch = message.match(triggerPatterns.profession);
            if (professionMatch) {
                history.contactInfo.profession = professionMatch[0];
                
                // Also update in state
                const state = this.getConversationState(phoneNumber);
                this.updateConversationState(phoneNumber, {
                    ...state,
                    profession: professionMatch[0]
                });
            }
        }
        
        // Track topics discussed
        if (message !== "SYSTEM") {
            // Check for various topics
            if (triggerPatterns.costs.test(message) && !history.topicsDiscussed.includes("kosten")) {
                history.topicsDiscussed.push("kosten");
            }
            if (triggerPatterns.howItWorks.test(message) && !history.topicsDiscussed.includes("werking")) {
                history.topicsDiscussed.push("werking");
            }
            if (triggerPatterns.trust.test(message) && !history.topicsDiscussed.includes("betrouwbaarheid")) {
                history.topicsDiscussed.push("betrouwbaarheid");
            }
            if (triggerPatterns.interest.test(message) && !history.topicsDiscussed.includes("interesse")) {
                history.topicsDiscussed.push("interesse");
            }
            
            // Check for language indicator
            if (triggerPatterns.poorDutch.test(message)) {
                history.languagePreference = "Eenvoudig Nederlands";
            }
        }
        
        // Update last interaction time
        history.lastInteraction = new Date().toISOString();
        
        // Save updated history
        this.conversationHistory.set(phoneNumber, history);
        
        // Periodically save to disk
        if (Math.random() < 0.1) { // Save ~10% of the time to reduce disk I/O
            this.saveConversationHistory();
        }
    }
    
    /**
     * Get the conversation history for a phone number
     * @param {string} phoneNumber - User phone number
     * @returns {Object} - Conversation history
     */
    getConversationHistory(phoneNumber) {
        return this.conversationHistory.get(phoneNumber) || {
            messages: [],
            contactInfo: {},
            lastInteraction: null,
            firstContact: new Date().toISOString(),
            topicsDiscussed: [],
            languagePreference: "Nederlands"
        };
    }
    
    /**
     * Generate a summary of the conversation history for AI context
     * @param {string} phoneNumber - User phone number
     * @returns {string} - Conversation summary
     */
    getConversationSummary(phoneNumber) {
        const history = this.getConversationHistory(phoneNumber);
        
        if (!history || history.messages.length === 0) {
            return "Geen eerdere conversaties.";
        }
        
        // Get conversation stage
        let stage = "initial";
        if (history.messages.length >= 3) {
            stage = "engaged";
        }
        if (history.messages.length >= 6) {
            stage = "deep_conversation";
        }
        
        // Format profession info if available
        const professionInfo = history.contactInfo.profession ? 
            `Vakgebied: ${history.contactInfo.profession}` : 
            "Vakgebied nog onbekend";
            
        // Format topics discussed
        const topicsInfo = history.topicsDiscussed.length > 0 ?
            `Besproken onderwerpen: ${history.topicsDiscussed.join(', ')}` :
            "Nog geen specifieke onderwerpen besproken";
            
        // Format language preference
        const languageInfo = `Taalvoorkeur: ${history.languagePreference}`;
        
        // Get last few messages for immediate context
        const lastMessages = history.messages.slice(-4);
        const recentContext = lastMessages.map(msg => 
            `${msg.userMessage ? "Klant: " + msg.userMessage : ""}${msg.aiResponse ? "\nSofia: " + msg.aiResponse : ""}`
        ).join("\n\n");
        
        // Create the summary
        return `--- Conversatie Overzicht ---
Eerste contact: ${new Date(history.firstContact).toLocaleString('nl-NL')}
Laatste interactie: ${new Date(history.lastInteraction).toLocaleString('nl-NL')}
Fase: ${stage}
${professionInfo}
${topicsInfo}
${languageInfo}
Totaal berichten: ${history.messages.length}

--- Recente berichten ---
${recentContext}`;
    }
    
    /**
     * Detect what kind of message the user sent
     * @param {string} message - User message
     * @returns {string} - Trigger type
     */
    detectTriggerType(message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        // Check each trigger pattern
        if (triggerPatterns.aggressive.test(normalizedMessage)) return 'aggressive';
        if (triggerPatterns.stopConversation.test(normalizedMessage)) return 'stopConversation';
        if (triggerPatterns.greeting.test(normalizedMessage)) return 'greeting';
        if (triggerPatterns.interest.test(normalizedMessage)) return 'interest';
        if (triggerPatterns.rejection.test(normalizedMessage)) return 'rejection';
        if (triggerPatterns.trust.test(normalizedMessage)) return 'trust';
        if (triggerPatterns.costs.test(normalizedMessage)) return 'costs';
        if (triggerPatterns.howItWorks.test(normalizedMessage)) return 'howItWorks';
        if (triggerPatterns.callRequest.test(normalizedMessage)) return 'callRequest';
        if (triggerPatterns.poorDutch.test(normalizedMessage)) return 'poorDutch';
        if (triggerPatterns.shortAcknowledgment.test(normalizedMessage)) return 'shortAcknowledgment';
        if (triggerPatterns.identityQuestion.test(normalizedMessage)) return 'identityQuestion';
        if (triggerPatterns.numberSource.test(normalizedMessage)) return 'numberSource';
        if (triggerPatterns.profession.test(normalizedMessage)) return 'profession';
        
        // Default case - general message
        return 'general';
    }
    
    /**
     * Get a random response from an array of possible responses
     * @param {Array} responseOptions - Array of possible responses
     * @returns {string} - Selected response
     */
    getRandomResponse(responseOptions) {
        if (!Array.isArray(responseOptions) || responseOptions.length === 0) {
            return null;
        }
        return responseOptions[Math.floor(Math.random() * responseOptions.length)];
    }
}

module.exports = ConversationManager;