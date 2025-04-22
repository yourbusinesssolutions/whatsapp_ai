/**
 * Delay utilities for Een Vakman Nodig WhatsApp Marketing System
 * Provides human-like delay calculations for more natural conversations
 */

/**
 * Calculate a random delay between min and max
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {number} - Random delay in milliseconds
 */
function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Calculate typing delay based on message length
 * @param {string} message - Message content
 * @param {Object} typingSpeed - Typing speed configuration
 * @returns {number} - Typing delay in milliseconds
 */
function calculateTypingDelay(message, typingSpeed = { base: 150, variance: 50 }) {
    if (!message) return 1000; // Default delay for empty messages
    
    // Calculate typing speed with some human variance
    const cpm = typingSpeed.base + (Math.random() * typingSpeed.variance * 2) - typingSpeed.variance;
    
    // Convert characters per minute to milliseconds per character
    const msPerChar = (60 * 1000) / cpm;
    
    // Calculate time to type this message
    let typingTime = message.length * msPerChar;
    
    // Add some thinking time for longer messages
    if (message.length > 100) {
        typingTime += 3000; // Extra thinking time for complex messages
    } else if (message.length > 50) {
        typingTime += 1500; // Less thinking time for medium messages
    }
    
    // Add occasional random pause for very natural feeling (like being distracted)
    if (message.length > 30 && Math.random() < 0.2) {
        typingTime += Math.random() * 5000; // 0-5 second random pause
    }
    
    // Ensure result is within reasonable bounds (1-15 seconds)
    return Math.min(Math.max(typingTime, 1000), 15000);
}

/**
 * Create a delay distribution based on pattern
 * @param {string} pattern - Distribution pattern (even, random, burst)
 * @param {number} baseDelay - Base delay for calculations
 * @returns {number} - Calculated delay
 */
function distributionDelay(pattern, baseDelay) {
    switch (pattern) {
        case 'even':
            // Consistent spacing
            return baseDelay;
            
        case 'burst':
            // Send in bursts with longer pauses
            return Math.random() < 0.7 
                ? baseDelay * 0.5 
                : baseDelay * 2.5;
            
        case 'random':
        default:
            // Random variation around the base delay
            return baseDelay * (0.5 + Math.random());
    }
}

/**
 * Create a human-like reading delay
 * @param {string} message - Message content
 * @returns {number} - Reading delay in milliseconds
 */
function readingDelay(message) {
    if (!message) return 500;
    
    // Average reading speed ~250 words per minute
    // Approximately 5 chars per word
    const approxWords = message.length / 5;
    const readingTimeMs = (approxWords / 250) * 60 * 1000;
    
    // Add some random variance (±20%)
    const variance = readingTimeMs * 0.4 * (Math.random() - 0.5);
    
    // Ensure minimum delay of 500ms and maximum of 10 seconds
    return Math.min(Math.max(readingTimeMs + variance, 500), 10000);
}

module.exports = {
    randomDelay,
    calculateTypingDelay,
    distributionDelay,
    readingDelay
};