/**
 * Configuration of trigger patterns for Een Vakman Nodig AI responder
 * These patterns help identify user intent in conversations
 */

const triggerPatterns = {
    // User showing interest in the service
    interest: /(interesse|aanmelden|opgeven|inschrijven|registreren|hoe werkt|meer info|klinkt goed|ik wil|vertel meer|kan ik|ontvangen|klussen|opdrachten|informatie|starten|beginnen|jouw aanbod|jullie aanbod|meer klanten|meer werk|aansluiten|aanvragen|meedoen|lid worden)/i,
    
    // User asking about costs
    costs: /(wat kost|kost het|prijs|prijzen|betalen|tarief|kosten|hoeveel|duur|euro|geld|betaling|commissie|maand|maandelijks|abonnement|factuur|rekening|€|procent|minimum)/i,
    
    // User rejecting the offer
    rejection: /(geen interesse|niet interessant|nee bedankt|nee dank|liever niet|nee|niet nodig|ik pas|doe ik niet|hoeft niet|te duur|laat maar|niet aan beginnen|niets voor mij)/i,
    
    // User wanting to stop the conversation - IMPORTANT!
    stopConversation: /(stop|niet meer bellen|laat me met rust|bel me niet|niet meer contact|meld me af|afmelden|unsubscribe|contact verboden|niet storen|wil niet praten|kappen|blokkeer|hou op|genoeg|klaar|verwijder mijn gegevens)/i,
    
    // User being aggressive or using inappropriate language
    aggressive: /(rot op|fuck|tering|kanker|kut|shit|verdomme|lul|eikel|mongool|sukkel|idioot|zever|spam|oplichter|oplichting|bullshit|onzin|bedrieger)/i,
    
    // User questioning reliability of the service
    trust: /(betrouwbaar|echt|oplichting|scam|werkt dit|is dit echt|nep|fraude|legitiem|bewijs|garantie|zekerheid|vertrouwen|ervaring|reviews|recensies|beoordelingen|hoe lang bestaan|opgericht|bestaand|echte klanten)/i,
    
    // User asking how the service works
    howItWorks: /(hoe werkt|uitleg|systeem|werkwijze|platform werking|hoe gaat|doe je|aanmeldproces|stap voor stap|uitleggen|procedure|proces|functie|aanvraag|daarna|dan|verloop|eerst|voorbeeld|delen|verdelen)/i,
    
    // User sending a short acknowledgment
    shortAcknowledgment: /^(ok|okay|oke|prima|goed|top|bedankt|dank je|thanks|ja|nee|begrijpelijk|helder|duidelijk|snap ik)$/i,
    
    // User sending a greeting
    greeting: /(hallo|hoi|hey|goedemorgen|goedemiddag|goedenavond|hi|dag|hee|goedendag|goeie|joehoe|hai|jo)/i,
    
    // User mentioning their profession
    profession: /(schilder|timmerman|loodgieter|dakdekker|aannemer|elektricien|installateur|stukadoor|klusjesman|cv-monteur|tegelzetter|metselaar|stratenmaker|hovenier|tuinier|glaszetter|stucadoor|zzp|zelfstandig|eigen bedrijf|eenmanszaak|vakman|vakspecialist|handyman|monteur|glazenwasser|schoonmaker|web|website)/i,
    
    // User requesting a call
    callRequest: /(bellen|telefonisch|gesprek|even praten|contact|telefoon|direct contact|bel mij|bel me|gesprek|horen|bereikbaar|bereiken|nummer)/i,
    
    // User mentioning they don't speak Dutch well
    poorDutch: /(ik spreek|niet goed nederlands|slecht nederlands|geen nederlands|beetje nederlands|moeilijk verstaan|buitenlands|taal|polska|polski|english|englisch|russisch|turkish|arabic|spanish|español)/i,
    
    // User asking about number source
    numberSource: /(hoe kom je aan|waar heb je|mijn nummer|nummer vandaan|gegevens|contact|hebt gevonden|hoe weet je|waarom mij|waarom ik|gevonden|ken je me|ken je mij)/i,
    
    // User asking who is messaging them
    identityQuestion: /(wie is dit|wie ben je|wie ben jij|met wie spreek ik|wie ben|wie is er|met wie heb ik|wie chat|spreek ik met|wie vertegenwoordig|welk bedrijf|namens wie|welke firma|welk platform)/i,
    
    // User asking about the company
    companyInfo: /(een vakman nodig|bedrijf|onderneming|firma|platform|website|over jullie|over jou|over het bedrijf|wie zijn jullie|hoe lang bestaan|opgericht|kantoor|locatie|vestiging|eigenaar|waar gevestigd|adres|bezoeken|kvk|kvk nummer|btw|btw nummer|handelsnaam|ingeschreven|over|vertel)/i,
    
    // User asking about the dashboard
    dashboardHelp: /(dashboard|inloggen|login|account|profiel|wachtwoord|aanmelden|registreren|gegevens wijzigen|wijzigen|aanpassen|mijn account|updates|notificaties|meldingen|berichten|in mijn account|toegang|portal|omgeving)/i,
    
    // User having technical problems
    techSupport: /(probleem|werkt niet|fout|error|kan niet|bug|vastgelopen|error|storing|technisch|inlogproblemen|wachtwoord vergeten|reset|herstellen|wifi|internet|browser|app|mobiel|telefoon|pc|computer|website doet het niet)/i,
    
    // User asking about competitors or comparing services
    competitorMention: /(werkspot|andere platform|concurrenten|vergelijken|beter dan|alternatief|andere dienst|andere service|andere bedrijf|andere partij|verschil met|ook nog|hetzelfde als)/i,
    
    // User wants to think about it
    thinkingAboutIt: /(denk erover na|overweeg|zal erover nadenken|even over nadenken|later|misschien|nog niet zeker|twijfel|bedenktijd|overleggen|intern bespreken|collega|partner|eerst|nog geen beslissing|niet meteen|even wachten|rustig bekijken)/i,
    
    // User asking about website
    websiteQuestion: /(website|link|url|site|webpagina|online|web|bezoeken|kijken op|checken|www|http|eenvakman|vakmannodig|een vakman|aanmelden via|registreren via)/i,
    
    // User asking about payment methods
    paymentQuestion: /(betaal|betaling|factuur|rekening|ideal|creditcard|bankrekening|overschrijving|automatisch|incasso|transactie|betaaltermijn|direct|machtiging|storting|pinnen|verzenden|ontvangen|aflossing)/i,
    
    // User asking about time-related information
    timeQuestion: /(wanneer|openingstijden|beschikbaar|tijd|uren|moment|periode|termijn|tijdsduur|weekend|avond|dagelijks|wekelijks|maandelijks|contract|opzegtermijn|vast zitten|periode|verbintenis|duur)/i,
    
    // User asking about service areas
    serviceAreaQuestion: /(regio|gebied|omgeving|stad|dorp|provincie|landelijk|postcode|woonplaats|buurt|werkgebied|lokaal|gemeente|werken in|werken jullie in|klanten in|klussen in|opdrachten in|afstand)/i,
    
    // User asking about success rate or statistics
    statsQuestion: /(hoeveel|succes|statistieken|percentage|klanten|tevreden|succesvol|cijfers|resultaten|gemiddeld|verdienen|opbrengst|terugverdienen|garantie|zekerheid|bewijs|ervaring|bewezen)/i
};

module.exports = triggerPatterns;