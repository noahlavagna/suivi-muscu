/**
 * Configuration Supabase. Ces deux valeurs sont PUBLIQUES par conception
 * (la sécurité repose sur les Row Level Security policies côté serveur).
 * Vides → la section « Compte » des réglages s'affiche comme non configurée.
 */
export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

export const cloudConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
