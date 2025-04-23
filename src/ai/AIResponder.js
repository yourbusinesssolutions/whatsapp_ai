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
            maxVakmenPerRequest: businessConfig.platformStats.professionalsPerRequest,
            businessDetails: businessConfig.businessDetails,
            coreValues: businessConfig.coreValues || []
        };
        
        // Sofia persona
        this.sofia = {
            name: aiConfig.persona.name,
            role: aiConfig.persona.role,
            tone: aiConfig.persona.tone,
            instructions: aiConfig.persona.instructions,
            detailedInstructions: aiConfig.persona.detailedInstructions || "",
            opening: aiConfig.openingMessages
        };
        
        // Human-like typing calculation
        this.typingSpeed = aiConfig.typingSpeed || {
            base: 150,  // Base characters per minute (slow typer)
            variance: 50 // Random variance
        };
        
        // Enhanced conversation handling
        this.conversationTips = aiConfig.conversationHandlingTips || {};
        this.enhancedResponses = aiConfig.enhancedResponses || {};
        
        // Dashboard and product knowledge
        this.dashboardFunctionality = businessConfig.dashboardFunctionality || {};
        this.commonQuestions = businessConfig.commonQuestions || {};
        this.troubleshooting = businessConfig.troubleshooting || {};
        
        // In-memory conversation history for each phone number
        // This is the key to ensuring continuity
        this.conversationHistories = new Map();
        
        // Track whether an introduction has been made to each number
        this.introductionMade = new Set();
        
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
     * Create a comprehensive system prompt for AI using conversation context
     * @returns {string} - System prompt for AI
     */
    createSystemPrompt() {
        // Get the detailed instructions or fall back to basic instructions
        const detailedInstructions = this.sofia.detailedInstructions || this.sofia.instructions;
            
        return `Je bent ${this.sofia.name}, een vriendelijke, nuchtere medewerker bij ${this.serviceContext.companyName}. Je praat luchtig en in simpele taal. Je stuurt WhatsApp-berichten naar vakmensen zoals schilders, timmermannen, dakdekkers, stukadoors, enzovoort.

${detailedInstructions}

KRITIEKE INSTRUCTIES - VEREIST:
1. Je hebt jezelf AL GEÏNTRODUCEERD aan het begin van het gesprek. INTRODUCEER JEZELF NIET OPNIEUW.
2. ZORG ERVOOR dat je in je antwoorden rekening houdt met wat er eerder in het gesprek is gezegd.
3. BEHANDEL dit als een doorlopend gesprek - niet als afzonderlijke berichten.
4. VERMIJD zinnen als "Sofia hier" of "Ik ben Sofia" behalve bij de allereerste begroeting.
5. SPREEK ALS EEN ECHT PERSOON in een WhatsApp-gesprek - natuurlijk en informeel.
6. REAGEER DIRECT op de vraag van de gebruiker zonder jezelf opnieuw voor te stellen.

OVER ONS BEDRIJF:
- ${this.serviceContext.companyName} is opgericht in ${this.serviceContext.businessDetails.founded} en is gevestigd in ${this.serviceContext.businessDetails.headquarters}
- KvK-nummer: ${this.serviceContext.businessDetails.kvkNumber}
- BTW-nummer: ${this.serviceContext.businessDetails.vatNumber}
- Website: ${this.serviceContext.website}
- Contact: ${this.serviceContext.contactEmail}, ${this.serviceContext.phoneNumber} (alleen WhatsApp)
- Openingstijden: ${this.serviceContext.businessDetails.operatingHours}

OVER ONS PLATFORM:
- Wij ontvangen dagelijks ${businessConfig.platformStats.requestsPerDay} aanvragen van klanten die een vakman zoeken
- Er liggen momenteel honderden klussen open waarvoor offertes nodig zijn
- Vakmensen ontvangen ${businessConfig.platformStats.requestsPerWeekPerProfessional}
- Elke klusaanvraag wordt naar ${businessConfig.platformStats.professionalsPerRequest} vakmensen gestuurd

HOE HET WERKT:
${businessConfig.howItWorks.map((step, index) => `${index + 1}. ${step}`).join('\n')}

KOSTEN VOOR VAKMENSEN:
- Maandelijks: ${businessConfig.costStructure.monthlyFee}
- Commissie: ${businessConfig.costStructure.commission} (minimaal ${businessConfig.costStructure.minimumCommission})
- Factuurcyclus: ${businessConfig.costStructure.billingCycle}
- Betalingsmethoden: ${businessConfig.costStructure.paymentMethods.join(', ')}
- Betalingstermijn: ${businessConfig.costStructure.paymentDueDays} dagen

VAKGEBIEDEN DIE WE ONDERSTEUNEN:
- Bouw: timmermannen, schilders, loodgieters, elektriciens, stukadoors, dakdekkers, etc.
- Schoonmaak: huishoudelijk, kantoor, industrieel, etc.
- Makelaardij: verkoop, aankoop, taxatie, verhuur
- Webdesign: website ontwikkeling, webshop, SEO
- Marketing: SEO, social media, Google Ads, content
- Boekhouding: ZZP, MKB, BTW-aangifte, jaarrekeningen

VEELGESTELDE VRAGEN:
- Kosten: €100 per maand en 2% commissie (min. €50) bij geslaagde klussen
- Opzegtermijn: Je kunt op elk moment opzeggen met een maand opzegtermijn
- Verplichtingen: Je bent niet verplicht om klussen aan te nemen
- Werkgebied: Je kunt zelf aangeven in welke regio('s) je wilt werken
- Aanvragen: Gemiddeld 10 aanvragen per week per vakman

WANNEER BELLEN AANBIEDEN:
Als de vakman twijfelt of zelf om een belafspraak vraagt, zeg dan: "Ik kan ook even met je bellen als je dat makkelijker vindt – laat maar weten."

TOON: ${this.sofia.tone}`;
    }

    /**
     * Get a profession-specific message with enhanced detail
     * @param {string} profession - Professional category
     * @returns {string|null} - Profession-specific message or null
     */
    getProfessionSpecificMessage(profession) {
        if (!profession) return null;
        
        // First try to get from the detailed professional messages
        const message = businessConfig.professionalMessages[profession.toLowerCase()];
        
        // If found, return it
        if (message) return message;
        
        // Otherwise, check if there's a general category this profession belongs to
        for (const [category, professions] of Object.entries(businessConfig.professionalCategories)) {
            if (professions.includes(profession.toLowerCase())) {
                // Return a generic message for this category
                switch(category) {
                    case "construction":
                        return `We krijgen dagelijks veel aanvragen voor bouwprofessionals zoals ${profession}s.`;
                    case "cleaning":
                        return `We hebben regelmatig klanten die op zoek zijn naar schoonmaakdiensten.`;
                    case "realEstate":
                        return `Er is veel vraag naar makelaars en vastgoedprofessionals op ons platform.`;
                    case "webDesign":
                        return `We hebben regelmatig klanten die op zoek zijn naar webdesign en ontwikkeling.`;
                    case "marketing":
                        return `Er komen regelmatig aanvragen binnen voor marketingprofessionals.`;
                    case "accounting":
                        return `We hebben klanten die op zoek zijn naar boekhouders en financieel adviseurs.`;
                    default:
                        return null;
                }
            }
        }
        
        return null;
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
        
        // These are the only triggers that should always get canned responses
        switch (triggerType) {
            case 'stopConversation':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.stopConversation);
                
            case 'aggressive':
                return this.conversationManager.getRandomResponse(messageTemplates.responses.aggressive);
                
            default:
                return null;
        }
    }

    /**
     * Get or initialize conversation history for a phone number
     * @param {string} phoneNumber - User phone number
     * @returns {Array} - Conversation history messages array
     */
    getConversationHistory(phoneNumber) {
        if (!this.conversationHistories.has(phoneNumber)) {
            // Initialize with system message
            this.conversationHistories.set(phoneNumber, [
                { role: "system", content: this.createSystemPrompt() }
            ]);
        }
        
        return this.conversationHistories.get(phoneNumber);
    }

    /**
     * Add a message to the conversation history
     * @param {string} phoneNumber - User phone number
     * @param {string} role - Message role (user/assistant)
     * @param {string} content - Message content
     */
    addMessageToHistory(phoneNumber, role, content) {
        const history = this.getConversationHistory(phoneNumber);
        history.push({ role, content });
        
        // Keep history within manageable limits (system + 20 exchanges)
        const maxHistoryLength = 41; // system message + 20 exchanges (20 user + 20 assistant)
        if (history.length > maxHistoryLength) {
            // Keep system message and trim the oldest messages
            const systemMessage = history[0];
            const trimmedHistory = history.slice(-(maxHistoryLength - 1));
            this.conversationHistories.set(phoneNumber, [systemMessage, ...trimmedHistory]);
        }
    }

    /**
     * Generate AI response using OpenAI/DeepSeek API with full conversation history
     * @param {string} message - User message
     * @param {string} phoneNumber - User phone number 
     * @returns {Promise<string>} - AI generated response
     */
    async generateAIResponse(message, phoneNumber) {
        try {
            // Get or initialize conversation history
            const conversationHistory = this.getConversationHistory(phoneNumber);
            
            // Add user message to history
            this.addMessageToHistory(phoneNumber, "user", message);
            
            // Check if this is the very first message and introduction hasn't been made
            if (!this.introductionMade.has(phoneNumber)) {
                // Mark that introduction has been made to prevent future reintroductions
                this.introductionMade.add(phoneNumber);
                
                // For the very first message, use a canned opening
                const openingMessage = this.conversationManager.getRandomResponse(this.sofia.opening);
                
                // Add this to the conversation history
                this.addMessageToHistory(phoneNumber, "assistant", openingMessage);
                
                // Return the opening
                return openingMessage;
            }
            
            // Log history size for debugging
            this.logDebug(`Sending request to DeepSeek API with ${conversationHistory.length} message history`);
            
            // Make API request using OpenAI client
            const completion = await this.openai.chat.completions.create({
                model: this.model,
                messages: conversationHistory,
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                top_p: 0.9,
                frequency_penalty: 0.3, // Increased to reduce repetitive language
                presence_penalty: 0.3   // Increased to reduce repetition
            });
            
            this.logDebug(`DeepSeek API response received successfully`);
            
            // Extract response from API result
            let response = '';
            if (completion.choices && 
                completion.choices.length > 0 && 
                completion.choices[0].message &&
                completion.choices[0].message.content) {
                
                response = completion.choices[0].message.content.trim();
                
                // Add assistant response to conversation history
                this.addMessageToHistory(phoneNumber, "assistant", response);
                
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
                    
                    // Add to message history for AI context
                    this.addMessageToHistory(phoneNumber, "user", message);
                    this.addMessageToHistory(phoneNumber, "assistant", finalResponse);
                    
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
            
            // Only stop/aggressive triggers get canned responses now
            let response = this.getCannedResponse(triggerType, phoneNumber);
            
            // If no canned response, generate with AI
            if (!response) {
                // Simulate typing delay
                const typingDelay = this.calculateTypingDelay(message);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                
                // Generate AI response with full conversation history
                response = await this.generateAIResponse(message, phoneNumber);
            } else {
                // Even for canned responses, use a typing delay based on the length
                const typingDelay = this.calculateTypingDelay(response);
                this.logDebug(`Simulating typing delay for canned response: ${typingDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                
                // For canned responses, still add them to the conversation history
                this.addMessageToHistory(phoneNumber, "user", message);
                this.addMessageToHistory(phoneNumber, "assistant", response);
            }
            
            // Update conversation history in database
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
                
                // Add to message history
                this.addMessageToHistory(phoneNumber, "user", message);
                this.addMessageToHistory(phoneNumber, "assistant", fallbackResponse);
                
                return fallbackResponse;
            }
            
            return null;
        }
    }
}
module.exports = AIResponder;