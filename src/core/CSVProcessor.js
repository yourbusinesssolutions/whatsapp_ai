/**
 * CSV Processor for Een Vakman Nodig WhatsApp Marketing System
 * Reads and processes multiple CSV files containing contact information
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const phoneUtils = require('../utils/phoneUtils');
const Logger = require('../utils/logger');

class CSVProcessor {
    /**
     * Create a new CSV processor
     * @param {string} csvDirectory - Directory containing CSV files
     * @param {Object} options - Processing options
     */
    constructor(csvDirectory, options = {}) {
        this.csvDirectory = csvDirectory;
        this.processedNumbers = new Set();
        this.contactsByCategory = {};
        this.options = {
            logResults: options.logResults !== false,
            validatePhoneNumbers: options.validatePhoneNumbers !== false,
            requiredFields: options.requiredFields || ['phone_number', 'category'],
            ...options
        };
        
        // Set up logger
        this.logger = new Logger({
            component: 'csv-processor',
            logDirectory: options.logDirectory,
            logLevel: options.debug ? 'debug' : 'info'
        });
    }

    /**
     * Load contact data from a single CSV file
     * @param {string} filePath - Path to the CSV file
     * @returns {Array} - Array of contact objects
     */
    loadCSV(filePath) {
        try {
            this.logger.info(`Loading CSV file: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                this.logger.error(`CSV file does not exist: ${filePath}`);
                return [];
            }
            
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            this.logger.debug(`Read file: ${path.basename(filePath)}, size: ${fileContent.length} bytes`);
            
            if (fileContent.trim().length === 0) {
                this.logger.error(`CSV file is empty: ${filePath}`);
                return [];
            }
            
            // Log the first 100 characters to debug
            this.logger.debug(`File preview: ${fileContent.substring(0, 100)}...`);
            
            // Parse the CSV content
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                skip_records_with_error: true
            });
            
            this.logger.info(`Loaded ${records.length} contacts from ${path.basename(filePath)}`);
            
            // Validate and clean the records
            const validRecords = this.validateRecords(records, path.basename(filePath));
            
            return validRecords;
        } catch (error) {
            this.logger.error(`Error loading CSV file ${filePath}:`, error);
            return [];
        }
    }

    /**
     * Validate and clean CSV records
     * @param {Array} records - Raw CSV records
     * @param {string} fileName - Source file name (for logging)
     * @returns {Array} - Validated records
     */
    validateRecords(records, fileName) {
        const validRecords = [];
        let invalidCount = 0;
        
        records.forEach((record, index) => {
            // Check for required fields
            const missingFields = this.options.requiredFields.filter(field => 
                !record[field] || record[field].trim() === ''
            );
            
            if (missingFields.length > 0) {
                this.logger.debug(`Record #${index + 1} in ${fileName} missing required fields: ${missingFields.join(', ')}`);
                invalidCount++;
                return;
            }
            
            // Normalize phone number
            if (this.options.validatePhoneNumbers) {
                const normalizedPhone = phoneUtils.normalizePhoneNumber(record.phone_number);
                
                if (!normalizedPhone) {
                    this.logger.debug(`Record #${index + 1} in ${fileName} has invalid phone number: ${record.phone_number}`);
                    invalidCount++;
                    return;
                }
                
                // Update with normalized number
                record.phone_number = normalizedPhone;
            }
            
            // Add clean record to valid list
            validRecords.push(record);
        });
        
        if (invalidCount > 0) {
            this.logger.warn(`${invalidCount} invalid records skipped in ${fileName}`);
        }
        
        return validRecords;
    }

    /**
     * Process all CSV files in the directory
     * @returns {Object} - Object with contacts organized by category
     */
    processAllCSVs() {
        try {
            this.logger.info(`Checking CSV directory: ${this.csvDirectory}`);
            
            if (!fs.existsSync(this.csvDirectory)) {
                this.logger.error(`CSV directory does not exist: ${this.csvDirectory}`);
                fs.mkdirSync(this.csvDirectory, { recursive: true });
                this.logger.info(`Created CSV directory: ${this.csvDirectory}`);
                return {};
            }
            
            const files = fs.readdirSync(this.csvDirectory)
                .filter(file => file.toLowerCase().endsWith('.csv'));
            
            this.logger.info(`Found ${files.length} CSV files in ${this.csvDirectory}`);
            
            if (files.length === 0) {
                this.logger.warn(`No CSV files found in ${this.csvDirectory}`);
                return {};
            }
            
            // Reset tracking
            this.processedNumbers.clear();
            this.contactsByCategory = {};
            
            // Process each CSV file
            files.forEach(file => {
                const filePath = path.join(this.csvDirectory, file);
                const contacts = this.loadCSV(filePath);
                
                // Organize contacts by category
                this.organizeContactsByCategory(contacts);
            });
            
            if (this.options.logResults) {
                this.logProcessingResults();
            }
            
            return this.contactsByCategory;
        } catch (error) {
            this.logger.error('Error processing CSV files:', error);
            return {};
        }
    }

    /**
     * Organize contacts by category
     * @param {Array} contacts - Contacts to organize
     */
    organizeContactsByCategory(contacts) {
        contacts.forEach(contact => {
            // Skip if missing required fields or already processed
            if (!contact.phone_number || !contact.category || 
                this.processedNumbers.has(contact.phone_number)) {
                return;
            }
            
            // Add to processed set to avoid duplicates
            this.processedNumbers.add(contact.phone_number);
            
            // Organize by category
            const category = contact.category.toLowerCase().trim();
            if (!this.contactsByCategory[category]) {
                this.contactsByCategory[category] = [];
            }
            
            this.contactsByCategory[category].push({
                phoneNumber: contact.phone_number,
                category,
                // Include any other relevant contact fields
                ...contact
            });
        });
    }

    /**
     * Log processing results
     */
    logProcessingResults() {
        this.logger.info('CSV processing complete.');
        this.logger.info(`Total unique contacts: ${this.processedNumbers.size}`);
        this.logger.info(`Categories found: ${Object.keys(this.contactsByCategory).join(', ')}`);
        
        // Log category counts
        Object.entries(this.contactsByCategory).forEach(([category, contacts]) => {
            this.logger.info(`• ${category}: ${contacts.length} contacts`);
        });
    }

    /**
     * Get contacts for a specific category
     * @param {string} category - The professional category to filter by
     * @returns {Array} - Array of contacts for the requested category
     */
    getContactsByCategory(category) {
        const normalizedCategory = category.toLowerCase().trim();
        return this.contactsByCategory[normalizedCategory] || [];
    }

    /**
     * Get all unique contacts across all categories
     * @returns {Array} - Array of all contacts
     */
    getAllContacts() {
        return Object.values(this.contactsByCategory).flat();
    }
    
    /**
     * Get total count of unique contacts
     * @returns {number} - Count of unique contacts
     */
    getTotalContactCount() {
        return this.processedNumbers.size;
    }
    
    /**
     * Get number of categories found
     * @returns {number} - Number of categories
     */
    getCategoryCount() {
        return Object.keys(this.contactsByCategory).length;
    }
}

module.exports = CSVProcessor;