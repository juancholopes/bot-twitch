/**
 * Database Infrastructure
 * 
 * Centralizes database access for the backend
 * Scope Rule: Infrastructure layer (cross-cutting concern)
 */

export { getSupabaseClient, supabase, type Database } from './supabase.client';
export type { SessionRecord } from '@bot-twitch/shared';
