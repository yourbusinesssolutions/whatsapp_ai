/**
 * File Storage Manager for Een Vakman Nodig WhatsApp Marketing System
 * Handles file read/write operations for JSON data
 */

const fs = require('fs');
const path = require('path');

class FileStorage {
    /**
     * Create a file storage manager
     * @param {Object} options - Storage options
     */
    constructor(options = {}) {
        this.storageDirectory = options.storageDirectory || path.join(__dirname, '../../../data/storage');
        
        // Ensure storage directory exists
        this.ensureDirectoryExists(this.storageDirectory);
    }

    /**
     * Ensure directory exists
     * @param {string} directory - Directory path
     */
    ensureDirectoryExists(directory) {
        if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
            console.log(`Created directory: ${directory}`);
        }
    }

    /**
     * Read data from a JSON file
     * @param {string} filename - Filename (with or without path)
     * @returns {Object|Array|null} - Parsed data or null if error
     */
    readJsonFile(filename) {
        try {
            // Determine full path
            const filePath = this.getFilePath(filename);
            
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                return null;
            }
            
            // Read and parse file
            const data = fs.readFileSync(filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading JSON file ${filename}:`, error.message);
            return null;
        }
    }

    /**
     * Write data to a JSON file
     * @param {string} filename - Filename (with or without path)
     * @param {Object|Array} data - Data to write
     * @returns {boolean} - True if successful, false on error
     */
    writeJsonFile(filename, data) {
        try {
            // Determine full path
            const filePath = this.getFilePath(filename);
            
            // Create directory if it doesn't exist
            const directory = path.dirname(filePath);
            this.ensureDirectoryExists(directory);
            
            // Write data to file with pretty formatting
            fs.writeFileSync(
                filePath,
                JSON.stringify(data, null, 2),
                'utf-8'
            );
            
            return true;
        } catch (error) {
            console.error(`Error writing to file ${filename}:`, error.message);
            return false;
        }
    }

    /**
     * Append data to a text file
     * @param {string} filename - Filename (with or without path)
     * @param {string} content - Content to append
     * @returns {boolean} - True if successful, false on error
     */
    appendToFile(filename, content) {
        try {
            // Determine full path
            const filePath = this.getFilePath(filename);
            
            // Create directory if it doesn't exist
            const directory = path.dirname(filePath);
            this.ensureDirectoryExists(directory);
            
            // Append content to file
            fs.appendFileSync(filePath, content, 'utf-8');
            
            return true;
        } catch (error) {
            console.error(`Error appending to file ${filename}:`, error.message);
            return false;
        }
    }

    /**
     * Get full path for a file
     * @param {string} filename - Filename or path
     * @returns {string} - Full file path
     */
    getFilePath(filename) {
        // If filename already contains path, use it as is
        if (path.isAbsolute(filename) || filename.includes('/') || filename.includes('\\')) {
            return filename;
        }
        
        // Otherwise, join with storage directory
        return path.join(this.storageDirectory, filename);
    }

    /**
     * Delete a file
     * @param {string} filename - Filename (with or without path)
     * @returns {boolean} - True if successful, false on error
     */
    deleteFile(filename) {
        try {
            const filePath = this.getFilePath(filename);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error deleting file ${filename}:`, error.message);
            return false;
        }
    }

    /**
     * List files in a directory
     * @param {string} directory - Directory path (relative to storage dir if not absolute)
     * @param {string} extension - Optional file extension filter
     * @returns {Array} - Array of filenames
     */
    listFiles(directory = '.', extension = null) {
        try {
            // Determine full directory path
            const dirPath = path.isAbsolute(directory) 
                ? directory 
                : path.join(this.storageDirectory, directory);
            
            // Check if directory exists
            if (!fs.existsSync(dirPath)) {
                return [];
            }
            
            // Get files
            let files = fs.readdirSync(dirPath);
            
            // Filter by extension if provided
            if (extension) {
                files = files.filter(file => file.endsWith(extension));
            }
            
            return files;
        } catch (error) {
            console.error(`Error listing files in ${directory}:`, error.message);
            return [];
        }
    }
}

module.exports = FileStorage;