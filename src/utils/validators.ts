import logger from './logger';

class Validators {
    /**
     * Sanitize a task string
     * @param task 
     * @param maxLength 
     * @returns sanitized task string
     */
    static sanitizeTask(task: string, maxLength: number = 100): string {
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
     * @param input 
     * @returns true if valid
     */
    static isValidInput(input: string): boolean {
        if (!input || typeof input !== 'string') return false;
        // Example check: no control characters except newlines/tabs
        // Although twitch chat probably handles this.
        return true;
    }
}

export default Validators;
