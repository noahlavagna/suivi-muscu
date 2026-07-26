import { create } from 'zustand';

export type Tab = 'today' | 'progress' | 'history' | 'program';

export type PushedScreen =
  | { type: 'exercise-detail'; exerciseId: string }
  | { type: 'workout-detail'; workoutId: string }
  | { type: 'template-editor'; templateId: string }
  | { type: 'library' }
  | { type: 'forge' }
  | { type: 'settings' };

export type StackItem = PushedScreen & { key: number };

interface NavState {
  tab: Tab;
  stack: StackItem[];
  setTab: (tab: Tab) => void;
  push: (screen: PushedScreen) => void;
  pop: () => void;
}

let nextKey = 1;

export const useNav = create<NavState>((set, get) => ({
  tab: 'today',
  stack: [],
  setTab(tab) {
    if (get().tab === tab && get().stack.length > 0) {
      set({ stack: [] }); // re-tap sur l'onglet actif : retour à la racine
    } else {
      set({ tab, stack: [] });
    }
  },
  push(screen) {
    set({ stack: [...get().stack, { ...screen, key: nextKey++ }] });
  },
  pop() {
    set({ stack: get().stack.slice(0, -1) });
  },
}));
