import { create } from 'zustand';

export interface Toast {
  key: number;
  icon: string; // clé BadgeTile / 'trophy' / 'scroll'…
  title: string;
  sub?: string;
}

interface ToastState {
  queue: Toast[];
  push: (t: Omit<Toast, 'key'>) => void;
  shift: () => void;
}

let nextKey = 1;

/** File de célébrations (PR, badge, contrat) — affichées une par une en haut. */
export const useToasts = create<ToastState>((set, get) => ({
  queue: [],
  push: (t) => set({ queue: [...get().queue, { ...t, key: nextKey++ }] }),
  shift: () => set({ queue: get().queue.slice(1) }),
}));
