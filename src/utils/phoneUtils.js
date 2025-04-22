/**
 * Phone number utility functions for Een Vakman Nodig WhatsApp Marketing System
 * Handles phone number formatting and validation
 */

/**
 * Normalize phone number to international format with + prefix
 * @param {string} phoneNumber - Raw phone number
 * @returns {string|null} - Normalized phone number or null if invalid
 */
function normalizePhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if missing (assuming Netherlands +31)
    if (cleaned.startsWith('0')) {
        cleaned = '31' + cleaned.substring(1);
    }
    
    // Add "+" prefix if missing
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    
    // Basic validation - must have at least 10 digits
    if (cleaned.replace(/\D/g, '').length < 10) {
        console.warn(`Invalid phone number: ${phoneNumber}`);
        return null;
    }
    
    return cleaned;
}

/**
 * Format phone number for WhatsApp API (remove + and add @c.us)
 * @param {string} phoneNumber - Phone number
 * @returns {string} - Formatted phone number for WhatsApp
 */
function formatPhoneNumberForWhatsApp(phoneNumber) {
    let formatted = phoneNumber;
    
    // Remove any '+' prefix
    formatted = formatted.replace(/^\+/, '');
    
    // Add WhatsApp suffix if not present
    if (!formatted.includes('@c.us')) {
        formatted = formatted + '@c.us';
    }
    
    return formatted;
}

/**
 * Check if a phone number is valid for WhatsApp
 * @param {string} phoneNumber - Phone number to check
 * @returns {boolean} - True if appears to be valid
 */
function isValidWhatsAppNumber(phoneNumber) {
    // Must have digits
    if (!/\d/.test(phoneNumber)) {
        return false;
    }
    
    // Normalize the number
    const normalized = normalizePhoneNumber(phoneNumber);
    if (!normalized) {
        return false;
    }
    
    // Must have between 10 and 15 digits (international standard)
    const digitCount = normalized.replace(/\D/g, '').length;
    if (digitCount < 10 || digitCount > 15) {
        return false; 
    }
    
    return true;
}

/**
 * Extract normalized phone number from WhatsApp formatted ID
 * @param {string} whatsappId - WhatsApp ID (e.g., 31612345678@c.us)
 * @returns {string} - Normalized phone number with + prefix
 */
function extractPhoneNumber(whatsappId) {
    // Remove @c.us suffix
    let number = whatsappId.replace(/@c\.us$/, '');
    
    // Add + prefix if missing
    if (!number.startsWith('+')) {
        number = '+' + number;
    }
    
    return number;
}

module.exports = {
    normalizePhoneNumber,
    formatPhoneNumberForWhatsApp,
    isValidWhatsAppNumber,
    extractPhoneNumber
};