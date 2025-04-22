/**
 * WhatsApp AI Auto-Responder with Sofia Persona
 * This component handles automatic responses with memory functionality
 * Using DeepSeek API for responses
 */

const axios = require("axios");
const fs = require('fs');
const path = require('path');

class AIResponder {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY';
        this.apiUrl = options.apiUrl || 'https://api.deepseek.ai/v1/chat/completions';
        this.model = options.model || 'deepseek-coder'; // Default model, adjust as needed
        this.temperature = options.temperature || 0.7;
        this.maxTokens = options.maxTokens || 250;
        this.responseDelay = options.responseDelay || { min: 1500, max: 3500 };
        this.languageConfig = options.languageConfig || 'Nederlands';
        this.logDirectory = options.logDirectory || path.join(__dirname, 'logs');
        this.responseLog = path.join(this.logDirectory, 'ai_responses.log');
        this.debugLogFile = path.join(this.logDirectory, 'ai_debug.log');
        this.conversationHistoryFile = path.join(this.logDirectory, 'conversation_history.json');
        
        // Track conversation state and history for each phone number
        this.conversationState = new Map();
        this.conversationHistory = new Map();
        
        // Load conversation history from file
        this.loadConversationHistory();
        
        console.log('[AI Responder] Initializing Sofia AI Assistant with DeepSeek');
        
        // Service information
        this.serviceContext = {
            companyName: "Een Vakman Nodig",
            website: "https://www.eenvakmannodig.nl/",
            registerLink: "https://www.eenvakmannodig.nl/registreren",
            monthlyCost: "100 euro per maand",
            commission: "2% commissie over het offertebedrag (minimaal €50)",
            requestsPerWeek: "gemiddeld 10 aanvragen per week",
            maxVakmenPerRequest: "maximaal 3 vakmensen per klusaanvraag"
        };
        
        // Sofia personality and guidelines
        this.sofia = {
            name: "Sofia",
            role: "Medewerker bij Een Vakman Nodig",
            tone: "Menselijk, luchtig, duidelijk. Niet formeel. Geen verkooppraatjes.",
            instructions: "Je bent Sofia, een vriendelijke, nuchtere medewerker bij EenVakmanNodig. Je praat luchtig en in simpele taal. Je stuurt WhatsApp- of e-mailberichten naar vakmensen zoals schilders, timmermannen, dakdekkers, stukadoors, enzovoort. Deze mensen werken vaak zelfstandig en spreken soms gebrekkig Nederlands. Gebruik géén moeilijke woorden, géén verkooppraatjes en wees altijd eerlijk. Noem jezelf NOOIT een digitale assistent of AI - je bent gewoon Sofia die bij het bedrijf werkt.",
            opening: [
                "Bent u schilder?",
                "Waar bent u werkzaam?",
                "Bent u timmerman?",
                "Bent u dakdekker?",
                "Zoekt u meer klussen?",
                "Werkt u in de bouw?"
            ]
        };
        
        // Enhanced trigger patterns
        this.triggerPatterns = {
            interest: /(interesse|aanmelden|opgeven|inschrijven|registreren|hoe werkt|meer info|klinkt goed|ik wil|vertel meer|kan ik|ontvangen|klussen|opdrachten)/i,
            costs: /(wat kost|kost het|prijs|prijzen|betalen|tarief|kosten|hoeveel|duur|euro|geld|betaling)/i,
            rejection: /(geen interesse|niet interessant|nee bedankt|nee dank|liever niet|nee|niet nodig|ik pas)/i,
            stopConversation: /(stop|niet meer bellen|laat me met rust|bel me niet|niet meer contact|meld me af|afmelden|unsubscribe|contact verboden|niet storen|wil niet praten|kappen|blokkeer|hou op|genoeg|klaar)/i,
            aggressive: /(rot op|fuck|tering|kanker|kut|shit|verdomme|lul|eikel|mongool)/i,
            trust: /(betrouwbaar|echt|oplichting|scam|werkt dit|is dit echt|nep|fraude)/i,
            howItWorks: /(hoe werkt|uitleg|systeem|werkwijze|platform werking|hoe gaat|doe je|aanmeldproces)/i,
            shortAcknowledgment: /^(ok|okay|oke|prima|goed|top|bedankt|dank je|thanks|ja|nee)$/i,
            greeting: /(hallo|hoi|hey|goedemorgen|goedemiddag|goedenavond|hi|dag)/i,
            profession: /(schilder|timmerman|loodgieter|dakdekker|aannemer|elektricien|installateur|stukadoor|klusjesman)/i,
            callRequest: /(bellen|telefonisch|gesprek|even praten|contact|telefoon)/i,
            poorDutch: /(ik spreek|niet goed nederlands|slecht nederlands)/i
        };
        
