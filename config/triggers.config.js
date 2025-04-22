/**
 * Configuration of trigger patterns for Een Vakman Nodig AI responder
 * These patterns help identify user intent in conversations
 */

const triggerPatterns = {
    // User showing interest in the service
    interest: /(interesse|aanmelden|opgeven|inschrijven|registreren|hoe werkt|meer info|klinkt goed|ik wil|vertel meer|kan ik|ontvangen|klussen|opdrachten)/i,
    
    // User asking about costs
    costs: /(wat kost|kost het|prijs|prijzen|betalen|tarief|kosten|hoeveel|duur|euro|geld|betaling)/i,
    
    // User rejecting the offer
    rejection: /(geen interesse|niet interessant|nee bedankt|nee dank|liever niet|nee|niet nodig|ik pas)/i,
    
    // User wanting to stop the conversation - IMPORTANT!
    stopConversation: /(stop|niet meer bellen|laat me met rust|bel me niet|niet meer contact|meld me af|afmelden|unsubscribe|contact verboden|niet storen|wil niet praten|kappen|blokkeer|hou op|genoeg|klaar)/i,
    
    // User being aggressive or using inappropriate language
    aggressive: /(rot op|fuck|tering|kanker|kut|shit|verdomme|lul|eikel|mongool)/i,
    
    // User questioning reliability of the service
    trust: /(betrouwbaar|echt|oplichting|scam|werkt dit|is dit echt|nep|fraude)/i,
    
    // User asking how the service works
    howItWorks: /(hoe werkt|uitleg|systeem|werkwijze|platform werking|hoe gaat|doe je|aanmeldproces)/i,
    
    // User sending a short acknowledgment
    shortAcknowledgment: /^(ok|okay|oke|prima|goed|top|bedankt|dank je|thanks|ja|nee)$/i,
    
    // User sending a greeting
    greeting: /(hallo|hoi|hey|goedemorgen|goedemiddag|goedenavond|hi|dag)/i,
    
    // User mentioning their profession
    profession: /(schilder|timmerman|loodgieter|dakdekker|aannemer|elektricien|installateur|stukadoor|klusjesman)/i,
    
    // User requesting a call
    callRequest: /(bellen|telefonisch|gesprek|even praten|contact|telefoon)/i,
    
    // User mentioning they don't speak Dutch well
    poorDutch: /(ik spreek|niet goed nederlands|slecht nederlands)/i,
    
    // User asking about number source
    numberSource: /(hoe kom je aan|waar heb je|mijn nummer|nummer vandaan|gegevens|contact|hebt gevonden)/i,
    
    // User asking who is messaging them
    identityQuestion: /(wie is dit|wie ben je|wie ben jij|met wie spreek ik|wie ben)/i
};

module.exports = triggerPatterns;