/**
 * Main entry point for Een Vakman Nodig WhatsApp Marketing System
 * Modular design with proper separation of concerns
 */

// Core dependencies
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

// Configuration
const appConfig = require('./config/app.config');
const aiConfig = require('./config/ai.config');
const messageTemplates = require('./config/messages.config');

// Core components
const ProcessedTracker = require('./src/core/ProcessedTracker');
const CSVProcessor = require('./src/core/CSVProcessor');
const WhatsAppSender = require('./src/core/WhatsAppSender');
const MessageScheduler = require('./src/core/MessageScheduler');

// AI components
let AIEnabledSender; 
try {
    AIEnabledSender = require('./src/ai/AIEnabledSender');
} catch (error) {
    console.log('AI responder not found, running without AI features');
    console.error('Detailed Error:', error.message);
    console.error('Error Stack:', error.stack);
}

// Utilities
const Logger = require('./src/utils/logger');

// Create main application logger
const logger = new Logger({
    component: 'main',
    logDirectory: appConfig.directories.logDirectory,
    logLevel: appConfig.debug ? 'debug' : 'info'
});

// Ensure required directories exist
const requiredDirs = [
    appConfig.directories.csvDirectory,
    appConfig.directories.logDirectory,
    appConfig.directories.dataStorage
];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
    }
});

/**
 * Main application function
 */
async function main() {
    logger.info('\n======================================================');
    logger.info('    WhatsApp Marketing Campaign System');
    if (aiConfig.enabled && AIEnabledSender) {
        logger.info('           with AI Auto-Responder');
    }
    logger.info('======================================================\n');
    
    logger.info('System Configuration:');
    logger.info(`• CSV Directory: ${appConfig.directories.csvDirectory}`);
    logger.info(`• Log Directory: ${appConfig.directories.logDirectory}`);
    logger.info(`• Max Messages Per Hour: ${appConfig.messaging.maxMessagesPerHour}`);
    logger.info(`• Message Timing: ${appConfig.messaging.minDelay}-${appConfig.messaging.maxDelay} seconds between messages`);
    logger.info(`• Distribution Pattern: ${appConfig.messaging.distributionPattern}`);
    logger.info(`• AI Responder: ${(aiConfig.enabled && AIEnabledSender) ? 'Enabled' : 'Disabled'}`);
    
    // Log active sessions
    const activeSessions = appConfig.sessions.filter(s => s.enabled);
    logger.info(`• Active Sessions (${activeSessions.length}):`);
    activeSessions.forEach(session => {
        logger.info(`  - ${session.name} (${session.deviceInfo})`);
    });
    logger.info('------------------------------------------------------\n');

    // Initialize processed number tracker (shared across all sessions)
    const processedTracker = new ProcessedTracker({
        processedFilePath: path.join(appConfig.directories.dataStorage, appConfig.files.processedNumbersFile),
        pendingFilePath: path.join(appConfig.directories.dataStorage, appConfig.files.pendingNumbersFile),
        logDirectory: appConfig.directories.logDirectory
    });
    
    // Initialize WhatsApp sessions
    const whatsappSenders = [];
    
    for (const sessionConfig of appConfig.sessions) {
        if (sessionConfig.enabled) {
            let sender;
            
            // Use AI-enabled sender if AI is enabled and available
            if (aiConfig.enabled && AIEnabledSender) {
                sender = new AIEnabledSender(
                    sessionConfig, 
                    processedTracker, 
                    {
                        minDelay: appConfig.messaging.minDelay * 1000,
                        maxDelay: appConfig.messaging.maxDelay * 1000,
                        logDirectory: appConfig.directories.logDirectory,
                        sendOnStartup: appConfig.sendMessageOnStartup,
                        apiKey: aiConfig.apiKey,
                        apiUrl: aiConfig.apiUrl,
                        model: aiConfig.model,
                        debug: appConfig.debug
                    }
                );
                logger.info(`Initialized ${sessionConfig.name} with AI responder`);
            } else {
                sender = new WhatsAppSender(
                    sessionConfig, 
                    processedTracker, 
                    {
                        minDelay: appConfig.messaging.minDelay * 1000,
                        maxDelay: appConfig.messaging.maxDelay * 1000,
                        logDirectory: appConfig.directories.logDirectory,
                        sendOnStartup: appConfig.sendMessageOnStartup
                    }
                );
                logger.info(`Initialized ${sessionConfig.name} without AI responder`);
            }
            
            whatsappSenders.push(sender);
        }
    }
    
    // Create scheduler
    const scheduler = new MessageScheduler(
        whatsappSenders, 
        messageTemplates.outreach, 
        {
            maxMessagesPerHour: appConfig.messaging.maxMessagesPerHour,
            distributionPattern: appConfig.messaging.distributionPattern,
            randomAssignment: appConfig.messaging.randomAssignment
        }
    );
    
    // Initialize all WhatsApp sessions
    logger.info('Initializing WhatsApp sessions...');
    whatsappSenders.forEach(sender => sender.initialize());
    
    // Process CSV files if enabled
    if (appConfig.processFilesOnStartup) {
        logger.info('Processing contact data from CSV files...');
        const csvProcessor = new CSVProcessor(appConfig.directories.csvDirectory);
        const contactsByCategory = csvProcessor.processAllCSVs();
        
        // Wait for all sessions to be ready
        logger.info('Waiting for WhatsApp sessions to authenticate...');
        await waitForSessions(whatsappSenders);
        
        // Schedule messages for all contacts
        logger.info('All sessions ready. Starting to schedule messages...');
        const allContacts = csvProcessor.getAllContacts();
        
        if (allContacts.length === 0) {
            logger.info('No contacts found in CSV files. Please add CSV files with contact data to the data directory.');
        } else {
            scheduler.scheduleMessages(allContacts);
        }
    } else {
        logger.info('CSV processing disabled on startup. Use API to trigger message sending.');
    }
    
    // Set up interval to display stats
    const statsInterval = setInterval(() => {
        displayStats(whatsappSenders, processedTracker, scheduler);
    }, 30000); // Update every 30 seconds
    
    logger.info('\nCampaign initialized. Messages will be sent according to schedule.');
    if (aiConfig.enabled && AIEnabledSender) {
        logger.info('AI responder is active and will handle incoming messages.');
        logger.info('If users send "stop" or similar messages, they will automatically be blocked.');
    }
    logger.info('Press Ctrl+C to stop the campaign.\n');
}

