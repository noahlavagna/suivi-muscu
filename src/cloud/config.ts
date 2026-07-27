/**
 * Configuration Supabase. Ces deux valeurs sont PUBLIQUES par conception
 * (la sécurité repose sur les Row Level Security policies côté serveur).
 * Vides → la section « Compte » des réglages s'affiche comme non configurée.
 */
export const SUPABASE_URL = 'https://jtutuglfuhueyfaxffoy.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dXR1Z2xmdWh1ZXlmYXhmZm95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODQyNzQsImV4cCI6MjEwMDc2MDI3NH0.GV_1zSfcDmDkeimG7AsxUbEQOUtx2MpxlA1rFZxSHe4';

export const cloudConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';
