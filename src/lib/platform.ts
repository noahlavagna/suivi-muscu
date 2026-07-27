/**
 * Détection de plateforme pour le portail d'installation (voir InstallGate).
 *
 * L'app n'est utilisable qu'installée sur l'écran d'accueil d'un téléphone :
 * hors standalone, iOS purge IndexedDB des sites peu visités et la barre de
 * Safari casse la mise en page plein écran.
 */

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent;

/** iPadOS 13+ s'annonce comme un Mac : on le repère au tactile. */
export const isIOS =
  /iPad|iPhone|iPod/.test(ua) ||
  (ua.includes('Macintosh') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);

export const isAndroid = /Android/.test(ua);

export const isMobile = isIOS || isAndroid;

/** Sur iOS, seul Safari propose « Sur l'écran d'accueil » de façon fiable. */
export const isIOSSafari = isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

/** L'app tourne depuis l'écran d'accueil (et non dans un onglet du navigateur). */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS n'implémente pas display-mode : propriété propriétaire
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Corrige la bande morte en bas de l'écran en PWA standalone iOS.
 *
 * Avec la status bar translucide, le viewport de mise en page est amputé de la
 * hauteur de celle-ci (797 px au lieu de 844 sur un iPhone 14) alors que le
 * contenu démarre bien à y=0 : la tab bar s'arrête donc au-dessus du bas
 * physique. `screen.height` donne l'écran réel. On n'applique la correction que
 * si l'écart existe vraiment, pour ne rien casser ailleurs.
 */
export function fixStandaloneViewportHeight(): void {
  if (!isIOS || !isStandalone()) return;
  const apply = () => {
    const real = Math.max(window.innerHeight, window.screen.height);
    document.documentElement.style.setProperty('--app-height', `${real}px`);
  };
  apply();
  window.addEventListener('resize', apply);
}

/* ————— Invite d'installation Android/Chrome —————
 * L'événement est émis très tôt, souvent avant le montage de React : on
 * l'intercepte dès l'import du module (fait depuis main.tsx) et on le rejoue
 * pour les abonnés qui arrivent après.
 */

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: InstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // sinon Chrome affiche sa propre mini-infobar
    deferredPrompt = e as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    installed = true;
    notify();
  });
}

export const canPromptInstall = (): boolean => deferredPrompt !== null;

/** L'app vient d'être installée depuis cet onglet (il reste à ouvrir l'icône). */
export const wasInstalled = (): boolean => installed;

/** Abonnement à tout changement d'état d'installation. Renvoie le désabonnement. */
export function onInstallStateChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Ouvre la boîte de dialogue native d'installation. Renvoie true si acceptée. */
export async function promptInstall(): Promise<boolean> {
  if (!deferredPrompt) return false;
  const evt = deferredPrompt;
  deferredPrompt = null;
  notify();
  await evt.prompt();
  const { outcome } = await evt.userChoice;
  return outcome === 'accepted';
}
