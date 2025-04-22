/**
 * AI Responder for Een Vakman Nodig WhatsApp Marketing System
 * Handles generating AI responses with proper handling of stop requests
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const ConversationManager = require('./ConversationManager');
const aiConfig = require('../../config/ai.config');
const businessConfig = require('../../config/business.config');
const messageTemplates = require('../../config/messages.config');

class AIResponder {
    constructor(options = {}) {
        // AI Configuration
        this.apiKey = options.apiKey || aiConfig.apiKey || process.env.DEEPSEEK_API_KEY;
        this.apiUrl = options.apiUrl || aiConfig.apiUrl;
        this.model = options.model || aiConfig.model;
        this.temperature = options.temperature || aiConfig.temperature;
        this.maxTokens = options.maxTokens || aiConfig.maxResponseLength;
        this.responseDelay = options.responseDelay || aiConfig.responseDelay;
        this.languageConfig = options.languageConfig || aiConfig.responseLanguage;
        
        // Initialize OpenAI client
        this.openai = new OpenAI({
            baseURL: this.apiUrl,
            apiKey: this.apiKey
        });
        
        // Directories and logging
        this.logDirectory = options.logDirectory || path.join(__dirname, '../../logs');
        this.responseLog = path.join(this.logDirectory, 'ai_responses.log');
        this.debugLogFile = path.join(this.logDirectory, 'ai_debug.log');
        
        // Initialize conversation manager
        this.conversationManager = new ConversationManager({
            logDirectory: this.logDirectory,
            debug: options.debug || aiConfig.debug
        });
        
        // Service context (business info)
        this.serviceContext = {
            companyName: businessConfig.companyName,
            website: businessConfig.website,
            registerLink: businessConfig.signupLink,
            monthlyCost: businessConfig.costStructure.monthlyFee,
            commission: businessConfig.costStructure.commission,
            requestsPerWeek: businessConfig.platformStats.requestsPerWeekPerProfessional,
            maxVakmenPerRequest: businessConfig.platformStats.professionalsPerRequest
        };
        
        // Sofia persona
        this.sofia = {
            name: aiConfig.persona.name,
            role: aiConfig.persona.role,
            tone: aiConfig.persona.tone,
            instructions: aiConfig.persona.instructions,
            opening: aiConfig.openingMessages
        };
        
        // Human-like typing calculation
        this.typingSpeed = aiConfig.typingSpeed || {
            base: 150,  // Base characters per minute (slow typer)
            variance: 50 // Random variance
        };
        
        // Initialize log files
        this.initLogFile();
    }

    /**
     * Initialize log files
     */
    initLogFile() {
        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory, { recursive: true });
        }
        
        const timestamp = new Date().toISOString();
        fs.appendFileSync(
            this.debugLogFile,
            `\n\n--- Sofia AI Responder Debug started at ${timestamp} ---\n\n`,
            'utf-8'
        );
        
        fs.appendFileSync(
            this.responseLog,
            `\n\n--- Sofia AI Responder started at ${timestamp} ---\n\n`,
            'utf-8'
        );
    }

    /**
     * Log debug messages
     * @param {string} message - Debug message to log
     */
    logDebug(message) {
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
     * Log AI response
     * @param {string} phoneNumber - User phone number
     * @param {string} message - User message
     * @param {string} response - AI response
     */
    logResponse(phoneNumber, message, response) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] From: ${phoneNumber}\nMessage: ${message}\nResponse: ${response}\n---\n`;
        
        try {
            fs.appendFileSync(this.responseLog, logEntry, 'utf-8');
        } catch (error) {
            console.error(`Error writing to response log: ${error.message}`);
        }
    }

    /**
     * Create a system prompt for AI using conversation context
     * @param {string} conversationSummary - Conversation summary
     * @returns {string} - System prompt for AI
     */
    createSystemPrompt(conversationSummary) {
        return `Je bent ${this.sofia.name}, een vriendelijke, nuchtere medewerker bij EenVakmanNodig. Je praat luchtig en in simpele taal. Je stuurt WhatsApp-berichten naar vakmensen zoals schilders, timmermannen, dakdekkers, stukadoors, enzovoort.

BELANGRIJKE INSTRUCTIES:
1. Je bent NOOIT een AI of digitale assistent - je bent gewoon ${this.sofia.name} die bij EenVakmanNodig werkt
2. Spreek ALTIJD in simpel Nederlands
3. Gebruik GEEN moeilijke woorden
4. Gebruik GEEN verkooppraatjes
5. Houdt berichten kort en duidelijk
6. Gebruik alleen complete links, geen knoppen
7. Gedraag je als een echt persoon, niet als een robot of AI
8. Als iemand vraagt wie dit is, zeg je alleen dat je ${this.sofia.name} bent van EenVakmanNodig

CONVERSATIE HISTORIE:
${conversationSummary}