        // Opening message variations
        this.openingMessages = [
            "Hoi! Ik ben Sofia van EenVakmanNodig. Bent u schilder of werkt u in een ander vak in de bouw?",
            "Hallo! Sofia hier van EenVakmanNodig. Werkt u zelfstandig in de bouw of als vakman?",
            "Hey daar! Sofia hier. Ik werk bij EenVakmanNodig. Bent u vakman zoals timmerman of schilder?",
            "Hoi! Sofia van EenVakmanNodig. In welk vak werkt u? Ik zoek vakmensen zoals dakdekkers en stukadoors."
        ];
        
        // Initialize log files
        this.initLogFile();
        
        // Human-like typing calculation (characters per minute)
        this.typingSpeed = {
            base: 150,  // Base characters per minute (slow typer)
            variance: 50 // Random variance
        };
    }

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

    loadConversationHistory() {
        try {
            if (fs.existsSync(this.conversationHistoryFile)) {
                const historyData = JSON.parse(fs.readFileSync(this.conversationHistoryFile, 'utf-8'));
                Object.entries(historyData).forEach(([phoneNumber, history]) => {
                    this.conversationHistory.set(phoneNumber, history);
                });
                console.log(`Loaded conversation history for ${this.conversationHistory.size} contacts`);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error.message);
        }
    }

    saveConversationHistory() {
        try {
            const historyData = {};
            this.conversationHistory.forEach((history, phoneNumber) => {
                historyData[phoneNumber] = history;
            });
            fs.writeFileSync(this.conversationHistoryFile, JSON.stringify(historyData, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error saving conversation history:', error.message);
        }
    }

    updateConversationHistory(phoneNumber, message, response) {
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
            aiResponse: response
        });
        
        // Keep only last 20 messages to prevent memory issues
        if (history.messages.length > 20) {
            history.messages = history.messages.slice(-20);
        }
        
        // Extract profession if mentioned
        const professionMatch = message.match(this.triggerPatterns.profession);
        if (professionMatch) {
            history.contactInfo.profession = professionMatch[0];
        }
        
        // Track topics discussed
        if (this.triggerPatterns.costs.test(message)) {
            if (!history.topicsDiscussed.includes("kosten")) {
                history.topicsDiscussed.push("kosten");
            }
        }
        if (this.triggerPatterns.howItWorks.test(message)) {
            if (!history.topicsDiscussed.includes("werking")) {
                history.topicsDiscussed.push("werking");
            }
        }
        if (this.triggerPatterns.trust.test(message)) {
            if (!history.topicsDiscussed.includes("betrouwbaarheid")) {
                history.topicsDiscussed.push("betrouwbaarheid");
            }
        }
        
        // Check for language indicator
        if (this.triggerPatterns.poorDutch.test(message)) {
            history.languagePreference = "Eenvoudig Nederlands";
        }
        
        // Update last interaction time
        history.lastInteraction = new Date().toISOString();
        
        this.conversationHistory.set(phoneNumber, history);
        this.saveConversationHistory();
    }

    async getConversationContext(phoneNumber) {
        const history = this.conversationHistory.get(phoneNumber);
        if (!history || history.messages.length === 0) {
            return {
                summary: "Geen eerdere conversaties.",
                hasIntroduced: false,
                stage: "initial",
                topics: []
            };
        }
        
        // Check if Sofia has introduced herself already
        const hasIntroduced = history.messages.some(msg => 
            msg.aiResponse && (
                msg.aiResponse.includes("Ik ben Sofia") || 
                msg.aiResponse.includes("Sofia hier") ||
                msg.aiResponse.includes("Sofia van EenVakmanNodig")
            )
        );
        
        // Track conversation stage
        let stage = "initial";
        if (history.messages.length >= 3) {
            stage = "engaged";
        }
        if (history.messages.length >= 6) {
            stage = "deep_conversation";
        }
        
        // Track topics that have been discussed
        const topics = [];
        
        // Cost discussion
        if (history.messages.some(msg => 
            (msg.userMessage && this.triggerPatterns.costs.test(msg.userMessage)) ||
            (msg.aiResponse && msg.aiResponse.includes("monthlyCost"))
        )) {
            topics.push("costs");
        }
        
        // How it works
        if (history.messages.some(msg => 
            (msg.userMessage && this.triggerPatterns.howItWorks.test(msg.userMessage)) ||
            (msg.aiResponse && msg.aiResponse.includes("Zo werkt het"))
        )) {
            topics.push("how_it_works");
        }
        
        // Interest
        if (history.messages.some(msg => 
            (msg.userMessage && this.triggerPatterns.interest.test(msg.userMessage)) ||
            (msg.aiResponse && msg.aiResponse.includes("aanmelden"))
        )) {
            topics.push("interest");
        }
        
        // Get the profession if mentioned
        const profession = history.contactInfo.profession || null;
        
        // Get last messages for immediate context
        const lastMessages = history.messages.slice(-4);
        const recentContext = lastMessages.map(msg => 
            `${msg.userMessage ? "Klant: " + msg.userMessage : ""}${msg.aiResponse ? "Sofia: " + msg.aiResponse : ""}`
        ).join("\n");
        
        return {
            summary: this.getConversationSummary(phoneNumber),
            hasIntroduced,
            stage,
            topics,
            profession,
            recentContext
        };
    }

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
- Je naam is ${this.sofia.name} en je werkt bij EenVakmanNodig
- Je helpt vakmensen om meer klussen te vinden
- Je benadert vakmensen om te zien of ze interesse hebben in meer klussen
- Als je wordt gevraagd hoe je aan hun nummer komt, zeg je dat je het via KvK of via internet hebt gevonden

