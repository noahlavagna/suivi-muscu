import { useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Flame } from '../components/gami/Flame';
import { Pressable } from '../components/ui/Pressable';
import {
  IconAddToHome,
  IconCheck,
  IconDesktop,
  IconDots,
  IconPhone,
  IconShare,
} from '../components/ui/Icons';
import {
  canPromptInstall,
  isAndroid,
  isIOS,
  isIOSSafari,
  isMobile,
  onInstallStateChange,
  promptInstall,
  wasInstalled,
} from '../lib/platform';

/**
 * Portail affiché tant que l'app n'est pas lancée depuis l'écran d'accueil :
 * instructions d'installation sur téléphone, message « mobile uniquement »
 * sur ordinateur. Voir lib/platform.ts pour la détection.
 */

function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-[14px] bg-raised px-3.5 py-3 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-dim text-[13px] font-bold text-accent">
        {n}
      </span>
      <p className="flex-1 text-[14px] leading-5 text-ink-2">{children}</p>
      <span className="shrink-0 text-ink-3">{icon}</span>
    </li>
  );
}

const strong = (t: string) => <span className="font-semibold text-ink">{t}</span>;

function DesktopPanel() {
  const [copied, setCopied] = useState(false);
  const url = window.location.origin + window.location.pathname;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers refusé : l'URL reste lisible et sélectionnable */
    }
  };

  return (
    <>
      <span className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-raised text-ink-3">
        <IconDesktop size={28} />
      </span>
      <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em]">Uniquement sur téléphone</h1>
      <p className="mt-3 max-w-[340px] text-[15px] leading-6 text-ink-2">
        La Forge se tient dans une main, entre deux séries. Ouvre cette adresse sur ton téléphone
        et installe-la sur l’écran d’accueil.
      </p>
      <p className="mt-6 w-full max-w-[340px] truncate rounded-[12px] bg-raised px-4 py-3 text-[14px] text-ink-2 select-all">
        {url}
      </p>
      <Pressable
        className="mt-2.5 w-full max-w-[340px] rounded-[12px] bg-accent py-3 text-[15px] font-semibold text-canvas"
        onClick={() => void copy()}
      >
        {copied ? 'Lien copié ✓' : 'Copier le lien'}
      </Pressable>
    </>
  );
}

function MobilePanel() {
  const [, bump] = useState(0);
  useEffect(() => onInstallStateChange(() => bump((n) => n + 1)), []);
  const installable = canPromptInstall();

  // Installée depuis cet onglet : il ne reste qu'à la lancer par son icône.
  if (wasInstalled())
    return (
      <>
        <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em]">C’est installé</h1>
        <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-ink-2">
          Ferme cet onglet et ouvre {strong('La Forge')} depuis ton écran d’accueil.
        </p>
      </>
    );

  // iOS hors Safari (Chrome, Firefox…) : l'ajout à l'écran d'accueil n'y est pas fiable.
  if (isIOS && !isIOSSafari)
    return (
      <>
        <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em]">Ouvre-la dans Safari</h1>
        <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-ink-2">
          Sur iPhone, seul Safari sait installer l’app sur l’écran d’accueil. Copie cette adresse
          et colle-la dans Safari, puis reviens ici.
        </p>
        <p className="mt-6 w-full truncate rounded-[12px] bg-raised px-4 py-3 text-[14px] text-ink-2 select-all">
          {window.location.href}
        </p>
      </>
    );

  return (
    <>
      <h1 className="mt-5 text-[26px] font-bold tracking-[-0.02em]">Installe La Forge</h1>
      <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-ink-2">
        L’app s’utilise depuis l’écran d’accueil : plein écran, hors ligne, et tes données à
        l’abri. Deux secondes à faire, une fois.
      </p>

      {isAndroid && installable ? (
        <Pressable
          className="mt-7 w-full rounded-[14px] bg-accent py-3.5 text-[16px] font-semibold text-canvas"
          onClick={() => void promptInstall()}
        >
          Ajouter à l’écran d’accueil
        </Pressable>
      ) : (
        <ul className="mt-7 flex w-full flex-col gap-2">
          {isAndroid ? (
            <>
              <Step n={1} icon={<IconDots size={20} />}>
                Ouvre le menu {strong('⋮')} en haut à droite de Chrome
              </Step>
              <Step n={2} icon={<IconAddToHome size={20} />}>
                Choisis {strong('Installer l’application')}
              </Step>
            </>
          ) : (
            <>
              <Step n={1} icon={<IconShare size={20} />}>
                Appuie sur {strong('Partager')} dans la barre de Safari
              </Step>
              <Step n={2} icon={<IconAddToHome size={20} />}>
                Fais défiler et choisis {strong('Sur l’écran d’accueil')}
              </Step>
            </>
          )}
          <Step n={3} icon={<IconCheck size={20} />}>
            Lance La Forge depuis son icône — c’est tout
          </Step>
        </ul>
      )}

      <p className="mt-5 text-[13px] leading-5 text-ink-3">
        Ton compte et tes séances te suivront : connecte-toi une fois installée.
      </p>
    </>
  );
}

export function InstallGate() {
  const reduced = useReducedMotion();

  return (
    <div
      className="scroll-y flex h-full flex-col items-center justify-center bg-canvas px-6 text-center"
      style={{
        paddingTop: 'calc(var(--safe-top) + 24px)',
        paddingBottom: 'calc(var(--safe-bottom) + 24px)',
      }}
    >
      <motion.div
        className="flex w-full max-w-[380px] flex-col items-center"
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        {isMobile ? (
          <>
            <Flame lit size={56} />
            <MobilePanel />
          </>
        ) : (
          <DesktopPanel />
        )}
      </motion.div>

      {!isMobile && (
        <span className="mt-8 flex items-center gap-1.5 text-[12px] font-medium text-ink-3">
          <IconPhone size={14} /> iPhone & Android
        </span>
      )}
    </div>
  );
}
