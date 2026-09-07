import type { ComponentType, SVGProps } from 'react';
import {
  IconAnvil,
  IconArmor,
  IconBoot,
  IconCrown,
  IconDumbbell,
  IconFlame,
  IconFlower,
  IconGauntlet,
  IconHeart,
  IconLeaf,
  IconSeed,
  IconSparkle,
  IconHammer,
  IconHelmet,
  IconMedal,
  IconMoon,
  IconScroll,
  IconShield,
  IconSkull,
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
  shield: IconShield,
  helmet: IconHelmet,
  armor: IconArmor,
  boot: IconBoot,
  gauntlet: IconGauntlet,
  skull: IconSkull,
  // Profil Océane
  flower: IconFlower,
  leaf: IconLeaf,
  seed: IconSeed,
  sparkle: IconSparkle,
  heart: IconHeart,
};

export function BadgeIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const C = MAP[icon] ?? IconStar;
  return <C size={size} />;
}
