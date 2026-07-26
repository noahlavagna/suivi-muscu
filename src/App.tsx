import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { dbReady } from './db/db';
import { useSettings } from './state/settings';
import { useSession } from './state/session';
import { useNav } from './state/nav';
import { useSheetDepth } from './components/ui/Sheet';
import { springPage, springSheet } from './lib/springs';
import { TabBar } from './components/TabBar';
import { TodayScreen } from './screens/Today';
import { ProgressScreen } from './screens/Progress';
import { HistoryScreen } from './screens/History';
import { ProgramScreen } from './screens/Program';
import { SettingsScreen } from './screens/Settings';
import { ExerciseDetailScreen } from './screens/ExerciseDetail';
import { WorkoutDetailScreen } from './screens/WorkoutDetail';
import { TemplateEditorScreen } from './screens/TemplateEditor';
import { LibraryScreen } from './screens/Library';
import { ForgeScreen } from './screens/Forge';
import { SessionScreen } from './screens/session/SessionScreen';
import { SummarySheet } from './screens/session/SummarySheet';
import { ToastHub } from './components/ToastHub';
import { WrappedStory } from './components/gami/WrappedStory';
import { ensureWeeklyChallenge } from './gamification/challenges';
import { evaluateBadges } from './gamification/badges';
import { computeWrapped, prevMonthKey, type WrappedData } from './gamification/wrapped';
import { db } from './db/db';
import type { WrappedMeta } from './db/types';
import type { StackItem } from './state/nav';

function PushedView({ screen }: { screen: StackItem }) {
  switch (screen.type) {
    case 'exercise-detail':
      return <ExerciseDetailScreen exerciseId={screen.exerciseId} />;
    case 'workout-detail':
      return <WorkoutDetailScreen workoutId={screen.workoutId} />;
    case 'template-editor':
      return <TemplateEditorScreen templateId={screen.templateId} />;
    case 'library':
      return <LibraryScreen />;
    case 'forge':
      return <ForgeScreen />;
    case 'settings':
      return <SettingsScreen />;
  }
}

function TabShell() {
  const tab = useNav((s) => s.tab);
  const stack = useNav((s) => s.stack);
  const reduced = useReducedMotion();

  return (
    <div className="relative h-full">
      {/* Vue racine de l'onglet — recule en parallaxe sous les écrans empilés */}
      <motion.div
        className="h-full"
        animate={{ x: stack.length > 0 && !reduced ? '-25%' : '0%' }}
        transition={springPage}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={tab}
            className="h-full"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.16 }}
          >
            {tab === 'today' && <TodayScreen />}
            {tab === 'progress' && <ProgressScreen />}
            {tab === 'history' && <HistoryScreen />}
            {tab === 'program' && <ProgramScreen />}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Pile d'écrans poussés : slide horizontal, parallaxe sur la vue du dessous */}
      <AnimatePresence>
        {stack.map((item, i) => (
          <motion.div
            key={item.key}
            className="absolute inset-0 bg-canvas"
            initial={reduced ? { opacity: 0 } : { x: '100%' }}
            animate={
              reduced
                ? { opacity: 1 }
                : { x: i === stack.length - 1 ? '0%' : '-25%' }
            }
            exit={reduced ? { opacity: 0 } : { x: '100%' }}
            transition={reduced ? { duration: 0.15 } : springPage}
          >
            <PushedView screen={item} />
          </motion.div>
        ))}
      </AnimatePresence>

      <TabBar />
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [wrapped, setWrapped] = useState<WrappedData | null>(null);
  const sessionActive = useSession((s) => s.active);
  const sheetDepth = useSheetDepth((s) => s.depth);
  const reduced = useReducedMotion();

  useEffect(() => {
    void dbReady.then(async () => {
      await useSettings.getState().load();
      await useSession.getState().restore();
      setReady(true);
      // Gamification : contrat de la semaine, badges hors séance (streak…), récap mensuel
      await ensureWeeklyChallenge();
      await evaluateBadges();
      const prevMonth = prevMonthKey();
      const meta = await db.meta.get('wrapped');
      if (!(meta && 'lastMonth' in meta && meta.lastMonth >= prevMonth)) {
        const data = await computeWrapped(prevMonth);
        if (data && !useSession.getState().active) setWrapped(data);
      }
    });
  }, []);

  const closeWrapped = () => {
    if (wrapped) {
      const meta: WrappedMeta = { id: 'wrapped', lastMonth: wrapped.month };
      void db.meta.put(meta);
    }
    setWrapped(null);
  };

  if (!ready) return null;

  return (
    <>
      {/* Le shell recule quand une sheet est ouverte (effet de profondeur iOS) */}
      <motion.div
        className="h-full overflow-hidden bg-canvas"
        animate={
          sheetDepth > 0 && !reduced
            ? { scale: 0.96, borderRadius: 24 }
            : { scale: 1, borderRadius: 0 }
        }
        transition={springSheet}
        style={{ transformOrigin: '50% 30%' }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {sessionActive ? (
            <motion.div
              key="session"
              className="h-full"
              initial={reduced ? { opacity: 0 } : { y: '100%' }}
              animate={reduced ? { opacity: 1 } : { y: 0 }}
              exit={reduced ? { opacity: 0 } : { y: '100%' }}
              transition={reduced ? { duration: 0.2 } : springSheet}
            >
              <SessionScreen />
            </motion.div>
          ) : (
            <motion.div
              key="tabs"
              className="h-full"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <TabShell />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <ToastHub />
      <SummarySheet />
      {wrapped && <WrappedStory data={wrapped} onClose={closeWrapped} />}
    </>
  );
}
