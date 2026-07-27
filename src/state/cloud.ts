import { create } from 'zustand';
import { supabase } from '../cloud/client';
import { cloudConfigured } from '../cloud/config';
import { applyBackupData, buildBackupData, validateBackup } from '../db/backup';

/**
 * Compte + sauvegarde cloud. Connexion par code à 6 chiffres envoyé par
 * email (pas de mot de passe, pas de lien magique — fiable en PWA installée).
 * La sauvegarde est un snapshot complet, poussé après chaque séance terminée.
 */

interface CloudState {
  configured: boolean;
  email: string | null; // connecté si non null
  codeSentTo: string | null;
  lastBackupAt: string | null; // ISO
  busy: boolean;
  error: string | null;
  info: string | null;

  init: () => Promise<void>;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  backupNow: (silent?: boolean) => Promise<void>;
  restoreFromCloud: () => Promise<{ workouts: number; sets: number } | null>;
  clearMessages: () => void;
}

export const useCloud = create<CloudState>((set, get) => ({
  configured: cloudConfigured,
  email: null,
  codeSentTo: null,
  lastBackupAt: null,
  busy: false,
  error: null,
  info: null,

  async init() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    set({ email: data.session?.user.email ?? null });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ email: session?.user.email ?? null });
    });
    if (data.session) await refreshBackupMeta(set);
  },

  async sendCode(email) {
    if (!supabase) return;
    set({ busy: true, error: null, info: null });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) set({ busy: false, error: humanError(error.message) });
    else
      set({
        busy: false,
        codeSentTo: email,
        info: 'Code envoyé — regarde tes emails (et les indésirables).',
      });
  },

  async verifyCode(code) {
    const email = get().codeSentTo;
    if (!supabase || !email) return;
    set({ busy: true, error: null, info: null });
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) {
      set({ busy: false, error: humanError(error.message) });
      return;
    }
    set({ busy: false, codeSentTo: null, info: null });
    await refreshBackupMeta(set);
    // Première connexion sur cet appareil : pousse tout de suite une sauvegarde
    if (!get().lastBackupAt) await get().backupNow(true);
  },

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ email: null, lastBackupAt: null, codeSentTo: null });
  },

  async backupNow(silent = false) {
    if (!supabase || !get().email) return;
    if (!silent) set({ busy: true, error: null, info: null });
    try {
      const backup = await buildBackupData();
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Session expirée');
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('backups')
        .upsert({ user_id: userId, data: backup, updated_at: now });
      if (error) throw new Error(error.message);
      set({ lastBackupAt: now, ...(silent ? {} : { busy: false, info: 'Sauvegarde envoyée.' }) });
    } catch (e) {
      if (!silent)
        set({ busy: false, error: humanError(e instanceof Error ? e.message : 'Erreur inconnue') });
    }
  },

  async restoreFromCloud() {
    if (!supabase || !get().email) return null;
    set({ busy: true, error: null, info: null });
    try {
      const { data, error } = await supabase
        .from('backups')
        .select('data, updated_at')
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) {
        set({ busy: false, error: 'Aucune sauvegarde cloud pour ce compte.' });
        return null;
      }
      const result = await applyBackupData(validateBackup(data.data));
      set({
        busy: false,
        lastBackupAt: data.updated_at,
        info: `Restauré : ${result.workouts} séances, ${result.sets} séries.`,
      });
      return result;
    } catch (e) {
      set({ busy: false, error: humanError(e instanceof Error ? e.message : 'Erreur inconnue') });
      return null;
    }
  },

  clearMessages: () => set({ error: null, info: null }),
}));

async function refreshBackupMeta(set: (p: Partial<CloudState>) => void) {
  if (!supabase) return;
  const { data } = await supabase.from('backups').select('updated_at').maybeSingle();
  set({ lastBackupAt: data?.updated_at ?? null });
}

function humanError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit')) return 'Trop de tentatives — réessaie dans une minute.';
  if (m.includes('expired') || m.includes('invalid')) return 'Code invalide ou expiré.';
  if (m.includes('fetch')) return 'Pas de connexion — réessaie plus tard.';
  return msg;
}
