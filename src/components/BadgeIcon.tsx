import type { ComponentType, SVGProps } from 'react';
import {
  IconAnvil,
  IconCrown,
  IconDumbbell,
  IconFlame,
  IconHammer,
  IconMedal,
  IconMoon,
  IconScroll,
  IconStar,
  IconSunrise,
  IconTimer,
  IconTrophy,
  IconZap,
} from './ui/Icons';

const MAP: Record<string, ComponentType<SVGProps<SVGSVGElement> & { size?: number }>> = {
  flame: IconFlame,
  medal: IconMedal,
  zap: IconZap,
  anvil: IconAnvil,
  crown: IconCrown,
  hammer: IconHammer,
  dumbbell: IconDumbbell,
  sunrise: IconSunrise,
  moon: IconMoon,
  timer: IconTimer,
  star: IconStar,
  scroll: IconScroll,
  trophy: IconTrophy,
};

export function BadgeIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const C = MAP[icon] ?? IconStar;
  return <C size={size} />;
}