OVER JOU EN HET BEDRIJF:
- Je naam is ${this.sofia.name} en je werkt bij ${businessConfig.companyName}
- Je helpt vakmensen om meer klussen te vinden
- Je benadert vakmensen om te zien of ze interesse hebben in meer klussen
- Als je wordt gevraagd hoe je aan hun nummer komt, zeg je dat je het via KvK of via internet hebt gevonden

OVER ONS PLATFORM:
- Wij ontvangen dagelijks ${businessConfig.platformStats.requestsPerDay} aanvragen van klanten die een vakman zoeken
- Er liggen momenteel honderden klussen open waarvoor offertes nodig zijn
- Vakmensen ontvangen ${businessConfig.platformStats.requestsPerWeekPerProfessional}
- Elke klusaanvraag wordt naar ${businessConfig.platformStats.professionalsPerRequest}

HOE HET WERKT:
1. Aanmelden: Via ${businessConfig.signupLink}
2. Kosten: ${businessConfig.costStructure.monthlyFee}
3. Je ontvangt contactgegevens van klanten die een klus hebben
4. Je kunt direct bellen of een afspraak maken met de klant
5. Je maakt je eigen offerte en stuurt deze naar de klant
6. Als de klus doorgaat, betaal je ${businessConfig.costStructure.commission}
7. Onze backoffice helpt je met professionele offertes of juridische hulp indien nodig

WANNEER BELLEN AANBIEDEN:
Als de vakman twijfelt of zelf om een belafspraak vraagt, zeg dan: "Ik kan ook even met je bellen als je dat makkelijker vindt – laat maar weten."

TOON: ${this.sofia.tone}

