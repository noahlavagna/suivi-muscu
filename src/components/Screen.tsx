import type { ReactNode } from 'react';
import { Pressable } from './ui/Pressable';
import { IconChevronLeft } from './ui/Icons';
import { useNav } from '../state/nav';

/** Conteneur scrollable d'un écran, avec safe areas et place pour la tab bar. */
export function Screen({
  children,
  className = '',
  bottomPadding = 108,
}: {
  children: ReactNode;
  className?: string;
  bottomPadding?: number;
}) {
  return (
    <div
      className={`scroll-y h-full px-5 ${className}`}
      style={{
        paddingTop: 'calc(var(--safe-top) + 16px)',
        paddingBottom: `calc(var(--safe-bottom) + ${bottomPadding}px)`,
      }}
    >
      {children}
    </div>
  );
}

export function LargeTitle({
  children,
  sub,
  right,
}: {
  children: ReactNode;
  sub?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-bold leading-8 tracking-[-0.02em]">{children}</h1>
        {sub && <p className="mt-1 text-[15px] text-ink-2">{sub}</p>}
      </div>
      {right}
    </header>
  );
}

/** Barre de retour des écrans empilés. */
export function BackHeader({ title, right }: { title: string; right?: ReactNode }) {
  const pop = useNav((s) => s.pop);
  return (
    <div className="mb-4 flex items-center gap-1">
      <Pressable
        onClick={pop}
        className="-ml-2.5 flex h-10 w-10 items-center justify-center text-accent"
        aria-label="Retour"
      >
        <IconChevronLeft size={24} />
      </Pressable>
      <h1 className="min-w-0 flex-1 truncate text-[20px] font-bold tracking-[-0.01em]">{title}</h1>
      {right}
    </div>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-[16px] bg-raised p-4 ${className}`}>{children}</div>
  );
}
