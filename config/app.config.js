/**
 * Main application configuration for Een Vakman Nodig WhatsApp Marketing System
 * Centralized configuration for easy updates and maintenance
 */

const path = require('path');

// Load environment variables if not already done
require('dotenv').config();

// Define base application configuration
const appConfig = {
    // Directory paths
    directories: {
        csvDirectory: path.join(__dirname, '..', 'data'),
        logDirectory: path.join(__dirname, '..', 'logs'),
        dataStorage: path.join(__dirname, '..', 'data', 'storage')
    },
    
    // File paths
    files: {
        processedNumbersFile: 'processed_numbers.json',
        pendingNumbersFile: 'pending_numbers.json',
        conversationHistoryFile: 'conversation_history.json'
    },
    
    // Message sending configuration
    messaging: {
        maxMessagesPerHour: 60,
        minDelay: 60,  // seconds
        maxDelay: 180, // seconds
        distributionPattern: 'random', // 'random', 'even', 'burst'
        randomAssignment: true // Whether to randomly assign numbers to sessions
    },
    
    // WhatsApp sessions configuration
    sessions: [
        {
            id: "hamza_iphone",
            name: "Hamza iPhone",
            enabled: true,
            deviceInfo: "iPhone"
        }
        // Add more sessions as needed
    ],
    
    // Whether to process files on startup
    processFilesOnStartup: true,
    
    // Whether to send a message immediately on connection
    sendMessageOnStartup: true,
    
    // Debug mode
    debug: process.env.DEBUG_MODE === 'true' || false
};

module.exports = appConfig;