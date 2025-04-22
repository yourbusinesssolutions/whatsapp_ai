const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

/**
 * Reads and processes multiple CSV files containing contact information
 */
class CSVProcessor {
    constructor(csvDirectory) {
        this.csvDirectory = csvDirectory;
        this.processedNumbers = new Set();
        this.contactsByCategory = {};
    }

    /**
     * Load contact data from a single CSV file
     * @param {string} filePath - Path to the CSV file
     * @returns {Array} - Array of contact objects
     */
    loadCSV(filePath) {
        try {
            console.log(`Attempting to load CSV file: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                console.error(`CSV file does not exist: ${filePath}`);
                return [];
            }
            
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            console.log(`Successfully read file: ${path.basename(filePath)}, size: ${fileContent.length} bytes`);
            
            if (fileContent.trim().length === 0) {
                console.error(`CSV file is empty: ${filePath}`);
                return [];
            }
            
            // Log the first 100 characters to debug
            console.log(`File preview: ${fileContent.substring(0, 100)}...`);
            
            // Assume CSV format has at least phone number and category columns
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });
            
            console.log(`Loaded ${records.length} contacts from ${path.basename(filePath)}`);
            return records;
        } catch (error) {
            console.error(`Error loading CSV file ${filePath}:`, error.message);
            return [];
        }
    }

    /**
     * Process all CSV files in the directory
     * @returns {Object} - Object with contacts organized by category
     */
    processAllCSVs() {
        try {
            console.log(`Checking CSV directory: ${this.csvDirectory}`);
            
            if (!fs.existsSync(this.csvDirectory)) {
                console.error(`CSV directory does not exist: ${this.csvDirectory}`);
                fs.mkdirSync(this.csvDirectory, { recursive: true });
                console.log(`Created CSV directory: ${this.csvDirectory}`);
                return {};
            }
            
            const files = fs.readdirSync(this.csvDirectory)
                .filter(file => file.toLowerCase().endsWith('.csv'));
            
            console.log(`Found ${files.length} CSV files in ${this.csvDirectory}`);
            
            if (files.length === 0) {
                console.error(`No CSV files found in ${this.csvDirectory}`);
                return {};
            }
            
            // Process each CSV file
            files.forEach(file => {
                const filePath = path.join(this.csvDirectory, file);
                const contacts = this.loadCSV(filePath);
                
                // Organize contacts by category
                contacts.forEach(contact => {
                    // Skip if missing required fields or already processed
                    if (!contact.phone_number || !contact.category || 
                        this.processedNumbers.has(contact.phone_number)) {
                        return;
                    }
                    
                    // Normalize phone number format (remove spaces, ensure starts with country code)
                    const phoneNumber = this.normalizePhoneNumber(contact.phone_number);
                    if (!phoneNumber) return; // Skip invalid numbers
                    
                    // Add to processed set to avoid duplicates
                    this.processedNumbers.add(phoneNumber);
                    
                    // Organize by category
                    const category = contact.category.toLowerCase().trim();
                    if (!this.contactsByCategory[category]) {
                        this.contactsByCategory[category] = [];
                    }
                    
                    this.contactsByCategory[category].push({
                        phoneNumber,
                        category,
                        // Include any other relevant contact fields
                        ...contact
                    });
                });
            });
            
            console.log('CSV processing complete.');
            console.log('Total unique contacts:', this.processedNumbers.size);
            console.log('Categories found:', Object.keys(this.contactsByCategory));
            
            return this.contactsByCategory;
        } catch (error) {
            console.error('Error processing CSV files:', error.message);
            return {};
        }
    }

    /**
     * Normalize phone number format
     * @param {string} phoneNumber - Raw phone number from CSV
     * @returns {string|null} - Normalized phone number or null if invalid
     */
    normalizePhoneNumber(phoneNumber) {
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
            console.warn(`Skipping invalid phone number: ${phoneNumber}`);
            return null;
        }
        
        return cleaned;
    }

    /**
     * Get contacts for a specific category
     * @param {string} category - The professional category to filter by
     * @returns {Array} - Array of contacts for the requested category
     */
    getContactsByCategory(category) {
        return this.contactsByCategory[category.toLowerCase().trim()] || [];
    }

    /**
     * Get all unique contacts across all categories
     * @returns {Array} - Array of all contacts
     */
    getAllContacts() {
        return Object.values(this.contactsByCategory).flat();
    }
}

module.exports = CSVProcessor;