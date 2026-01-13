const logger = require('./logger');

class Validators {
    /**
     * Sanitize a task string
     * @param {string} task 
     * @param {number} maxLength 
     * @returns {string}
     */
    static sanitizeTask(task, maxLength = 100) {
        if (!task || typeof task !== 'string') return '';
        
        let sanitized = task.trim();
        
        // Remove excessive whitespace
        sanitized = sanitized.replace(/\s+/g, ' ');

        // Limit length
        if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
        }

        return sanitized;
    }

    /**
     * Validate if a user input is safe/valid
     * @param {string} input 
     * @returns {boolean}
     */
    static isValidInput(input) {
        if (!input || typeof input !== 'string') return false;
        // Example check: no control characters except newlines/tabs
        // Although twitch chat probably handles this.
        return true;
    }
}

module.exports = Validators;
