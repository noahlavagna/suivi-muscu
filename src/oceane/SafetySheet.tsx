import { Sheet } from '../components/ui/Sheet';
import { FORBIDDEN, NORMAL_SIGNALS, STOP_RULE, STOP_SIGNALS } from './guide';

/**
 * La page « stop immédiat » du document, à un doigt de distance pendant la
 * séance. C'est la seule chose qu'on ne doit jamais avoir à chercher.
 */
export function SafetySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} ariaLabel="Signaux d’arrêt">
      <div className="pb-4 pt-1">
        <h2 className="text-[22px] font-bold tracking-[-0.01em]">Tu arrêtes la série</h2>
        <p className="mt-1 text-[14px] text-ink-2">
          Tu ne finis pas les reps, tu passes à autre chose. Sans discuter avec toi-même.
        </p>

        <div className="mt-4 rounded-[var(--radius-card)] border border-negative/35 bg-raised p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-negative">
            Stop immédiat
          </p>
          <ul className="space-y-2">
            {STOP_SIGNALS.map((s) => (
              <li key={s} className="flex gap-2.5 text-[14px] leading-5 text-ink">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-[var(--radius-card)] bg-raised p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-positive">
            Normal, sans inquiétude
          </p>
          <ul className="space-y-2">
            {NORMAL_SIGNALS.map((s) => (
              <li key={s} className="flex gap-2.5 text-[14px] leading-5 text-ink-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 rounded-[var(--radius-card)] bg-accent-dim p-4">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-accent">
            La règle simple
          </p>
          <p className="text-[14px] leading-5.5 text-ink-2">{STOP_RULE}</p>
          <p className="mt-2 text-[14px] font-semibold leading-5.5 text-ink">
            Tu ne « pousses pas quand même » pour finir le programme. Le programme s’adapte à
            toi, pas l’inverse.
          </p>
        </div>

        <div className="mt-3 rounded-[var(--radius-card)] bg-raised p-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-3">
            Ce qu’on évite tant que le bilan kiné n’est pas fait
          </p>
          <ul className="space-y-1.5">
            {FORBIDDEN.map((s) => (
              <li key={s} className="flex gap-2.5 text-[14px] leading-5 text-ink-2">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink-3" />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[13px] leading-5 text-ink-3">
            Ce n’est pas de la prudence générique : ces mouvements concentrent tous la charge
            exactement à ta charnière dorso-lombaire.
          </p>
        </div>
      </div>
    </Sheet>
  );
}