/**
 * Wait for at least one WhatsApp session to be ready
 * @param {Array} senders - Array of WhatsAppSender instances
 * @returns {Promise} - Resolves when at least one session is ready
 */
function waitForSessions(senders) {
    return new Promise(resolve => {
        const checkInterval = setInterval(() => {
            const readySenders = senders.filter(sender => sender.isReady);
            
            if (readySenders.length > 0) {
                // If at least one sender is ready, we can proceed
                clearInterval(checkInterval);
                
                if (readySenders.length < senders.length) {
                    logger.info(`${readySenders.length}/${senders.length} sessions ready. Proceeding with available sessions.`);
                } else {
                    logger.info(`All ${senders.length} sessions ready.`);
                }
                
                resolve();
            } else {
                logger.info(`Waiting for sessions to be ready: 0/${senders.length} ready`);
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
    logger.info('\n--- Campaign Status ---');
    
    // Display time running
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    logger.info(`System Uptime: ${hours}h ${minutes}m ${seconds}s`);
    
    // Display processed/pending stats
    logger.info(`Numbers Processed: ${processedTracker.getProcessedCount()}`);
    logger.info(`Numbers Pending: ${processedTracker.getPendingCount()}`);
    
    // Display session stats
    logger.info('\nSession Status:');
    senders.forEach(sender => {
        const stats = sender.getStats();
        logger.info(`• ${stats.sessionName} (${stats.deviceInfo}): ${stats.isReady ? 'Connected' : 'Disconnected'}`);
        logger.info(`  - Messages Sent: ${stats.sentCount}`);
        logger.info(`  - Messages Failed: ${stats.failedCount}`);
        logger.info(`  - Queue Size: ${stats.queueSize}`);
        logger.info(`  - Currently Sending: ${stats.isCurrentlySending ? 'Yes' : 'No'}`);
        if (stats.aiEnabled) {
            logger.info(`  - AI Responder: Active (${stats.aiProvider} - ${stats.aiModel})`);
        }
    });
    
    // Display scheduler stats
    const schedulerStats = scheduler.getStats();
    logger.info('\nCategory Distribution:');
    Object.entries(schedulerStats.queuedByCategory).forEach(([category, count]) => {
        logger.info(`• ${category}: ${count} messages`);
    });
    
    logger.info('------------------------');
}

// Start the application
main().catch(error => {
    logger.error('Error in main application:', error);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('\nShutting down the application...');
    logger.info('Please wait while saving processed numbers...');
    
    // Allow time for cleanup before exit
    setTimeout(() => {
        logger.info('Application shutdown complete.');
        process.exit(0);
    }, 3000);
});