BELANGRIJK: Stel jezelf maar één keer voor (aan het begin), tenzij er specifiek naar gevraagd wordt. Geen proefperiode aanbieden - dit bestaat niet.`;
    }

    /**
     * Get a profession-specific message
     * @param {string} profession - Professional category
     * @returns {string|null} - Profession-specific message or null
     */
    getProfessionSpecificMessage(profession) {
        if (!profession) return null;
        
        const message = businessConfig.professionalMessages[profession.toLowerCase()];
        return message || null;
    }

    /**
     * Calculate realistic typing delay based on message length
     * @param {string} message - Message text
     * @returns {number} - Delay in milliseconds
     */
    calculateTypingDelay(message) {
        if (!message) return this.responseDelay.min;
        
        // Calculate typing speed with some human variance
        const cpm = this.typingSpeed.base + (Math.random() * this.typingSpeed.variance * 2) - this.typingSpeed.variance;
        
        // Convert characters per minute to milliseconds per character
        const msPerChar = (60 * 1000) / cpm;
        
        // Calculate time to type this message
        let typingTime = message.length * msPerChar;
        
        // Add some thinking time for longer messages
        if (message.length > 100) {
            typingTime += 3000; // Extra thinking time for complex messages
        } else if (message.length > 50) {
            typingTime += 1500; // Less thinking time for medium messages
        }
        
        // Add occasional random pause for very natural feeling (like being distracted)
        if (message.length > 30 && Math.random() < 0.2) {
            typingTime += Math.random() * 5000; // 0-5 second random pause
        }
        
        // Ensure result is within reasonable bounds
        const delayTime = Math.min(Math.max(typingTime, this.responseDelay.min), 15000);
        
        this.logDebug(`Calculated typing delay: ${Math.round(delayTime)}ms for message length ${message.length}`);
        return delayTime;
    }

    /**
     * Generate a canned response based on trigger type
     * @param {string} triggerType - Detected trigger type
     * @param {string} phoneNumber - User phone number
     * @returns {string|null} - Canned response or null
     */
    getCannedResponse(triggerType, phoneNumber) {
        const state = this.conversationManager.getConversationState(phoneNumber);
        const history = this.conversationManager.getConversationHistory(phoneNumber);
        
        // First message should be an opening
        if (state.messageCount === 1 || state.messageCount === 0) {
            return this.conversationManager.getRandomResponse(this.sofia.opening);
        }
        
        // Check for specific responses based on trigger type
        switch (triggerType) {
            case 'stopConversation':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.stopConversation);
                
            case 'aggressive':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.aggressive);
                
            case 'interest':
                // Add profession-specific info if known
                const professionMsg = history.contactInfo.profession ? 
                    this.getProfessionSpecificMessage(history.contactInfo.profession) : 
                    "";
                
                // Get base interest response
                const baseResponse = this.conversationManager.getRandomResponse(messageTemplates.responses.interest);
                
                // Insert profession message if available
                if (professionMsg) {
                    return baseResponse.replace("Wij krijgen dagelijks", `${professionMsg}\n\nWij krijgen dagelijks`);
                }
                return baseResponse;
                
            case 'costs':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.costs);
                
            case 'howItWorks':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.howItWorks);
                
            case 'callRequest':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.callRequest);
                
            case 'rejection':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.rejection);
                
            case 'identityQuestion':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.identityQuestion);
                
            case 'numberSource':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.numberSource);
                
            default:
                return null;
        }
    }

    /**
     * Generate AI response using OpenAI/DeepSeek API
     * @param {string} message - User message
     * @param {string} phoneNumber - User phone number 
     * @returns {Promise<string>} - AI generated response
     */
    async generateAIResponse(message, phoneNumber) {
        try {
            // Get conversation summary
            const conversationSummary = this.conversationManager.getConversationSummary(phoneNumber);
            const systemPrompt = this.createSystemPrompt(conversationSummary);
            
            // Prepare messages for DeepSeek API
            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: message
                }
            ];
            
            this.logDebug(`Sending request to DeepSeek API with model: ${this.model}`);
            
            // Make API request using OpenAI client
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            
            this.logDebug(`DeepSeek API response received successfully`);
            
            // Extract response from API result
            let response = '';
            if (completion.choices && 
                completion.choices.length > 0 && 
                completion.choices[0].message &&
                completion.choices[0].message.content) {
                
                response = completion.choices[0].message.content.trim();
            } else {
                // Unexpected response format
                this.logDebug(`Unexpected API response format: ${JSON.stringify(completion)}`);
                throw new Error("Unexpected API response format");
            }
            
            return response;
            
        } catch (error) {
            this.logDebug(`API call failed: ${error.message}`);
            
            if (error.response) {
                this.logDebug(`Status: ${error.response.status}`);
                this.logDebug(`Data: ${JSON.stringify(error.response.data)}`);
            }
            
            throw error;
        }
    }

    /**
     * Process an incoming message and generate a response
     * @param {string} message - User message
     * @param {string} phoneNumber - User phone number
     * @returns {Promise<string|null>} - Response message or null if conversation should end
     */
    async processIncomingMessage(message, phoneNumber) {
        this.logDebug(`Processing incoming message: "${message}" from ${phoneNumber}`);
        
        // Check if the message is too short
        if (message.length < 2) {
            this.logDebug(`Message too short, ignoring: "${message}"`);
            return null;
        }
        
        // Get current conversation state
        const state = this.conversationManager.getConversationState(phoneNumber);
        
        // Update message count
        const updatedState = this.conversationManager.updateConversationState(phoneNumber, {
            messageCount: (state.messageCount || 0) + 1
        });
        
        // Check if we should end the conversation (user requested to stop, aggressive, etc.)
        if (this.conversationManager.shouldEndConversation(message, phoneNumber)) {
            // Get appropriate response for end of conversation
            const triggerType = this.conversationManager.detectTriggerType(message);
            
            // Only return a final response for stop requests, not for pre-blocked numbers
            if (triggerType === 'stopConversation' || triggerType === 'aggressive') {
                const finalResponse = this.getCannedResponse(triggerType, phoneNumber);
                
                if (finalResponse) {
                    // Log the final response
                    this.logResponse(phoneNumber, message, finalResponse);
                    
                    // Update conversation history
                    this.conversationManager.updateConversationHistory(
                        phoneNumber, 
                        message, 
                        finalResponse,
                        { final: true, reason: triggerType }
                    );
                    
                    return finalResponse;
                }
            }
            
            this.logDebug(`Conversation ended for ${phoneNumber} - Not responding`);
            return null;
        }
        
        try {
            // Detect trigger type
            const triggerType = this.conversationManager.detectTriggerType(message);
            this.logDebug(`Detected trigger type: ${triggerType}`);
            
            // Try to get a canned response first
            let response = this.getCannedResponse(triggerType, phoneNumber);
            
            // If no canned response, generate with AI
            if (!response) {
                // Simulate typing delay
                const typingDelay = this.calculateTypingDelay(message);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                
                // Generate AI response
                response = await this.generateAIResponse(message, phoneNumber);
            } else {
                // Even for canned responses, use a typing delay based on the length
                const typingDelay = this.calculateTypingDelay(response);
                this.logDebug(`Simulating typing delay for canned response: ${typingDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
            }
            
            // Update conversation history
            this.conversationManager.updateConversationHistory(phoneNumber, message, response);
            
            // Log the response
            this.logResponse(phoneNumber, message, response);
            
            return response;
            
        } catch (error) {
            this.logDebug(`Error generating response: ${error.message}`);
            
            if (error.response) {
                this.logDebug(`API error details: ${JSON.stringify(error.response.data || {})}`);
            }
            
            // Fallback response only if the conversation shouldn't end
            if (!this.conversationManager.shouldEndConversation(message, phoneNumber)) {
                const fallbackResponse = "Sorry, ik kan je bericht nu even niet goed verwerken. Kun je het nog een keer proberen?";
                
                // Update conversation history with the error
                this.conversationManager.updateConversationHistory(
                    phoneNumber, 
                    message, 
                    fallbackResponse,
                    { error: true, errorMessage: error.message }
                );
                
                return fallbackResponse;
            }
            
            return null;
        }
    }
}
module.exports = AIResponder;