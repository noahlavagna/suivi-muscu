import { create } from 'zustand';
import { supabase } from '../cloud/client';
import { cloudConfigured } from '../cloud/config';
import { applyBackupData, buildBackupData, validateBackup } from '../db/backup';

/**
 * Compte + sauvegarde cloud : email + mot de passe.
 *
 * Choisi plutôt que le lien magique / code par email parce que le SMTP par
 * défaut de Supabase est limité (quelques emails par heure, destinataires
 * restreints) et qu'une PWA installée sur iOS ne partage pas sa session avec
 * Safari — récupérer un lien depuis la boîte mail était pénible.
 *
 * Suppose « Confirm email » désactivé côté Supabase : l'inscription ouvre
 * directement la session. Si la confirmation est réactivée, `signUp` le
 * détecte (aucune session renvoyée) et l'annonce à l'utilisateur.
 */

export const MIN_PASSWORD = 8;

interface CloudState {
  configured: boolean;
  email: string | null; // connecté si non null
  lastBackupAt: string | null; // ISO
  busy: boolean;
  error: string | null;
  info: string | null;

  init: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  backupNow: (silent?: boolean) => Promise<void>;
  restoreFromCloud: () => Promise<{ workouts: number; sets: number } | null>;
  clearMessages: () => void;
}

export const useCloud = create<CloudState>((set, get) => ({
  configured: cloudConfigured,
  email: null,
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

  async signIn(email, password) {
    if (!supabase) return;
    set({ busy: true, error: null, info: null });
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      set({ busy: false, error: humanError(error.message) });
      return;
    }
    await afterSignIn(set, get);
  },

  async signUp(email, password) {
    if (!supabase) return;
    set({ busy: true, error: null, info: null });
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      set({ busy: false, error: humanError(error.message) });
      return;
    }
    // « Confirm email » actif côté Supabase : pas de session tant que le lien n'est pas cliqué.
    if (!data.session) {
      set({ busy: false, info: 'Compte créé — confirme ton email puis connecte-toi.' });
      return;
    }
    await afterSignIn(set, get);
  },

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ email: null, lastBackupAt: null });
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

/** Session ouverte : récupère l'état du cloud, et pousse une 1re sauvegarde si le compte est vide. */
async function afterSignIn(
  set: (p: Partial<CloudState>) => void,
  get: () => CloudState,
): Promise<void> {
  const { data } = await supabase!.auth.getUser();
  set({ busy: false, email: data.user?.email ?? null, info: null });
  await refreshBackupMeta(set);
  if (!get().lastBackupAt) await get().backupNow(true);
}

async function refreshBackupMeta(set: (p: Partial<CloudState>) => void) {
  if (!supabase) return;
  const { data } = await supabase.from('backups').select('updated_at').maybeSingle();
  set({ lastBackupAt: data?.updated_at ?? null });
}

function humanError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Trop de tentatives — attends une minute.';
  if (m.includes('invalid login credentials'))
    return 'Email ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Un compte existe déjà avec cet email — connecte-toi.';
  if (m.includes('password') && m.includes('at least'))
    return `Mot de passe trop court (${MIN_PASSWORD} caractères minimum).`;
  if (m.includes('email address') && m.includes('invalid')) return 'Adresse email invalide.';
  if (m.includes('not confirmed'))
    return 'Email pas encore confirmé — vérifie ta boîte de réception.';
  if (m.includes('fetch') || m.includes('network')) return 'Pas de connexion — réessaie plus tard.';
  return msg;
}
