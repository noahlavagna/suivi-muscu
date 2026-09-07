import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  applyForgePreset,
  applyPreset,
  FORGE_PRESET_META,
  PROGRAM_PRESETS,
} from '../db/programs';
import { applyNoahProgram, NOAH_PRESET_META } from '../db/progNoah';
import { applyOceaneProgram, OCEANE_PRESET_META } from '../db/progOceane';
import { useSettings } from '../state/settings';
import { Pressable } from '../components/ui/Pressable';
import { Flame } from '../components/gami/Flame';
import { IconChevronRight, IconFlower } from '../components/ui/Icons';
import { springPage } from '../lib/springs';

/**
 * Premier lancement : qui utilise ce téléphone, puis quel programme.
 *
 * Le profil est la première question parce qu'il décide de tout le reste —
 * l'univers, le vocabulaire, les écrans. Océane n'a pas de choix de programme
 * à faire : le sien est écrit, on l'installe et on la laisse tranquille.
 */
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<'who' | 'pitch' | 'programs'>('who');
  const [busy, setBusy] = useState(false);
  const updateSettings = useSettings((s) => s.update);
  const reduced = useReducedMotion();

  const pick = async (apply: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    await apply();
    onDone();
  };

  const chooseOceane = () => {
    updateSettings({ profile: 'oceane' });
    void pick(applyOceaneProgram);
  };

  const cards = [
    {
      key: NOAH_PRESET_META.id,
      name: NOAH_PRESET_META.name,
      daysLabel: NOAH_PRESET_META.daysLabel,
      desc: NOAH_PRESET_META.desc,
      apply: applyNoahProgram,
    },
    ...PROGRAM_PRESETS.map((p) => ({
      key: p.id,
      name: p.name,
      daysLabel: p.daysLabel,
      desc: p.desc,
      apply: () => applyPreset(p),
    })),
    {
      key: FORGE_PRESET_META.id,
      name: FORGE_PRESET_META.name,
      daysLabel: FORGE_PRESET_META.daysLabel,
      desc: FORGE_PRESET_META.desc,
      apply: applyForgePreset,
    },
  ];

  return (
    <div
      className="scroll-y flex h-full flex-col bg-canvas px-6"
      style={{
        paddingTop: 'calc(var(--safe-top) + 24px)',
        paddingBottom: 'calc(var(--safe-bottom) + 24px)',
      }}
    >
      <AnimatePresence mode="wait">
        {step === 'who' ? (
          <motion.div
            key="who"
            className="flex flex-1 flex-col justify-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -60 }}
            transition={springPage}
          >
            <h1 className="text-[30px] font-bold tracking-[-0.02em]">C’est qui ?</h1>
            <p className="mb-6 mt-1 text-[15px] leading-6 text-ink-2">
              Une app, deux programmes. Ce choix se change ensuite dans les réglages.
            </p>

            <Pressable
              className="mb-3 w-full rounded-[20px] bg-raised p-5 text-left disabled:opacity-50"
              disabled={busy}
              onClick={() => {
                updateSettings({ profile: 'noah' });
                setStep('pitch');
              }}
            >
              <div className="flex items-center gap-3">
                <Flame lit size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-[19px] font-bold">Noah</p>
                  <p className="text-[13px] leading-4.5 text-ink-2">
                    La Forge — records, colosses, programme à paliers.
                  </p>
                </div>
                <IconChevronRight size={18} className="text-ink-3" />
              </div>
            </Pressable>

            <Pressable
              className="w-full rounded-[20px] bg-raised p-5 text-left disabled:opacity-50"
              disabled={busy}
              onClick={chooseOceane}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-accent-dim text-accent">
                  <IconFlower size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[19px] font-bold">Océane</p>
                  <p className="text-[13px] leading-4.5 text-ink-2">
                    {OCEANE_PRESET_META.name} — guide, schémas, et tout expliqué.
                  </p>
                </div>
                <IconChevronRight size={18} className="text-ink-3" />
              </div>
            </Pressable>
          </motion.div>
        ) : step === 'pitch' ? (
          <motion.div
            key="pitch"
            className="flex flex-1 flex-col items-center justify-center text-center"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, x: -60 }}
            transition={springPage}
          >
            <Flame lit size={64} />
            <h1 className="mt-5 text-[34px] font-bold tracking-[-0.02em]">La Forge</h1>
            <p className="mt-3 max-w-[300px] text-[16px] leading-6 text-ink-2">
              Chaque série est un coup de marteau. Suis tes charges, bats tes records,
              terrasse le Colosse du mois — et forge un physique pièce par pièce.
            </p>
            <p className="mt-3 text-[13px] text-ink-3">
              100 % hors-ligne · tes données restent sur ton téléphone
            </p>
            <Pressable
              className="mt-10 w-full max-w-[320px] rounded-[16px] bg-accent py-4 text-[17px] font-bold text-canvas"
              onClick={() => setStep('programs')}
            >
              Allumer la forge
            </Pressable>
          </motion.div>
        ) : (
          <motion.div
            key="programs"
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springPage}
          >
            <h2 className="text-[26px] font-bold tracking-[-0.02em]">Ton programme</h2>
            <p className="mb-5 mt-1 text-[14px] text-ink-2">
              Choisis une base — tout reste modifiable ensuite, exercice par exercice.
            </p>
            <div className="flex flex-col gap-2.5">
              {cards.map((c) => (
                <Pressable
                  key={c.key}
                  className="w-full rounded-[16px] bg-raised p-4 text-left disabled:opacity-50"
                  disabled={busy}
                  onClick={() => void pick(c.apply)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[16px] font-bold">{c.name}</p>
                    <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-accent">
                      {c.daysLabel} <IconChevronRight size={14} />
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-4.5 text-ink-2">{c.desc}</p>
                </Pressable>
              ))}
            </div>
            <Pressable
              className="mt-4 w-full py-3 text-center text-[14px] font-semibold text-ink-2 disabled:opacity-50"
              disabled={busy}
              onClick={onDone}
            >
              Partir de zéro, je crée tout moi-même
            </Pressable>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
