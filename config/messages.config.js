/**
 * Message templates for Een Vakman Nodig WhatsApp Marketing System
 * All outgoing message templates are centralized here
 */

const messageTemplates = {
    // Initial outreach messages by professional category
    outreach: {
        // Roofer
        "dakdekker": 'Hoi! We zoeken nog 5 dakdekkers voor Een Vakman Nodig. Je werkt zelfstandig, betaalt €100 p/m en 2% commissie bij geslaagde klussen. Geen testfase, maar direct aanvragen. Doe je mee? eenvakmannodig.nl',
        
        // Painter
        "schilder": 'Ben jij schilder en wil je meer opdrachten? Bij Een Vakman Nodig betaal je €100 per maand + 2% commissie per geslaagde klus. Geen limiet op aanvragen. Sluit je aan via eenvakmannodig.nl',
        
        // Plasterer
        "stucadoor": 'We zoeken nog stukadoors voor ons platform Een Vakman Nodig. Je betaalt €100 p/m + 2% commissie. Daarvoor krijg je onbeperkt aanvragen. Je werkt zelfstandig en direct met klanten. Interesse? eenvakmannodig.nl',
        
        // Handyman
        "klusjesman": 'Werk je als klusjesman? Bij Een Vakman Nodig betaal je €100 p/m en 2% commissie. Je krijgt onbeperkt aanvragen en betaalt alleen bij succes. Geen opstart, direct aan de slag: eenvakmannodig.nl',
        
        // Default message if category doesn't match any specific template
        "default": 'Hoi! Als vakman kun je je nu aansluiten bij Een Vakman Nodig. Je betaalt €100 p/m en 2% commissie bij geslaagde klussen. Onbeperkt aanvragen, geen testfase. Meer info: eenvakmannodig.nl'
    },
    
    // Automatic responses based on detected triggers
    responses: {
        // When user wants to stop the conversation
        stopConversation: [
            "Geen probleem. Ik zal je niet meer berichten sturen. Als je ooit nog vragen hebt, weet je me te vinden!",
            "Begrepen, ik stop met berichten sturen. Fijne dag verder!",
            "Oké, dan laat ik je met rust. Bedankt voor je tijd."
        ],
        
        // When user is aggressive
        aggressive: [
            "Ik begrijp dat je niet geïnteresseerd bent. Ik zal je niet meer storen. Fijne dag verder!",
            "Het spijt me als ik je heb gestoord. Ik zal je niet meer berichten."
        ],
        
        // When user shows interest
        interest: [
            "Goed om te horen dat je interesse hebt! Wij krijgen dagelijks 200-300 aanvragen van klanten die een vakman zoeken. Zo werkt het:\n\n• Je betaalt €100 p/m\n• Je krijgt contactgegevens van klanten met een klus\n• Je maakt zelf een offerte\n• Bij een geslaagde klus betaal je 2% commissie (min. €50)\n• Je krijgt ongeveer 10 klussen per week aangeboden\n\nWil je je aanmelden? Dat kan via: https://eenvakmannodig.nl/aanmelden"
        ],
        
        // When user asks about costs
        costs: [
            "Over de kosten:\n\n• Je betaalt €100 per maand\n• Als je een klus krijgt, betaal je 2% commissie (minimaal €50)\n• Geen verborgen kosten\n• Geen kosten per lead, alleen bij succes\n\nJe verdient dit snel terug met de opdrachten die je krijgt!"
        ],
        
        // When user asks how it works
        howItWorks: [
            "Zo werkt het bij Een Vakman Nodig:\n\n1. Klanten melden een klus aan bij ons\n2. Wij sturen deze naar maximaal 3 vakmensen zoals jij\n3. Je krijgt de contactgegevens van de klant\n4. Je belt de klant en maakt een afspraak\n5. Je maakt je eigen offerte\n6. Bij een geslaagde klus betaal je 2% commissie\n\nAanmelden kan via: https://eenvakmannodig.nl/aanmelden"
        ],
        
        // When user requests a call
        callRequest: [
            "Ik kan ook even met je bellen als je dat makkelijker vindt – laat maar weten welk telefoonnummer en wanneer het uitkomt."
        ],
        
        // When user rejects the offer
        rejection: [
            "Geen probleem! Bedankt voor je tijd. Als je in de toekomst meer klussen zoekt, weet je me te vinden.",
            "Oké, geen probleem. Mocht je later nog interesse hebben, kun je altijd contact opnemen."
        ],
        
        // When user asks about identity
        identityQuestion: [
            "Ik ben Sofia van EenVakmanNodig. Ik help vakmensen zoals jij aan meer klussen in jouw regio."
        ],
        
        // When user asks how we got their number
        numberSource: [
            "Ik heb je nummer via de KvK of via internet gevonden. We zoeken actief naar goede vakmensen zoals jij voor klussen die binnenkomen bij ons platform."
        ]
    }
};

module.exports = messageTemplates;