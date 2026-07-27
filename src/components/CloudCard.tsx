import { useEffect, useState } from 'react';
import { useCloud } from '../state/cloud';
import { Card } from './Screen';
import { Pressable } from './ui/Pressable';
import { IconCloud } from './ui/Icons';

function fmtLast(iso: string | null): string {
  if (!iso) return 'Jamais';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Compte + sauvegarde cloud (code par email, sans mot de passe). */
export function CloudCard() {
  const cloud = useCloud();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  useEffect(() => () => cloud.clearMessages(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const input =
    'w-full rounded-[12px] bg-raised-2 px-3.5 py-3 text-[16px] text-ink placeholder:text-ink-3';
  const btn =
    'w-full rounded-[12px] bg-accent py-3 text-[15px] font-semibold text-canvas disabled:opacity-40';

  return (
    <>
      <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">
        Compte & sauvegarde cloud
      </p>
      <Card className="mb-4">
        {!cloud.configured && (
          <p className="py-2 text-[14px] text-ink-2">
            Le cloud n’est pas encore configuré sur cette version.
          </p>
        )}

        {cloud.configured && !cloud.email && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-accent-dim text-accent">
                <IconCloud size={18} />
              </span>
              <p className="text-[13px] leading-4.5 text-ink-2">
                Sauvegarde tes données en ligne pour ne jamais les perdre. Un code par
                email, pas de mot de passe.
              </p>
            </div>
            {cloud.codeSentTo === null ? (
              <>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={input}
                  placeholder="ton@email.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Pressable
                  className={btn}
                  disabled={cloud.busy || !email.includes('@')}
                  onClick={() => void cloud.sendCode(email.trim())}
                >
                  {cloud.busy ? 'Envoi…' : 'Recevoir un code'}
                </Pressable>
              </>
            ) : (
              <>
                <p className="text-[13px] text-ink-2">
                  Code envoyé à <span className="font-semibold">{cloud.codeSentTo}</span>
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className={`${input} tnum text-center text-[22px] tracking-[0.4em]`}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
                <Pressable
                  className={btn}
                  disabled={cloud.busy || code.length !== 6}
                  onClick={() => void cloud.verifyCode(code)}
                >
                  {cloud.busy ? 'Vérification…' : 'Se connecter'}
                </Pressable>
                <Pressable
                  className="py-1 text-[13px] font-medium text-ink-3"
                  onClick={() => void cloud.sendCode(cloud.codeSentTo!)}
                >
                  Renvoyer le code
                </Pressable>
              </>
            )}
          </div>
        )}

        {cloud.configured && cloud.email && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between border-b border-sep pb-2.5">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold">{cloud.email}</p>
                <p className="tnum text-[12px] text-ink-3">
                  Dernière sauvegarde : {fmtLast(cloud.lastBackupAt)}
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-dim text-accent">
                <IconCloud size={18} />
              </span>
            </div>
            <p className="text-[12px] text-ink-3">
              Sauvegarde automatique après chaque séance terminée.
            </p>
            <Pressable className={btn} disabled={cloud.busy} onClick={() => void cloud.backupNow()}>
              Sauvegarder maintenant
            </Pressable>
            <Pressable
              className="w-full rounded-[12px] bg-raised-2 py-3 text-[15px] font-semibold text-ink disabled:opacity-40"
              disabled={cloud.busy}
              onClick={() => {
                if (
                  window.confirm(
                    'Restaurer la sauvegarde cloud REMPLACE toutes les données de cet appareil. Continuer ?',
                  )
                )
                  void cloud.restoreFromCloud();
              }}
            >
              Restaurer sur cet appareil
            </Pressable>
            <Pressable
              className="w-full py-2 text-[14px] font-semibold text-negative"
              onClick={() => void cloud.signOut()}
            >
              Se déconnecter
            </Pressable>
          </div>
        )}

        {cloud.error && <p className="mt-2 text-[13px] text-negative">{cloud.error}</p>}
        {cloud.info && <p className="mt-2 text-[13px] text-positive">{cloud.info}</p>}
      </Card>
    </>
  );
}
