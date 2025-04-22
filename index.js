const path = require('path');
const fs = require('fs');
const CSVProcessor = require('./csvProcessor');
const ProcessedTracker = require('./processedTracker');
const WhatsAppSender = require('./whatsappSender');
const MessageScheduler = require('./messageScheduler');
const messageTemplates = require('./messages');
require('dotenv').config(); // Load environment variables

// Try to import AI responder if it exists
let AIEnabledWhatsAppSender;
try {
    AIEnabledWhatsAppSender = require('./aiResponder').AIEnabledWhatsAppSender;
} catch (error) {
    console.log('AI responder not found, running without AI features');
}

// Load configuration from file
let CONFIG;
try {
    const configPath = path.join(__dirname, 'config.json');
    CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log('Loaded configuration from config.json');
    
    // Add AI settings to config if not present
    if (!CONFIG.aiSettings) {
        CONFIG.aiSettings = {
            enabled: false,
            apiKey: process.env.DEEPSEEK_API_KEY || "YOUR_DEEPSEEK_API_KEY",
            responseLanguage: "Dutch",
            maxResponseLength: 150,
            humanizationLevel: "high",
            responseDelay: {
                min: 2000,
                max: 5000
            }
        };
    }
} catch (error) {
    console.error('Error loading configuration:', error.message);
    console.log('Using default configuration');
    
    // Default configuration if file not found
    CONFIG = {
        csvDirectory: path.join(__dirname, 'data'),
        logDirectory: path.join(__dirname, 'logs'),
        processedNumbersFile: 'processed_numbers.json',
        pendingNumbersFile: 'pending_numbers.json',
        maxMessagesPerHour: 60,
        minDelay: 60,
        maxDelay: 180,
        distributionPattern: 'random',
        sessions: [
            {
                id: "samsung_soulaiman",
                name: "Samsung Soulaiman",
                enabled: true,
                deviceInfo: "Samsung Galaxy"
            },
            {
                id: "hamza_iphone",
                name: "Hamza iPhone", 
                enabled: true,
                deviceInfo: "iPhone"
            }
        ],
        aiSettings: {
            enabled: false,
            apiKey: process.env.DEEPSEEK_API_KEY || "YOUR_DEEPSEEK_API_KEY",
            responseLanguage: "Dutch",
            maxResponseLength: 150,
            humanizationLevel: "high",
            responseDelay: {
                min: 2000,
                max: 5000
            }
        }
    };
}

// Check if DeepSeek API key is set when AI is enabled
if (CONFIG.aiSettings.enabled && AIEnabledWhatsAppSender) {
    if (!CONFIG.aiSettings.apiKey || CONFIG.aiSettings.apiKey === "YOUR_DEEPSEEK_API_KEY") {
        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('DeepSeek API key is not set. Please set DEEPSEEK_API_KEY environment variable or update config.json');
            console.error('Disabling AI features and continuing without them.');
            CONFIG.aiSettings.enabled = false;
        } else {
            CONFIG.aiSettings.apiKey = process.env.DEEPSEEK_API_KEY;
        }
    }
}

// Ensure directories exist
const dirs = [
    path.join(__dirname, CONFIG.csvDirectory),
    path.join(__dirname, CONFIG.logDirectory)
];

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
});

