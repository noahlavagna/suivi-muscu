import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { InstallGate } from './screens/InstallGate';
import { fixStandaloneViewportHeight, isMobile, isStandalone } from './lib/platform';
import './styles/app.css';

// Enregistré avant tout : sans service worker, Chrome ne propose pas l'installation.
registerSW({ immediate: true });

/**
 * L'app ne tourne que depuis l'écran d'accueil d'un téléphone. Partout ailleurs
 * (onglet de navigateur mobile, ordinateur) on affiche le portail d'installation
 * — jamais l'app elle-même. Le mode dev reste libre pour pouvoir travailler.
 */
const gated = !import.meta.env.DEV && (!isMobile || !isStandalone());

fixStandaloneViewportHeight();

// Le thème est normalement posé par useSettings au chargement de la base ;
// le portail s'affiche avant, il lui faut donc sa propre résolution.
if (gated)
  document.documentElement.dataset.theme = window.matchMedia('(prefers-color-scheme: dark)')
    .matches
    ? 'dark'
    : 'light';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{gated ? <InstallGate /> : <App />}</StrictMode>,
);
