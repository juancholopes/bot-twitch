/**
 * Supabase Rate Limiting - User Identifier Utility
 *
 * Ubicación: shared/utils (usado por backend y overlay)
 * Scope Rule: Compartido entre múltiples features
 *
 * Proporciona identificación consistente de usuarios para rate limiting
 */

/**
 * Get unique identifier for rate limiting
 *
 * En el backend, usa información del usuario de Twitch
 * En el frontend, usa session ID o fallback a 'anonymous'
 *
 * @param context - Contexto adicional (username, IP, sessionId)
 * @returns Identificador único para rate limiting
 */
export function getUserIdentifier(context?: {
  username?: string;
  ip?: string;
  sessionId?: string;
}): string {
  // Priority 1: Username (más específico)
  if (context?.username) {
    return `user_${context.username.toLowerCase()}`;
  }

  // Priority 2: IP Address (para requests desde backend)
  if (context?.ip) {
    return `ip_${context.ip}`;
  }

  // Priority 3: Session ID (para frontend)
  if (context?.sessionId) {
    return `session_${context.sessionId}`;
  }

  // Fallback: anonymous (menos preferido, compartido por todos)
  return "anonymous";
}

/**
 * Check if running in browser environment
 */
function isBrowser(): boolean {
  return (
    typeof window !== "undefined" && typeof window.document !== "undefined"
  );
}

/**
 * Generate or retrieve session ID for browser environments
 *
 * @returns Session ID único por navegador
 */
export function getOrCreateSessionId(): string {
  // Solo funciona en entorno navegador
  if (!isBrowser()) {
    return "server_session";
  }

  try {
    const storage = window.sessionStorage;
    let sessionId = storage.getItem("supabase_session_id");

    if (!sessionId) {
      // Generar nuevo session ID
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        sessionId = crypto.randomUUID();
      } else {
        // Fallback para entornos sin crypto.randomUUID
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      }
      storage.setItem("supabase_session_id", sessionId);
    }

    return sessionId;
  } catch (error) {
    // Si sessionStorage no está disponible (privado/incognito), usar fallback
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Get user identifier for browser context
 * Automatically uses session storage
 */
export function getBrowserIdentifier(): string {
  return getUserIdentifier({
    sessionId: getOrCreateSessionId(),
  });
}

/**
 * Get user identifier for server/backend context
 *
 * @param username - Twitch username
 * @param ip - Optional IP address
 */
export function getServerIdentifier(username?: string, ip?: string): string {
  return getUserIdentifier({
    username,
    ip,
  });
}