// Main application function
async function main() {
    console.log('\n======================================================');
    console.log('    WhatsApp Marketing Campaign System');
    if (CONFIG.aiSettings.enabled && AIEnabledWhatsAppSender) {
        console.log('           with AI Auto-Responder');
    }
    console.log('======================================================\n');
    
    console.log('System Configuration:');
    console.log(`• CSV Directory: ${CONFIG.csvDirectory}`);
    console.log(`• Log Directory: ${CONFIG.logDirectory}`);
    console.log(`• Max Messages Per Hour: ${CONFIG.maxMessagesPerHour}`);
    console.log(`• Message Timing: ${CONFIG.minDelay}-${CONFIG.maxDelay} seconds between messages`);
    console.log(`• Distribution Pattern: ${CONFIG.distributionPattern}`);
    console.log(`• AI Responder: ${(CONFIG.aiSettings.enabled && AIEnabledWhatsAppSender) ? 'Enabled' : 'Disabled'}`);
    
    // Log active sessions
    const activeSessions = CONFIG.sessions.filter(s => s.enabled);
    console.log(`• Active Sessions (${activeSessions.length}):`);
    activeSessions.forEach(session => {
        console.log(`  - ${session.name} (${session.deviceInfo})`);
    });
    console.log('------------------------------------------------------\n');

    // Initialize processed number tracker (shared across all sessions)
    const processedTracker = new ProcessedTracker({
        processedFilePath: path.join(__dirname, CONFIG.processedNumbersFile),
        pendingFilePath: path.join(__dirname, CONFIG.pendingNumbersFile),
        logDirectory: path.join(__dirname, CONFIG.logDirectory)
    });
    
    // Initialize WhatsApp sessions
    const whatsappSenders = [];
    
    for (const sessionConfig of CONFIG.sessions) {
        if (sessionConfig.enabled) {
            let sender;
            
            // Use AI-enabled sender if AI is enabled and available
            if (CONFIG.aiSettings.enabled && AIEnabledWhatsAppSender) {
                sender = new AIEnabledWhatsAppSender(sessionConfig, processedTracker, {
                    minDelay: CONFIG.minDelay * 1000,
                    maxDelay: CONFIG.maxDelay * 1000,
                    logDirectory: path.join(__dirname, CONFIG.logDirectory),
                    sendOnStartup: true,
                    deepseekApiKey: CONFIG.aiSettings.apiKey
                });
                console.log(`Initialized ${sessionConfig.name} with AI responder`);
            } else {
                sender = new WhatsAppSender(sessionConfig, processedTracker, {
                    minDelay: CONFIG.minDelay * 1000,
                    maxDelay: CONFIG.maxDelay * 1000,
                    logDirectory: path.join(__dirname, CONFIG.logDirectory),
                    sendOnStartup: true
                });
                console.log(`Initialized ${sessionConfig.name} without AI responder`);
            }
            
            whatsappSenders.push(sender);
        }
    }
    
    // Create scheduler
    const scheduler = new MessageScheduler(whatsappSenders, messageTemplates, {
        maxMessagesPerHour: CONFIG.maxMessagesPerHour,
        distributionPattern: CONFIG.distributionPattern,
        randomAssignment: true
    });
    
    // Initialize all WhatsApp sessions
    console.log('Initializing WhatsApp sessions...');
    whatsappSenders.forEach(sender => sender.initialize());
    
    // Process CSV files
    console.log('Processing contact data from CSV files...');
    const csvProcessor = new CSVProcessor(path.join(__dirname, CONFIG.csvDirectory));
    const contactsByCategory = csvProcessor.processAllCSVs();
    
    // Wait for all sessions to be ready
    console.log('Waiting for WhatsApp sessions to authenticate...');
    await waitForSessions(whatsappSenders);
    
    // Schedule messages for all contacts
    console.log('All sessions ready. Starting to schedule messages...');
    const allContacts = csvProcessor.getAllContacts();
    
    if (allContacts.length === 0) {
        console.log('No contacts found in CSV files. Please add CSV files with contact data to the data directory.');
    } else {
        scheduler.scheduleMessages(allContacts);
    }
    
    // Set up interval to display stats
    const statsInterval = setInterval(() => {
        displayStats(whatsappSenders, processedTracker, scheduler);
    }, 30000); // Update every 30 seconds
    
    console.log('\nCampaign initialized. Messages will be sent according to schedule.');
    if (CONFIG.aiSettings.enabled && AIEnabledWhatsAppSender) {
        console.log('AI responder is active and will handle incoming messages.');
    }
    console.log('Press Ctrl+C to stop the campaign.\n');
}

/**
 * Wait for all WhatsApp sessions to be ready
 * @param {Array} senders - Array of WhatsAppSender instances
 * @returns {Promise} - Resolves when all sessions are ready
 */
function waitForSessions(senders) {
    return new Promise(resolve => {
        const checkInterval = setInterval(() => {
            const readySenders = senders.filter(sender => sender.isReady);
            
            if (readySenders.length > 0) {
                // If at least one sender is ready, we can proceed
                clearInterval(checkInterval);
                
                if (readySenders.length < senders.length) {
                    console.log(`${readySenders.length}/${senders.length} sessions ready. Proceeding with available sessions.`);
                } else {
                    console.log(`All ${senders.length} sessions ready.`);
                }
                
                resolve();
            } else {
                console.log(`Waiting for sessions to be ready: 0/${senders.length} ready`);
            }
        }, 5000); // Check every 5 seconds
    });
}

/**
 * Display system statistics
 * @param {Array} senders - WhatsApp sender instances
 * @param {ProcessedTracker} processedTracker - Processed numbers tracker
 * @param {MessageScheduler} scheduler - Message scheduler
 */
function displayStats(senders, processedTracker, scheduler) {
    console.log('\n--- Campaign Status ---');
    
    // Display time running
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    console.log(`System Uptime: ${hours}h ${minutes}m ${seconds}s`);
    
    // Display processed/pending stats
    console.log(`Numbers Processed: ${processedTracker.getProcessedCount()}`);
    console.log(`Numbers Pending: ${processedTracker.getPendingCount()}`);
    
    // Display session stats
    console.log('\nSession Status:');
    senders.forEach(sender => {
        const stats = sender.getStats();
        console.log(`• ${stats.sessionName} (${stats.deviceInfo}): ${stats.isReady ? 'Connected' : 'Disconnected'}`);
        console.log(`  - Messages Sent: ${stats.sentCount}`);
        console.log(`  - Messages Failed: ${stats.failedCount}`);
        console.log(`  - Queue Size: ${stats.queueSize}`);
        console.log(`  - Currently Sending: ${stats.isCurrentlySending ? 'Yes' : 'No'}`);
        if (CONFIG.aiSettings.enabled && AIEnabledWhatsAppSender && sender.aiResponder) {
            console.log(`  - AI Responder: Active`);
        }
    });
    
    // Display scheduler stats
    const schedulerStats = scheduler.getStats();
    console.log('\nCategory Distribution:');
    Object.entries(schedulerStats.queuedByCategory).forEach(([category, count]) => {
        console.log(`• ${category}: ${count} messages`);
    });
    
    console.log('------------------------');
}

// Start the application
main().catch(error => {
    console.error('Error in main application:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down the application...');
    console.log('Please wait while saving processed numbers...');
    
    // Allow time for cleanup before exit
    setTimeout(() => {
        console.log('Application shutdown complete.');
        process.exit(0);
    }, 3000);
});