OVER ONS PLATFORM:
- Wij ontvangen dagelijks 200-300 aanvragen van klanten die een vakman zoeken
- Er liggen momenteel honderden klussen open waarvoor offertes nodig zijn
- Vakmensen ontvangen gemiddeld 10 aanvragen per week
- Elke klusaanvraag wordt naar maximaal 3 vakmensen gestuurd

HOE HET WERKT:
1. Aanmelden: Via ${this.serviceContext.registerLink}
2. Kosten: ${this.serviceContext.monthlyCost}
3. Je ontvangt contactgegevens van klanten die een klus hebben
4. Je kunt direct bellen of een afspraak maken met de klant
5. Je maakt je eigen offerte en stuurt deze naar de klant
6. Als de klus doorgaat, betaal je ${this.serviceContext.commission}
7. Onze backoffice helpt je met professionele offertes of juridische hulp indien nodig

WANNEER BELLEN AANBIEDEN:
Als de vakman twijfelt of zelf om een belafspraak vraagt, zeg dan: "Ik kan ook even met je bellen als je dat makkelijker vindt – laat maar weten."

TOON: ${this.sofia.tone}

BELANGRIJK: Stel jezelf maar één keer voor (aan het begin), tenzij er specifiek naar gevraagd wordt. Geen proefperiode aanbieden - dit bestaat niet.`;
    }

    getRandomResponse(responseArray) {
        return responseArray[Math.floor(Math.random() * responseArray.length)];
    }

    shouldEndConversation(message, phoneNumber) {
        const state = this.conversationState.get(phoneNumber) || { messageCount: 0, endConversation: false };
        
        // Check for explicit stop/aggressive messages
        if (this.triggerPatterns.stopConversation.test(message) || this.triggerPatterns.aggressive.test(message)) {
            this.logDebug(`Conversation should end for ${phoneNumber} - Stop/Aggressive trigger detected`);
            state.endConversation = true;
            this.conversationState.set(phoneNumber, state);
            return true;
        }
        
        // If already marked to end conversation, don't respond further
        if (state.endConversation) {
            this.logDebug(`Conversation already ended for ${phoneNumber}`);
            return true;
        }
        
        return false;
    }

    async detectTrigger(message) {
        const normalizedMessage = message.toLowerCase().trim();
        
        if (this.triggerPatterns.aggressive.test(normalizedMessage)) {
            return 'aggressive';
        }
        if (this.triggerPatterns.stopConversation.test(normalizedMessage)) {
            return 'stopConversation';
        }
        if (this.triggerPatterns.greeting.test(normalizedMessage)) {
            return 'greeting';
        }
        if (this.triggerPatterns.interest.test(normalizedMessage)) {
            return 'interest';
        }
        if (this.triggerPatterns.rejection.test(normalizedMessage)) {
            return 'rejection';
        }
        if (this.triggerPatterns.trust.test(normalizedMessage)) {
            return 'trust';
        }
        if (this.triggerPatterns.costs.test(normalizedMessage)) {
            return 'costs';
        }
        if (this.triggerPatterns.howItWorks.test(normalizedMessage)) {
            return 'howItWorks';
        }
        if (this.triggerPatterns.callRequest.test(normalizedMessage)) {
            return 'callRequest';
        }
        if (this.triggerPatterns.poorDutch.test(normalizedMessage)) {
            return 'poorDutch';
        }
        if (this.triggerPatterns.shortAcknowledgment.test(normalizedMessage)) {
            return 'shortAcknowledgment';
        }
        
        return 'general';
    }

    getProfessionSpecificMessage(profession) {
        if (!profession) return null;
        
        switch (profession.toLowerCase()) {
            case 'schilder':
                return "Wij hebben dagelijks nieuwe schilderklussen beschikbaar. Binnen- en buitenschilderwerk.";
            case 'timmerman':
                return "Wij krijgen veel klussen voor timmermannen. Van vloeren tot dakconstructies.";
            case 'dakdekker':
                return "Er komen regelmatig opdrachten binnen voor dakdekkers. Zowel reparaties als complete daken.";
            case 'stukadoor':
                return "We hebben regelmatig klanten die een stukadoor zoeken voor wanden en plafonds.";
            case 'loodgieter':
                return "Er zijn vaak loodgietersklussen zoals badkamers, lekkages en cv-installaties.";
            case 'elektricien':
                return "We hebben vaak klanten die een elektricien zoeken voor installaties en storingen.";
            default:
                return null;
        }
    }
    
    // Calculate realistic typing delay based on message length
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

    async generateResponse(message, phoneNumber) {
        this.logDebug(`Generating response for message: "${message}" from ${phoneNumber}`);
        
        // Update conversation state
        const state = this.conversationState.get(phoneNumber) || { messageCount: 0, endConversation: false };
        state.messageCount++;
        this.conversationState.set(phoneNumber, state);
        
        try {
            // Get conversation history
            const history = this.conversationHistory.get(phoneNumber) || { messages: [], contactInfo: {}, lastInteraction: null };
            const conversationSummary = this.getConversationSummary(phoneNumber);
            
            // Detect trigger type
            const triggerType = await this.detectTrigger(message);
            this.logDebug(`Detected trigger type: ${triggerType}`);
            
            // Check for specific questions about identity
            const isIdentityQuestion = message.toLowerCase().includes("wie is dit") || 
                message.toLowerCase().includes("wie ben je") || 
                message.toLowerCase().includes("wie ben jij") ||
                message.toLowerCase().includes("met wie spreek ik");
                
            if (isIdentityQuestion) {
                return "Ik ben Sofia van EenVakmanNodig. Ik help vakmensen zoals jij aan meer klussen in jouw regio.";
            }
            
            // Check for questions about how we got their number
            const isContactQuestion = message.toLowerCase().includes("hoe kom je aan") || 
                message.toLowerCase().includes("mijn nummer") || 
                message.toLowerCase().includes("hoe heb je") ||
                message.toLowerCase().includes("waar heb je");
                
            if (isContactQuestion && (message.toLowerCase().includes("nummer") || message.toLowerCase().includes("gegevens") || message.toLowerCase().includes("contact"))) {
                return "Ik heb je nummer via de KvK of via internet gevonden. We zoeken actief naar goede vakmensen zoals jij voor klussen die binnenkomen bij ons platform.";
            }
            
            // Check for canned responses based on triggers
            let response = null;
            
            // First message should be an opening question
            if (state.messageCount === 1) {
                response = this.getRandomResponse(this.openingMessages);
            } 
            // Aggressive message
            else if (triggerType === 'aggressive') {
                response = "Ik begrijp dat je niet geïnteresseerd bent. Ik zal je niet meer storen. Fijne dag verder!";
                state.endConversation = true;
                this.conversationState.set(phoneNumber, state);
            } 
            // Stop request
            else if (triggerType === 'stopConversation') {
                response = "Geen probleem. Ik zal je niet meer berichten sturen. Als je ooit nog vragen hebt, weet je me te vinden!";
                state.endConversation = true;
                this.conversationState.set(phoneNumber, state);
            } 
            // Interest in the platform
            else if (triggerType === 'interest') {
                // Check if profession is known and provide customized message
                const professionMsg = history.contactInfo.profession ? 
                    this.getProfessionSpecificMessage(history.contactInfo.profession) : 
                    "";
                
                response = `Goed om te horen dat je interesse hebt! ${professionMsg || ""}

