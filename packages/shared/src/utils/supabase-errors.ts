/**
 * Supabase Error Parser
 *
 * Ubicación: shared/utils (usado por backend y overlay)
 * Scope Rule: Compartido entre múltiples features
 *
 * Proporciona parsing consistente de errores de Supabase
 */

export type SupabaseErrorType =
  | 'rate_limit'
  | 'validation'
  | 'not_found'
  | 'permission'
  | 'network'
  | 'unknown';

export interface ParsedSupabaseError {
  type: SupabaseErrorType;
  message: string;
  userMessage: string;
  originalError?: any;
  retryable: boolean;
}

/**
 * Parse Supabase error into user-friendly format
 *
 * @param error - Error from Supabase operation
 * @returns Parsed error with type and user-friendly message
 */
export function parseSupabaseError(error: any): ParsedSupabaseError {
  const message = error?.message || String(error);
  const code = error?.code;

  // Rate limit errors
  if (message.includes('Rate limit exceeded')) {
    return {
      type: 'rate_limit',
      message,
      userMessage: 'Has hecho demasiadas peticiones. Por favor espera un momento.',
      originalError: error,
      retryable: true
    };
  }

  // Validation errors
  if (message.includes('Invalid username')) {
    return {
      type: 'validation',
      message,
      userMessage: 'El nombre de usuario debe tener entre 3 y 25 caracteres alfanuméricos.',
      originalError: error,
      retryable: false
    };
  }

  if (message.includes('Task text too long')) {
    return {
      type: 'validation',
      message,
      userMessage: 'La descripción de la tarea es demasiado larga (máximo 500 caracteres).',
      originalError: error,
      retryable: false
    };
  }

  if (message.includes('cannot be empty') || message.includes('Task text cannot be empty')) {
    return {
      type: 'validation',
      message,
      userMessage: 'Este campo no puede estar vacío.',
      originalError: error,
      retryable: false
    };
  }

  if (message.includes('must be non-negative') || message.includes('must be positive')) {
    return {
      type: 'validation',
      message,
      userMessage: 'Los valores deben ser positivos.',
      originalError: error,
      retryable: false
    };
  }

  if (message.includes('cannot exceed 240')) {
    return {
      type: 'validation',
      message,
      userMessage: 'La duración de trabajo no puede exceder 240 minutos.',
      originalError: error,
      retryable: false
    };
  }

  // Not found errors
  if (message.includes('not found') || code === 'PGRST116') {
    return {
      type: 'not_found',
      message,
      userMessage: 'No se encontró el registro solicitado.',
      originalError: error,
      retryable: false
    };
  }

  // Permission errors
  if (message.includes('permission denied') || message.includes('RLS')) {
    return {
      type: 'permission',
      message,
      userMessage: 'No tienes permisos para realizar esta acción.',
      originalError: error,
      retryable: false
    };
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return {
      type: 'network',
      message,
      userMessage: 'Error de conexión. Por favor verifica tu conexión a internet.',
      originalError: error,
      retryable: true
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message,
    userMessage: 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
    originalError: error,
    retryable: true
  };
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const parsed = parseSupabaseError(error);
  return parsed.retryable;
}

/**
 * Get user-friendly error message
 */
export function getUserErrorMessage(error: any): string {
  return parseSupabaseError(error).userMessage;
}

/**
 * Check if error is rate limit error
 */
export function isRateLimitError(error: any): boolean {
  return parseSupabaseError(error).type === 'rate_limit';
}

/**
 * Check if error is validation error
 */
export function isValidationError(error: any): boolean {
  return parseSupabaseError(error).type === 'validation';
}
