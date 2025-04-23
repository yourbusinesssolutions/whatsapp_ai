/**
 * Business Configuration for Een Vakman Nodig
 * All business-specific data and logic is centralized here
 */

const businessConfig = {
    // Company Information
    companyName: "Een Vakman Nodig B.V.",
    description: "Platform voor vakmensen die direct opdrachten ontvangen van klanten in hun regio",
    website: "https://eenvakmannodig.nl",
    signupLink: "https://eenvakmannodig.nl/aanmelden",
    contactEmail: "info@eenvakmannodig.nl",
    phoneNumber: "+31850022587", // WhatsApp only
    
    // Business Details
    businessDetails: {
        kvkNumber: "94683808",
        vatNumber: "NL862012345B01",
        founded: "2023",
        headquarters: "Amsterdam, Netherlands",
        operatingHours: "24/7 platform beschikbaarheid; Support team beschikbaar maandag-vrijdag 9:00-17:00",
    },
    
    // Mission and Values
    mission: "Onze missie is revolutioneren hoe mensen gekwalificeerde professionals vinden door een transparante, efficiënte en betrouwbare marktplaats te creëren. We verbinden klanten met de juiste experts en helpen tegelijkertijd vakkundige professionals hun activiteiten te laten groeien zonder buitensporige marketingkosten.",
    
    coreValues: [
        "Vertrouwen & Betrouwbaarheid: We verifiëren alle professionals op ons platform",
        "Transparantie: Duidelijke prijzen en geen verborgen kosten",
        "Kwaliteitsservice: Focus op klanttevredenheid en professionele excellentie",
        "Toegankelijkheid: 24/7 platform beschikbaarheid voor gebruikersgemak",
        "Eerlijkheid: No-cure, no-pay model dat voor beide partijen werkt"
    ],
    
    // Cost Structure
    costStructure: {
        monthlyFee: "€100 per maand",
        commission: "2% commissie per geslaagde klus",
        minimumCommission: "€50",
        billingCycle: "Elke 30 dagen vanaf aanmelding",
        paymentMethods: ["Creditcard", "iDEAL"],
        paymentDueDays: 14
    },
    
    // Platform Statistics
    platformStats: {
        requestsPerDay: "200-300 aanvragen dagelijks",
        requestsPerWeekPerProfessional: "gemiddeld 10 aanvragen per week",
        professionalsPerRequest: "maximaal 3 vakmensen per klusaanvraag",
        responseTimeHours: 24
    },
    
    // Marketing Points
    marketingPoints: [
        "Je maakt zelf offertes en bepaalt je eigen prijzen",
        "Wij verkopen geen leads, je krijgt direct contact met klanten",
        "We zijn geen advertentieplatform zoals Werkspot",
        "Je betaalt alleen voor maandabonnement en commissie bij succes",
        "Geen verborgen kosten of verrassingen",
        "Krijg alleen relevante klusopdrachten in jouw vakgebied"
    ],
    
    // Professional Categories - Expanded with all service types
    professionalCategories: {
        "construction": [
            "timmerman",
            "tegelzetter",
            "schilder",
            "stucadoor",
            "aannemer",
            "metselaar",
            "dakdekker",
            "loodgieter",
            "elektricien",
            "cv-monteur",
            "airco-installateur",
            "zonweringspecialist",
            "vloerenlegger",
            "glaszetter",
            "behanger",
            "isolatiespecialist"
        ],
        "cleaning": [
            "huishoudelijke schoonmaker",
            "kantoor schoonmaker",
            "industriële schoonmaker",
            "glasbewasser",
            "tapijtreiniger",
            "gevelreiniger"
        ],
        "realEstate": [
            "verkoopmakelaar",
            "aankoopmakelaar",
            "taxatie specialist",
            "verhuurmakelaar"
        ],
        "webDesign": [
            "website ontwikkeling",
            "webshop ontwikkeling",
            "website redesign",
            "seo optimalisatie"
        ],
        "marketing": [
            "seo specialist",
            "social media marketing",
            "google ads expert",
            "content marketing specialist"
        ],
        "accounting": [
            "zzp boekhouder",
            "mkb boekhouder",
            "btw aangifte specialist",
            "jaarrekening specialist"
        ]
    },
    
    // Profession-specific information to use in messages
    professionalMessages: {
        "schilder": "Wij hebben dagelijks nieuwe schilderklussen beschikbaar. Binnen- en buitenschilderwerk.",
        "timmerman": "Wij krijgen veel klussen voor timmermannen. Van vloeren tot dakconstructies.",
        "dakdekker": "Er komen regelmatig opdrachten binnen voor dakdekkers. Zowel reparaties als complete daken.",
        "stucadoor": "We hebben regelmatig klanten die een stukadoor zoeken voor wanden en plafonds.",
        "loodgieter": "Er zijn vaak loodgietersklussen zoals badkamers, lekkages en cv-installaties.",
        "elektricien": "We hebben vaak klanten die een elektricien zoeken voor installaties en storingen.",
        "tegelzetter": "We krijgen veel aanvragen voor tegelwerk in badkamers en keukens.",
        "aannemer": "Er komen dagelijks aanvragen binnen voor complete renovaties en verbouwingen.",
        "cv-monteur": "We hebben regelmatig klanten die een monteur nodig hebben voor cv-installatie of onderhoud.",
        "glaszetter": "Er zijn regelmatig opdrachten voor glaszetters, van enkele ruiten tot complete gevels.",
        "vloerenlegger": "We hebben frequent klanten die een vakman zoeken voor het leggen van diverse soorten vloeren.",
        "isolatiespecialist": "Met de huidige energieprijzen zoeken veel klanten naar isolatiespecialisten.",
        "huishoudelijke schoonmaker": "We hebben veel klanten die op zoek zijn naar betrouwbare schoonmaakhulp voor hun woning.",
        "website ontwikkeling": "Er is veel vraag naar professionele website-ontwikkelaars voor zakelijke websites."
    },
    
    // How the platform works - numbered steps
    howItWorks: [
        "Klanten melden een klus aan bij ons",
        "Wij sturen deze naar maximaal 3 vakmensen zoals jij",
        "Je krijgt de contactgegevens van de klant",
        "Je belt de klant en maakt een afspraak",
        "Je maakt je eigen offerte",
        "Bij een geslaagde klus betaal je 2% commissie (minimaal €50)"
    ],
    
    // For Customers
    customerBenefits: [
        "Gratis offerteaanvragen: Het indienen van aanvragen voor professionele diensten is kosteloos",
        "Meerdere offertes: Ontvang verschillende aanbiedingen van verschillende professionals",
        "Geen verplichting: Vrij om elke offerte te accepteren of af te wijzen zonder verplichting",
        "Transparante prijzen: Alle kosten worden duidelijk weergegeven in de offertes van professionals",
        "Kwaliteitsgarantie: Alle professionals worden gecontroleerd op betrouwbaarheid en kwaliteit"
    ],
    
    // Dashboard Functionality - for use in AI responses
    dashboardFunctionality: {
        customer: [
            "Overzichtspagina met samenvatting van recente aanvragen",
            "Profielbeheer voor persoonlijke gegevens",
            "Aanvragen sectie om de status van alle offerteaanvragen te bekijken",
            "Berichtensectie voor communicatie met professionals",
            "Geschiedenis van eerdere projecten en beoordelingen",
            "Instellingen voor account- en notificatiebeheer"
        ],
        professional: [
            "Overzichtspagina met statistieken over offerteaanvragen",
            "Profielbeheer voor bedrijfsinformatie en specialisaties",
            "Leadsmanagement voor nieuwe offerteaanvragen",
            "Actieve projecten monitoring",
            "Financiële sectie met facturen en commissies",
            "Beoordelingen en ratings overzicht",
            "Marketingtools en inzichten",
            "Instellingen voor account- en beschikbaarheidsbeheer",
            "Help & Support centrum"
        ]
    },
    
    // Common questions and answers - for use in AI responses
    commonQuestions: {
        customers: [
            {
                question: "Hoe update ik mijn contactgegevens?",
                answer: "Je kunt je contactgegevens bijwerken in de sectie 'Profiel' van je dashboard. Klik op je naam in de rechterbovenhoek, selecteer 'Profiel' en bewerk je gegevens."
            },
            {
                question: "Hoe controleer ik de status van mijn offerteaanvraag?",
                answer: "Ga naar de sectie 'Aanvragen' in je dashboard. Hier zie je al je ingediende aanvragen met hun huidige status (in behandeling, offertes ontvangen, in uitvoering, voltooid)."
            },
            {
                question: "Ik heb meerdere offertes ontvangen. Hoe vergelijk ik deze?",
                answer: "In de sectie 'Aanvragen' klik je op je specifieke aanvraag om alle ontvangen offertes te bekijken. Je kunt prijzen, voorgestelde tijdlijnen en profielen van professionals vergelijken voordat je een beslissing neemt."
            },
            {
                question: "Hoe communiceer ik met een professional?",
                answer: "Zodra je offertes hebt ontvangen, kun je rechtstreeks via het platform berichten sturen naar professionals. Klik op de offerte en selecteer 'Bericht sturen' om het gesprek te starten."
            },
            {
                question: "Kan ik een aanvraag annuleren na het indienen?",
                answer: "Ja, je kunt een aanvraag annuleren als er nog geen offertes zijn geaccepteerd. Ga naar de sectie 'Aanvragen', zoek de specifieke aanvraag en klik op 'Aanvraag annuleren'."
            }
        ],
        professionals: [
            {
                question: "Hoe krijg ik meer offerteaanvragen?",
                answer: "Om je kansen op het ontvangen van aanvragen te vergroten: Vul je profiel in met gedetailleerde informatie, voeg portfolio-voorbeelden toe, zorg voor snelle reactietijden, behoud goede beoordelingen van eerdere klanten, en breid indien mogelijk je servicegebieden uit."
            },
            {
                question: "Hoe wordt de commissie berekend?",
                answer: "De commissie is 2% van de totale opdrachtwaarde, met een minimum van €50 per opdracht. Dit wordt berekend op basis van het offertebedrag dat door de klant is geaccepteerd."
            },
            {
                question: "Wanneer en hoe betaal ik de commissie?",
                answer: "De commissie wordt automatisch berekend nadat een opdracht als voltooid is gemarkeerd. Je ontvangt een factuur en de betaling wordt verwerkt volgens je geselecteerde betaalmethode."
            },
            {
                question: "Hoe update ik mijn dienstenaanbod?",
                answer: "Ga naar de sectie 'Profiel' van je dashboard en selecteer vervolgens 'Diensten'. Hier kun je de diensten die je aanbiedt toevoegen, verwijderen of bijwerken."
            },
            {
                question: "Kan ik tijdelijk pauzeren met het ontvangen van nieuwe aanvragen?",
                answer: "Ja, in de sectie 'Instellingen' onder 'Beschikbaarheid' kun je je status instellen op 'Niet beschikbaar' voor een specifieke periode. Dit zal tijdelijk nieuwe aanvraagmeldingen pauzeren."
            }
        ]
    },
    
    // Privacy and data protection - for use in AI responses
    privacyInfo: {
        customerData: [
            "Contactgegevens worden alleen gebruikt om te verbinden met geschikte professionals",
            "Projectdetails worden alleen gedeeld met relevante dienstverleners",
            "Locatiegegevens worden gebruikt om te matchen met professionals in de buurt"
        ],
        professionalData: [
            "Bedrijfsgegevens worden getoond aan potentiële klanten",
            "Werkgeschiedenis en beoordelingen zijn zichtbaar om vertrouwen op te bouwen",
            "Contactgegevens worden beschermd tegen misbruik"
        ],
        generalPractices: [
            "Persoonlijke gegevens worden veilig opgeslagen en niet verkocht aan derden",
            "Marketingcommunicatie wordt alleen verzonden met expliciete toestemming",
            "Gebruikers kunnen hun persoonlijke gegevens inzien, corrigeren of verwijderen"
        ]
    },
    
    // Troubleshooting information - for use in AI responses
    troubleshooting: {
        loginProblems: [
            "Wis browsercookies en cache",
            "Zorg voor de juiste combinatie van e-mail en wachtwoord",
            "Gebruik de functie 'Wachtwoord vergeten' indien nodig",
            "Controleer e-mail op verificatielinks indien nieuw geregistreerd"
        ],
        quoteRequestErrors: [
            "Zorg ervoor dat alle verplichte velden zijn ingevuld",
            "Controleer of het postcodeformaat correct is (Nederlands formaat: 1234 AB)",
            "Controleer of het servicetype is geselecteerd",
            "Zorg ervoor dat de projectbeschrijving aan de minimale lengte voldoet"
        ],
        paymentIssues: [
            "Verifieer dat de creditcardgegevens actueel zijn",
            "Controleer of er voldoende saldo is",
            "Zorg ervoor dat het factuuradres overeenkomt met de kaartgegevens",
            "Neem contact op met support als er Stripe-betalingsgateway-fouten optreden"
        ],
        dashboardLoadingProblems: [
            "Controleer de internetverbinding",
            "Probeer een andere browser",
            "Wis browsercache en cookies",
            "Schakel browserextensies uit die mogelijk interfereren"
        ]
    }
};

module.exports = businessConfig;