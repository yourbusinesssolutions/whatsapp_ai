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
    },
    
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
    
    // Professional Categories
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
            "cv-monteur"
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
        ]
    },
    
    // Profession-specific information to use in messages
    professionalMessages: {
        "schilder": "Wij hebben dagelijks nieuwe schilderklussen beschikbaar. Binnen- en buitenschilderwerk.",
        "timmerman": "Wij krijgen veel klussen voor timmermannen. Van vloeren tot dakconstructies.",
        "dakdekker": "Er komen regelmatig opdrachten binnen voor dakdekkers. Zowel reparaties als complete daken.",
        "stucadoor": "We hebben regelmatig klanten die een stukadoor zoeken voor wanden en plafonds.",
        "loodgieter": "Er zijn vaak loodgietersklussen zoals badkamers, lekkages en cv-installaties.",
        "elektricien": "We hebben vaak klanten die een elektricien zoeken voor installaties en storingen."
    },
    
    // How the platform works - numbered steps
    howItWorks: [
        "Klanten melden een klus aan bij ons",
        "Wij sturen deze naar maximaal 3 vakmensen zoals jij",
        "Je krijgt de contactgegevens van de klant",
        "Je belt de klant en maakt een afspraak",
        "Je maakt je eigen offerte",
        "Bij een geslaagde klus betaal je 2% commissie (minimaal €50)"
    ]
};

module.exports = businessConfig;