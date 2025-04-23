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
        
        // Carpenter
        "timmerman": 'Hoi! Ben je timmerman en zoek je meer opdrachten? Bij Een Vakman Nodig betaal je €100 p/m en 2% commissie bij geslaagde klussen. Onbeperkt aanvragen voor diverse timmerwerken. Interesse? eenvakmannodig.nl',
        
        // Electrician
        "elektricien": 'Werk je als elektricien en wil je meer klussen? Bij Een Vakman Nodig betaal je €100 p/m en 2% commissie (min. €50) bij succes. Ontvang dagelijks nieuwe aanvragen in jouw regio. Meer info: eenvakmannodig.nl',
        
        // Plumber
        "loodgieter": 'Hoi! Als loodgieter kun je je aansluiten bij Een Vakman Nodig. Je betaalt €100 p/m en 2% commissie bij succes. Dagelijks nieuwe opdrachten voor loodgieterswerk. Interesse? Kijk op eenvakmannodig.nl',
        
        // Tile setter
        "tegelzetter": 'Ben je tegelzetter? Een Vakman Nodig zoekt vakmensen zoals jij! Voor €100 p/m en 2% commissie krijg je direct toegang tot klanten die een tegelzetter zoeken. Geen tussenpersonen. Aanmelden: eenvakmannodig.nl',
        
        // Contractors
        "aannemer": 'Hoi! Als aannemer kun je via Een Vakman Nodig nieuwe projecten vinden. €100 p/m en 2% commissie bij succes. Wij brengen je direct in contact met klanten die een aannemer zoeken. Info: eenvakmannodig.nl',
        
        // Heating engineer
        "cv-monteur": 'Werk je als cv-monteur? Bij Een Vakman Nodig vind je nieuwe klanten voor €100 p/m en 2% commissie bij geslaagde klussen. Onbeperkte aanvragen, direct contact met klanten. Info: eenvakmannodig.nl',
        
        // Cleaner
        "schoonmaker": 'Ben je schoonmaker of heb je een schoonmaakbedrijf? Een Vakman Nodig brengt je in contact met nieuwe klanten. €100 p/m, 2% commissie bij succes. Geen verplichtingen. Meer info op eenvakmannodig.nl',
        
        // Real estate agent
        "makelaar": 'Werk je als makelaar? Een Vakman Nodig kan je helpen aan nieuwe klanten. Voor €100 p/m en 2% commissie krijg je toegang tot mensen die een makelaar zoeken. Interesse? Kijk op eenvakmannodig.nl',
        
        // Web designer
        "webdesigner": 'Ben je webdesigner of -ontwikkelaar? Een Vakman Nodig verbindt je met nieuwe klanten. €100 p/m en 2% commissie bij succes. Direct contact, geen tussenpersonen. Meer info: eenvakmannodig.nl',
        
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
            "Ik kan ook even met je bellen als je dat makkelijker vindt – laat maar weten welk telefoonnummer en wanneer het uitkomt.",
            "Natuurlijk kan ik je ook bellen om het persoonlijk toe te lichten. Wat is een goed moment en op welk nummer kan ik je bereiken?",
            "Als je liever telefonisch contact hebt, kan ik je bellen. Laat me weten wanneer het schikt en op welk nummer."
        ],
        
        // When user rejects the offer
        rejection: [
            "Geen probleem! Bedankt voor je tijd. Als je in de toekomst meer klussen zoekt, weet je me te vinden.",
            "Oké, geen probleem. Mocht je later nog interesse hebben, kun je altijd contact opnemen.",
            "Begrijpelijk! Bedankt voor je reactie. De deur staat altijd open mocht je in de toekomst toch interesse hebben."
        ],
        
        // When user asks about identity
        identityQuestion: [
            "Ik ben Sofia van EenVakmanNodig. Ik help vakmensen zoals jij aan meer klussen in jouw regio.",
            "Sofia hier, ik werk bij Een Vakman Nodig. We brengen vakmensen in contact met klanten die op zoek zijn naar hun diensten.",
            "Ik ben Sofia en werk voor Een Vakman Nodig, een platform dat vakmensen zoals jij helpt aan nieuwe klussen in jouw regio."
        ],
        
        // When user asks how we got their number
        numberSource: [
            "Ik heb je nummer via de KvK of via internet gevonden. We zoeken actief naar goede vakmensen zoals jij voor klussen die binnenkomen bij ons platform.",
            "Je nummer heb ik gevonden via openbare bronnen zoals de KvK. We zoeken naar vakmensen die we kunnen matchen met onze klusaanvragen.",
            "Ik heb je contactgegevens via openbare bronnen zoals de KvK of je website gevonden. We zijn altijd op zoek naar vakkundige professionals voor ons platform."
        ],
        
        // When user asks about the company
        companyInfo: [
            "Een Vakman Nodig is een platform dat klanten verbindt met gekwalificeerde professionals. We zijn opgericht in 2023 en gevestigd in Amsterdam. We zijn geen bemiddelingsplatform maar brengen klanten direct in contact met vakmensen zoals jij.",
            "Een Vakman Nodig is een Nederlands platform dat sinds 2023 actief is. We brengen klanten in contact met vakmensen voor allerlei klussen. Anders dan andere platforms rekenen we alleen een maandelijks bedrag plus een kleine commissie bij succes.",
            "We zijn Een Vakman Nodig, een platform opgericht in 2023. Ons doel is klanten en professionals direct met elkaar verbinden zonder tussenkomst. We zijn gevestigd in Amsterdam en werken in heel Nederland."
        ],
        
        // When user has dashboard questions
        dashboardHelp: [
            "In je dashboard kun je al je aanvragen, klussen en betalingen beheren. Na aanmelding krijg je direct toegang. Ik kan je helpen bij specifieke vragen over het dashboard.",
            "Het dashboard geeft je een overzicht van alle binnenkomende klusaanvragen en je kunt er direct op reageren. Je vindt er ook je facturen en statistieken. Heb je hulp nodig met een specifiek onderdeel?",
            "Via je dashboard beheer je je profiel, bekijk je nieuwe aanvragen en communiceer je met klanten. Je kunt ook je beschikbaarheid instellen en statistieken inzien. Waar kan ik je mee helpen?"
        ],
        
        // When user has tech problems
        techSupport: [
            "Als je technische problemen ervaart, probeer dan eerst je browser te vernieuwen of een andere browser te gebruiken. Je kunt ook onze support contacteren via info@eenvakmannodig.nl voor verdere hulp.",
            "Bij technische problemen raden we aan je browser cache te wissen of een andere browser te proberen. Voor directe hulp kun je ons bereiken via WhatsApp op +31850022587.",
            "Sorry dat je problemen ervaart. Probeer eerst je browser te vernieuwen. Als het probleem aanhoudt, mail dan naar info@eenvakmannodig.nl met een beschrijving en eventueel een screenshot."
        ],
        
        // When user asks about trustworthiness
        trustQuestion: [
            "Een Vakman Nodig is een betrouwbaar platform met KvK-registratie (94683808). We werken transparant met duidelijke kosten en hebben al honderden vakmensen geholpen aan nieuwe klussen zonder verborgen kosten.",
            "We zijn Een Vakman Nodig B.V., geregistreerd bij de KvK onder nummer 94683808. Onze betalingen verlopen veilig via Stripe en we hebben al vele vakmensen geholpen aan nieuwe opdrachten.",
            "Een Vakman Nodig is een officieel geregistreerd bedrijf bij de KvK. We werken met een transparant prijsmodel zonder verborgen kosten. Je bepaalt zelf welke aanvragen je accepteert en bent nooit verplicht een klus aan te nemen."
        ],
        
        // When user wishes to think about it
        thinkingAboutIt: [
            "Natuurlijk, neem gerust de tijd om erover na te denken. Als je nog vragen hebt, hoor ik het graag. Je kunt ook onze website bezoeken voor meer informatie: eenvakmannodig.nl",
            "Geen probleem! Neem rustig de tijd. Ik zit hier als je meer informatie nodig hebt of vragen hebt. Je kunt ook altijd een kijkje nemen op onze website: eenvakmannodig.nl",
            "Begrijpelijk dat je er even over wilt nadenken. Mocht je specifieke vragen hebben, hoor ik het graag. Onze website eenvakmannodig.nl biedt ook uitgebreide informatie."
        ],
        
        // When user mentions competitors
        competitorMention: [
            "Anders dan platforms zoals Werkspot werken wij met een vast maandbedrag (€100) en een kleine commissie bij succes (2%). Je betaalt dus niet per lead en krijgt direct contact met de klant.",
            "Het grote verschil met andere platforms is dat wij geen leadverkopers zijn. Je betaalt een vast bedrag per maand en krijgt direct toegang tot klanten, zonder per lead te betalen.",
            "Wat ons onderscheidt van andere platforms is ons eerlijke prijsmodel: vast maandbedrag, kleine commissie, geen verborgen kosten. Je communiceert direct met klanten en maakt je eigen offerte."
        ],
        
        // When user has poor Dutch skills
        poorDutch: [
            "Geen probleem! Ik zal eenvoudige taal gebruiken. Ons platform helpt vakmensen nieuwe klanten te vinden. Kosten: €100 per maand + kleine commissie bij succes. Interesse?",
            "Ik begrijp het. Ik zal simpel praten. Een Vakman Nodig is een platform voor vakmensen om nieuwe klanten te vinden. Je betaalt €100 per maand. Wil je meer informatie?",
            "Ik snap het. Ik zal het simpel houden. Een Vakman Nodig helpt vakmensen zoals jij aan nieuwe klanten. Kosten: €100 per maand en 2% bij succes. Interesse?"
        ]
    }
};

module.exports = messageTemplates;