Wij krijgen dagelijks 200-300 aanvragen van klanten die een vakman zoeken. Zo werkt het:

• Je betaalt ${this.serviceContext.monthlyCost}
• Je krijgt contactgegevens van klanten met een klus
• Je maakt zelf een offerte
• Bij een geslaagde klus betaal je ${this.serviceContext.commission}
• Je krijgt ongeveer 10 klussen per week aangeboden

Wil je je aanmelden? Dat kan via: ${this.serviceContext.registerLink}`;
            } 
            // Question about costs
            else if (triggerType === 'costs') {
                response = `Over de kosten:

• Je betaalt ${this.serviceContext.monthlyCost}
• Als je een klus krijgt, betaal je ${this.serviceContext.commission}
• Geen verborgen kosten
• Geen kosten per lead, alleen bij succes

Je verdient dit snel terug met de opdrachten die je krijgt!`;
            } 
            // How it works question
            else if (triggerType === 'howItWorks') {
                response = `Zo werkt het bij Een Vakman Nodig:

1. Klanten melden een klus aan bij ons
2. Wij sturen deze naar maximaal 3 vakmensen zoals jij
3. Je krijgt de contactgegevens van de klant
4. Je belt de klant en maakt een afspraak
5. Je maakt je eigen offerte
6. Bij een geslaagde klus betaal je ${this.serviceContext.commission}

