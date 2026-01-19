/**
 * Database Infrastructure (Frontend)
 * 
 * Centralizes Supabase access for the overlay
 * Scope Rule: Infrastructure layer (cross-cutting concern)
 */

export { getSupabaseClient, supabase, type Database, type RealtimeChannel } from './supabase.client';
export type { SessionRecord } from '@bot-twitch/shared';
