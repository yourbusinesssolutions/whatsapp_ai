/**
 * AI Configuration for Een Vakman Nodig WhatsApp Marketing System
 * All AI-related settings are centralized here
 */

// Load environment variables
require('dotenv').config();

const aiConfig = {
    // Main AI settings
    enabled: true,
    provider: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY', 
    apiUrl: 'https://api.deepseek.ai/v1/chat/completions',
    model: 'deepseek-coder',
    
    // Response configuration
    responseLanguage: "Dutch",
    maxResponseLength: 200,
    temperature: 0.3,  // 0.0 = deterministic, 1.0 = creative
    
    // Human-like response delay
    responseDelay: {
        min: 2000,  // Minimum delay in milliseconds
        max: 4000   // Maximum delay in milliseconds
    },
    
    // Typing simulation
    typingSpeed: {
        base: 150,    // Base characters per minute (slow typer)
        variance: 50  // Random variance to make it more human-like
    },
    
    // Conversation memory settings
    memory: {
        maxConversationEntries: 20, // Keep only the last 20 messages in memory
        summarizeAfter: 10,         // Start summarizing after 10 messages
        saveInterval: 5000          // Save conversation history every 5 seconds
    },
    
    // System prompt customization
    persona: {
        name: "Sofia",
        role: "Medewerker bij Een Vakman Nodig",
        tone: "Menselijk, luchtig, duidelijk. Niet formeel. Geen verkooppraatjes.",
        instructions: "Je bent Sofia, een vriendelijke, nuchtere medewerker bij EenVakmanNodig. Je praat luchtig en in simpele taal. Je stuurt WhatsApp- of e-mailberichten naar vakmensen zoals schilders, timmermannen, dakdekkers, stukadoors, enzovoort. Deze mensen werken vaak zelfstandig en spreken soms gebrekkig Nederlands. Gebruik géén moeilijke woorden, géén verkooppraatjes en wees altijd eerlijk. Noem jezelf NOOIT een digitale assistent of AI - je bent gewoon Sofia die bij het bedrijf werkt."
    },
    
    // Opening messages to start conversations
    openingMessages: [
        "Hoi! Ik ben Sofia van EenVakmanNodig. Bent u schilder of werkt u in een ander vak in de bouw?",
        "Hallo! Sofia hier van EenVakmanNodig. Werkt u zelfstandig in de bouw of als vakman?",
        "Hey daar! Sofia hier. Ik werk bij EenVakmanNodig. Bent u vakman zoals timmerman of schilder?",
        "Hoi! Sofia van EenVakmanNodig. In welk vak werkt u? Ik zoek vakmensen zoals dakdekkers en stukadoors."
    ]
};

module.exports = aiConfig;