Aanmelden kan via: ${this.serviceContext.registerLink}`;
            } 
            // Call request
            else if (triggerType === 'callRequest') {
                response = "Ik kan ook even met je bellen als je dat makkelijker vindt – laat maar weten welk telefoonnummer en wanneer het uitkomt.";
            }
            // Simple rejection 
            else if (triggerType === 'rejection') {
                response = "Geen probleem! Bedankt voor je tijd. Als je in de toekomst meer klussen zoekt, weet je me te vinden.";
            }
            // Poor Dutch indication
            else if (triggerType === 'poorDutch') {
                // We'll set language preference and let the AI handle it
                history.languagePreference = "Eenvoudig Nederlands";
                this.conversationHistory.set(phoneNumber, history);
            }
            
            // If we have a canned response, use it, otherwise generate one with the AI
            if (!response) {
                // Get the conversation summary
                const systemPrompt = this.createSystemPrompt(conversationSummary);
                
                // Add context about the conversation state
                let contextualPrompt = message;
                
                // Simulate human typing delay based on message content length
                const typingDelay = this.calculateTypingDelay(message);
                
                this.logDebug(`Simulating typing delay: ${typingDelay}ms for message: "${message.substring(0, 30)}..."`);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
                
                // Prepare messages for DeepSeek API
                // Many LLM APIs expect an array of messages with roles, but formats can vary
                // DeepSeek generally follows a format similar to OpenAI but may have specific requirements
                const messages = [
                    {
                        role: "system",
                        content: systemPrompt
                    },
                    {
                        role: "user",
                        content: contextualPrompt
                    }
                ];
                
                // Build request data for DeepSeek API
                // Note: Adjust these parameters based on DeepSeek's specific API documentation
                const requestData = {
                    model: this.model,
                    messages: messages,
                    temperature: this.temperature,
                    max_tokens: this.maxTokens,
                    top_p: 0.9,           // Common parameter for LLM APIs
                    frequency_penalty: 0,  // Prevents repetition
                    presence_penalty: 0    // Encourages talking about new topics
                };
                
                this.logDebug(`Sending request to DeepSeek API with model: ${this.model}`);
                
                try {
                    const completion = await axios.post(
                        this.apiUrl,
                        requestData,
                        {
                            headers: {
                                'Authorization': `Bearer ${this.apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000 // 30 second timeout
                        }
                    );
                    
                    this.logDebug(`DeepSeek API response received successfully`);
                    
                    // Extract the response from DeepSeek
                    // Adjust this based on DeepSeek's actual response structure
                    if (completion.data && 
                        completion.data.choices && 
                        completion.data.choices.length > 0 && 
                        completion.data.choices[0].message &&
                        completion.data.choices[0].message.content) {
                        
                        response = completion.data.choices[0].message.content.trim();
                    } else if (completion.data && completion.data.output) {
                        // Alternative response format some APIs use
                        response = completion.data.output.trim();
                    } else if (completion.data && completion.data.response) {
                        // Another alternative format
                        response = completion.data.response.trim();
                    } else {
                        // Unexpected response format
                        this.logDebug(`Unexpected API response format: ${JSON.stringify(completion.data)}`);
                        throw new Error("Unexpected API response format");
                    }
                } catch (apiError) {
                    // Detailed API error handling
                    this.logDebug(`API call failed: ${apiError.message}`);
                    
                    if (apiError.response) {
                        // The request was made and the server responded with a status code
                        // that falls out of the range of 2xx
                        this.logDebug(`Status: ${apiError.response.status}`);
                        this.logDebug(`Data: ${JSON.stringify(apiError.response.data)}`);
                        this.logDebug(`Headers: ${JSON.stringify(apiError.response.headers)}`);
                    } else if (apiError.request) {
                        // The request was made but no response was received
                        this.logDebug(`No response received: ${apiError.request}`);
                    } else {
                        // Something happened in setting up the request that triggered an Error
                        this.logDebug(`Request setup error: ${apiError.message}`);
                    }
                    
                    throw apiError; // Re-throw to be caught by the outer try/catch
                }
            } else {
                // Even for canned responses, use a typing delay based on the length
                const typingDelay = this.calculateTypingDelay(response);
                this.logDebug(`Simulating typing delay for canned response: ${typingDelay}ms`);
                await new Promise(resolve => setTimeout(resolve, typingDelay));
            }
            
            // Update conversation history
            this.updateConversationHistory(phoneNumber, message, response);
            
            this.logResponse(phoneNumber, message, response);
            return response;
            
        } catch (error) {
            this.logDebug(`Error generating AI response: ${error.message}`);
            if (error.response) {
                this.logDebug(`API error details: ${JSON.stringify(error.response.data || {})}`);
            }
            
            // Fallback response
            const fallbackResponse = "Sorry, ik kan je bericht nu even niet goed verwerken. Kun je het nog een keer proberen?";
            this.updateConversationHistory(phoneNumber, message, fallbackResponse);
            return fallbackResponse;
        }
    }

    logResponse(phoneNumber, message, response) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] From: ${phoneNumber}\nMessage: ${message}\nResponse: ${response}\n---\n`;
        
        try {
            fs.appendFileSync(this.responseLog, logEntry, 'utf-8');
        } catch (error) {
            console.error(`Error writing to response log: ${error.message}`);
        }
    }

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

    async processIncomingMessage(message, phoneNumber) {
        this.logDebug(`Processing incoming message: "${message}" from ${phoneNumber}`);
        
        // Check if we should end the conversation
        if (this.shouldEndConversation(message, phoneNumber)) {
            this.logDebug(`Conversation ended for ${phoneNumber} - Not responding`);
            return null;
        }
        
        // Check if message is too short
        if (message.length < 2) {
            this.logDebug(`Message too short, ignoring: "${message}"`);
            return null;
        }
        
        // Generate AI response
        return await this.generateResponse(message, phoneNumber);
    }
}

/**
 * Integration with WhatsApp Sender and Configuration Loading
 */
class AIEnabledWhatsAppSender extends require('./whatsappSender') {
    constructor(sessionConfig, processedTracker, options = {}) {
        super(sessionConfig, processedTracker, options);
        
        console.log(`[AIEnabledWhatsAppSender] Initializing for session: ${sessionConfig.name}`);
        
        // Load AI configuration from options or environment
        const aiConfig = options.aiSettings || {};
        
        // Initialize AI responder based on provider
        if (aiConfig.provider === 'deepseek') {
            this.aiResponder = new AIResponder({
                apiKey: aiConfig.apiKey || process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY',
                apiUrl: aiConfig.apiUrl || 'https://api.deepseek.ai/v1/chat/completions',
                model: aiConfig.model || 'deepseek-coder',
                logDirectory: options.logDirectory,
                temperature: aiConfig.temperature || 0.7,
                maxTokens: aiConfig.maxResponseLength || 250,
                responseDelay: aiConfig.responseDelay || { min: 1500, max: 3500 }
            });
            console.log(`[AIEnabledWhatsAppSender] Initialized with DeepSeek AI provider`);
        } else if (aiConfig.provider === 'mistral') {
            // Legacy Mistral support
            console.log(`[AIEnabledWhatsAppSender] WARNING: Mistral provider specified but using DeepSeek instead`);
            this.aiResponder = new AIResponder({
                apiKey: aiConfig.apiKey || process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY',
                apiUrl: 'https://api.deepseek.ai/v1/chat/completions', // Override with DeepSeek URL
                model: 'deepseek-coder', // Override with DeepSeek model
                logDirectory: options.logDirectory,
                temperature: aiConfig.temperature || 0.7,
                maxTokens: aiConfig.maxResponseLength || 250,
                responseDelay: aiConfig.responseDelay || { min: 1500, max: 3500 }
            });
            console.log(`[AIEnabledWhatsAppSender] Fallback to DeepSeek AI provider (Mistral requested)`);
        } else {
            // Default to DeepSeek if no provider or unknown provider
            this.aiResponder = new AIResponder({
                apiKey: options.deepseekApiKey || process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY',
                apiUrl: options.deepseekApiUrl || 'https://api.deepseek.ai/v1/chat/completions',
                model: options.model || 'deepseek-coder',
                logDirectory: options.logDirectory,
                temperature: 0.7,
                maxTokens: 250
            });
            console.log(`[AIEnabledWhatsAppSender] Initialized with default DeepSeek AI provider`);
        }
        
        this.aiDebugLogFile = path.join(options.logDirectory || path.join(__dirname, 'logs'), 'ai_integration_debug.log');
        
        fs.appendFileSync(
            this.aiDebugLogFile,
            `\n\n--- AI Integration Debug started for ${sessionConfig.name} at ${new Date().toISOString()} ---\n\n`,
            'utf-8'
        );
    }
    
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
     * Send typing indicators to appear more human-like
     */
    async sendTypingIndicator(phoneNumber, isTyping = true) {
        if (!this.client) return;
        
        try {
            // Try different methods that various WhatsApp libraries might use
            // Method 1: sendPresenceUpdate (as in your original code)
            if (typeof this.client.sendPresenceUpdate === 'function') {
                await this.client.sendPresenceUpdate(isTyping ? 'composing' : 'paused', phoneNumber);
                this.debugMessage(`Set typing indicator ${isTyping ? 'ON' : 'OFF'} for ${phoneNumber} using sendPresenceUpdate`);
                return;
            }
            
            // Method 2: sendChatState (used in some WhatsApp libraries)
            if (typeof this.client.sendChatState === 'function') {
                await this.client.sendChatState(isTyping ? 'composing' : 'paused', phoneNumber);
                this.debugMessage(`Set typing indicator ${isTyping ? 'ON' : 'OFF'} for ${phoneNumber} using sendChatState`);
                return;
            }
            
            // Method 3: startTyping/stopTyping (used in some WhatsApp libraries)
            if (isTyping && typeof this.client.startTyping === 'function') {
                await this.client.startTyping(phoneNumber);
                this.debugMessage(`Set typing indicator ON for ${phoneNumber} using startTyping`);
                return;
            } else if (!isTyping && typeof this.client.stopTyping === 'function') {
                await this.client.stopTyping(phoneNumber);
                this.debugMessage(`Set typing indicator OFF for ${phoneNumber} using stopTyping`);
                return;
            }
            
            // Method 4: setChatState (another variation)
            if (typeof this.client.setChatState === 'function') {
                await this.client.setChatState(phoneNumber, isTyping ? 'composing' : 'paused');
                this.debugMessage(`Set typing indicator ${isTyping ? 'ON' : 'OFF'} for ${phoneNumber} using setChatState`);
                return;
            }
            
            // Method 5: setPresence (another variation)
            if (typeof this.client.setPresence === 'function') {
                await this.client.setPresence(isTyping ? 'available' : 'unavailable', phoneNumber);
                this.debugMessage(`Set presence ${isTyping ? 'available' : 'unavailable'} for ${phoneNumber}`);
                return;
            }
            
            // For WhatsApp Web API (puppeteer/playwright based libraries)
            if (typeof this.client.pupPage !== 'undefined' && this.client.pupPage) {
                // Some libraries use a Puppeteer/Playwright page for automation
                this.debugMessage(`Client appears to use puppeteer/playwright, typing indicators may not be supported`);
                // Not implementing complex puppeteer solutions here
                return;
            }
            
            // If we reach here, none of the known methods are available
            this.debugMessage(`WARNING: Could not set typing indicator - no compatible method found in WhatsApp client`);
            this.debugMessage(`Available client methods: ${Object.getOwnPropertyNames(Object.getPrototypeOf(this.client)).join(', ')}`);
            
        } catch (error) {
            this.debugMessage(`Failed to set typing indicator: ${error.message}`);
        }
    }
    
    setupMessageHandler() {
        this.debugMessage('Setting up message handler...');
        
        if (!this.client) {
            this.debugMessage('ERROR: Client not initialized');
            return;
        }
        
        // Remove any existing message handler
        this.client.removeAllListeners('message');
        this.debugMessage('Removed existing message handlers');
        
        // Set up new message handler with AI
        this.client.on('message', async (message) => {
            this.debugMessage(`=== INCOMING MESSAGE ===`);
            this.debugMessage(`From: ${message.from}`);
            this.debugMessage(`Body: ${message.body}`);
            this.debugMessage(`Type: ${message.type}`);
            this.debugMessage(`isStatus: ${message.isStatus}`);
            this.debugMessage(`hasMedia: ${message.hasMedia}`);
            
            try {
                // Skip group messages, broadcast lists, and status updates
                if (message.from.includes('@g.us') || message.from.includes('@broadcast') || message.isStatus) {
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
                    this.debugMessage(`Response sent successfully`);
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
        
        this.debugMessage('Message handler setup complete');
    }
    
    initialize() {
        this.debugMessage('Initializing AI-enabled WhatsApp sender...');
        super.initialize();
        
        // Ensure message handler is set up when client is ready
        this.client.on('ready', () => {
            this.debugMessage('Client ready, setting up message handler');
            this.setupMessageHandler();
        });
        
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
}

module.exports = {
    AIResponder,
    AIEnabledWhatsAppSender
};