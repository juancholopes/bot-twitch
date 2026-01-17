/**
 * Sanitize a task string
 * @param task
 * @param maxLength
 * @returns sanitized task string
 */
export function sanitizeTask(task: string, maxLength: number = 100): string {
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
 * Validate if a user input is safe/valid.
 * Twitch already strips most dangerous chars; we still reject control chars to avoid overlay glitches.
 */
export function isValidInput(input: string): boolean {
	if (!input || typeof input !== 'string') return false;
	const hasControlChars = /[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(input);
	return !hasControlChars;
}

// For backward compatibility, also export as default object
const Validators = {
	sanitizeTask,
	isValidInput,
};

export default Validators;
