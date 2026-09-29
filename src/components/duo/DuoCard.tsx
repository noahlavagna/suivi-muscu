import { useState } from 'react';
import { useCloud } from '../../state/cloud';
import { partnerName, useDuo } from '../../state/duo';
import { Card } from '../Screen';
import { Pressable } from '../ui/Pressable';
import { IconHeart } from '../ui/Icons';

/** Réglages : lier son téléphone à celui de son binôme par un code. */
export function DuoCard() {
  const configured = useCloud((s) => s.configured);
  const email = useCloud((s) => s.email);
  const { status, duo, me, busy, error, create, join, leave } = useDuo();
  const [code, setCode] = useState('');

  const btn =
    'w-full rounded-[12px] bg-accent py-3 text-[15px] font-semibold text-canvas disabled:opacity-40';

  return (
    <>
      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        Mode Duo
      </p>
      <Card className="mb-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-dim text-accent">
            <IconHeart size={18} />
          </span>
          <p className="text-[13px] leading-4.5 text-ink-2">
            {status === 'linked'
              ? `Lié avec ${partnerName(duo, me)}. Vous voyez la séance de l’autre en direct et pouvez vous laisser des mots.`
              : 'Liez vos deux téléphones pour suivre la séance de l’autre en direct et vous envoyer des encouragements.'}
          </p>
        </div>

        {(!configured || !email) && (
          <p className="text-[13px] text-ink-3">
            Connecte-toi au compte cloud (juste au-dessus) — chacun avec le sien.
          </p>
        )}

        {email && status === 'none' && (
          <div className="flex flex-col gap-2.5">
            <Pressable className={btn} disabled={busy} onClick={() => void create()}>
              Créer un code
            </Pressable>
            <p className="text-center text-[12px] text-ink-3">ou saisis celui de ton binôme</p>
            <div className="flex gap-2">
              <input
                className="tnum min-w-0 flex-1 rounded-[12px] bg-raised-2 px-3.5 py-3 text-center text-[18px] font-bold uppercase tracking-[0.25em] text-ink placeholder:text-ink-3 placeholder:tracking-normal"
                placeholder="Code"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect="off"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
              <Pressable
                className="rounded-[12px] bg-accent px-5 text-[15px] font-semibold text-canvas disabled:opacity-40"
                disabled={busy || code.trim().length !== 6}
                onClick={() => void join(code)}
              >
                Rejoindre
              </Pressable>
            </div>
          </div>
        )}

        {email && status === 'pending' && duo && (
          <div className="flex flex-col items-center gap-2 py-1">
            <p className="text-[13px] text-ink-2">Donne ce code à ton binôme :</p>
            <p className="tnum select-all text-[34px] font-bold tracking-[0.3em] text-accent">
              {duo.code}
            </p>
            <p className="flex items-center gap-2 text-[12px] text-ink-3">
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
              En attente de son téléphone…
            </p>
            <Pressable
              className="mt-1 text-[14px] font-semibold text-ink-2"
              disabled={busy}
              onClick={() => void leave()}
            >
              Annuler
            </Pressable>
          </div>
        )}

        {email && status === 'linked' && (
          <Pressable
            className="w-full rounded-[12px] bg-raised-2 py-3 text-[15px] font-semibold text-negative"
            disabled={busy}
            onClick={() => {
              if (window.confirm(`Délier ton téléphone de celui de ${partnerName(duo, me)} ?`))
                void leave();
            }}
          >
            Délier
          </Pressable>
        )}

        {error && <p className="mt-2.5 text-[13px] text-negative">{error}</p>}
      </Card>
    </>
  );
}
