import { create } from 'zustand';
import { db } from '../db/db';
import { DEFAULT_SETTINGS, type Settings } from '../db/types';
import { setHapticsEnabled } from '../lib/haptics';
import { setSoundEnabled } from '../lib/sound';

type SettingsValues = Omit<Settings, 'id'>;

interface SettingsState extends SettingsValues {
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<SettingsValues>) => void;
}

const media = window.matchMedia('(prefers-color-scheme: dark)');

function applyTheme(pref: Settings['theme']) {
  const resolved = pref === 'system' ? (media.matches ? 'dark' : 'light') : pref;
  document.documentElement.dataset.theme = resolved;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  metaTheme?.setAttribute('content', resolved === 'dark' ? '#0C0B0A' : '#F4F2EF');
}

function applySideEffects(s: SettingsValues) {
  applyTheme(s.theme);
  setHapticsEnabled(s.haptics);
  setSoundEnabled(s.sound);
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,
  loaded: false,

  async load() {
    const stored = (await db.meta.get('settings')) as Settings | undefined;
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    applySideEffects(merged);
    set({ ...merged, loaded: true });
  },

  update(patch) {
    const next: SettingsValues = {
      unit: get().unit,
      theme: get().theme,
      sound: get().sound,
      haptics: get().haptics,
      defaultRestSec: get().defaultRestSec,
      ...patch,
    };
    applySideEffects(next);
    set(next);
    void db.meta.put({ id: 'settings', ...next });
  },
}));

media.addEventListener('change', () => {
  if (useSettings.getState().theme === 'system') applyTheme('system');
});

// Thème appliqué immédiatement (avant chargement de la base) pour éviter un flash
applyTheme('system');
