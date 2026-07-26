import { motion } from 'framer-motion';
import { useNav, type Tab } from '../state/nav';
import { springMicro } from '../lib/springs';
import { unlockAudio } from '../lib/sound';
import { IconCalendar, IconChart, IconDumbbell, IconHistory } from './ui/Icons';

const TABS: { id: Tab; label: string; icon: typeof IconDumbbell }[] = [
  { id: 'today', label: 'Aujourd’hui', icon: IconDumbbell },
  { id: 'progress', label: 'Progression', icon: IconChart },
  { id: 'history', label: 'Historique', icon: IconHistory },
  { id: 'program', label: 'Programme', icon: IconCalendar },
];

export function TabBar() {
  const tab = useNav((s) => s.tab);
  const setTab = useNav((s) => s.setTab);
  return (
    <nav
      className="glass absolute inset-x-0 bottom-0 z-40"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = id === tab;
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.92 }}
              transition={springMicro}
              className="flex flex-1 flex-col items-center gap-0.5 pb-1.5 pt-2.5"
              onClick={() => {
                unlockAudio();
                setTab(id);
              }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={24} className={active ? 'text-accent' : 'text-ink-3'} />
              <span
                className={`text-[10px] font-medium ${active ? 'text-accent' : 'text-ink-3'}`}
              >
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
