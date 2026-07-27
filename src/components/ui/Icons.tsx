import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 22, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconChevronLeft = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15 4.5 7.5 12l7.5 7.5" />
  </Icon>
);
export const IconChevronRight = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 4.5 7.5 7.5L9 19.5" />
  </Icon>
);
export const IconPlus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const IconMinus = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);
export const IconCheck = (p: IconProps) => (
  <Icon {...p} strokeWidth={2.2}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Icon>
);
export const IconX = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);
export const IconTimer = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="13" r="7.5" />
    <path d="M12 9.5V13l2.5 2M10 2.5h4" />
  </Icon>
);
export const IconTrophy = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
    <path d="M8 5H5.5a0 0 0 0 0 0 0c0 2.5 1 4.5 2.5 4.5M16 5h2.5c0 2.5-1 4.5-2.5 4.5M12 13v4m-3.5 3h7m-5.5-3h4l.5 3h-5l.5-3Z" />
  </Icon>
);
export const IconDumbbell = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 12h8" />
    <rect x="4.5" y="8" width="3" height="8" rx="1.4" />
    <rect x="16.5" y="8" width="3" height="8" rx="1.4" />
    <rect x="1.5" y="9.5" width="2" height="5" rx="1" />
    <rect x="20.5" y="9.5" width="2" height="5" rx="1" />
  </Icon>
);
export const IconChart = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 19.5h16" />
    <path d="m5 14 4-4.5 3.5 3L18 6" />
    <path d="M18 9.5V6h-3.5" />
  </Icon>
);
export const IconHistory = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l2.8 2.2" />
  </Icon>
);
export const IconCalendar = (p: IconProps) => (
  <Icon {...p}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
    <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
  </Icon>
);
export const IconGear = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 2.8 13 5a7.2 7.2 0 0 1 2.6 1.1l2.3-.8 1.8 3.1-1.8 1.7a7.3 7.3 0 0 1 0 2.8l1.8 1.7-1.8 3.1-2.3-.8A7.2 7.2 0 0 1 13 19l-1 2.2L11 19a7.2 7.2 0 0 1-2.6-1.1l-2.3.8-1.8-3.1 1.8-1.7a7.3 7.3 0 0 1 0-2.8L4.3 9.4l1.8-3.1 2.3.8A7.2 7.2 0 0 1 11 5l1-2.2Z" />
  </Icon>
);
export const IconGrip = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 9h10M7 15h10" />
  </Icon>
);
export const IconTrash = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 7h14M10 7V5.5A1.5 1.5 0 0 1 11.5 4h1A1.5 1.5 0 0 1 14 5.5V7m4 0-1 12.5a1.8 1.8 0 0 1-1.8 1.5H8.8A1.8 1.8 0 0 1 7 19.5L6 7" />
  </Icon>
);
export const IconPencil = (p: IconProps) => (
  <Icon {...p}>
    <path d="m14.5 5 4.5 4.5L8.5 20H4v-4.5L14.5 5Z" />
    <path d="m12.5 7 4.5 4.5" />
  </Icon>
);
export const IconNote = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v9L14.5 19h-7A2.5 2.5 0 0 1 5 16.5v-11Z" />
    <path d="M14.5 19v-4.5H19" />
  </Icon>
);
export const IconSearch = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </Icon>
);
export const IconSkip = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 5.5v13l8.5-6.5L6 5.5Z" />
    <path d="M17.5 5.5v13" />
  </Icon>
);
export const IconDownload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3.5V15m0 0 4-4m-4 4-4-4M4.5 18.5h15" />
  </Icon>
);
export const IconUpload = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 15V3.5m0 0 4 4m-4-4-4 4M4.5 18.5h15" />
  </Icon>
);
export const IconMoon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </Icon>
);
export const IconShield = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
    <path d="M12 3v18" />
  </Icon>
);
export const IconHelmet = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12a7 7 0 0 1 14 0v6.5h-3.5V14h-7v4.5H5V12Z" />
    <path d="M12 5v5.5M9 21h6" />
  </Icon>
);
export const IconArmor = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3.5 5 6.5V13l3 2v5.5h8V15l3-2V6.5l-3-3-2.5 2h-3L8 3.5Z" />
    <path d="M12 8.5v12" />
  </Icon>
);
export const IconBoot = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3h6v9l5 4.5V20H8l-2-2V3h2Z" />
    <path d="M8 12h6M12 20v-3.5" />
  </Icon>
);
export const IconGauntlet = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 3.5h8V12l2 2-3 6.5H9L6 14l2-2V3.5Z" />
    <path d="M8 8h8M12 8v6" />
  </Icon>
);
export const IconWrench = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 7.5a4.5 4.5 0 0 1 5.7-4.3l-3 3 .8 2.8 2.8.8 3-3A4.5 4.5 0 0 1 14 7.5Z" transform="scale(0.86) translate(1.5 1.5)" />
    <path d="m13.5 10.5-8 8a2.1 2.1 0 0 0 3 3l8-8" />
  </Icon>
);
export const IconSkull = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3 5.6V20a1.5 1.5 0 0 0 1.5 1.5h6A1.5 1.5 0 0 0 16.5 20v-3.9c1.7-1.2 3-3 3-5.6A7.5 7.5 0 0 0 12 3Z" />
    <circle cx="9" cy="11" r="1.4" />
    <circle cx="15" cy="11" r="1.4" />
    <path d="M12 14.5v2.5" />
  </Icon>
);
export const IconShare = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 14.5V3.5m0 0 3.5 3.5M12 3.5 8.5 7" />
    <path d="M6 11.5H5A1.5 1.5 0 0 0 3.5 13v6A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5h-1" />
  </Icon>
);
export const IconCloud = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.7 1.46A3.75 3.75 0 0 1 17.5 18.5H7Z" />
  </Icon>
);
export const IconCrown = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 8.5 7.5 12l4.5-6 4.5 6L20 8.5 18.5 18h-13L4 8.5Z" />
    <path d="M5.5 21h13" />
  </Icon>
);
export const IconHammer = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13.5 6 5 14.5 8.5 18l8.5-8.5" />
    <path d="M11 3.5 20.5 8l-2 3.5L9 7l2-3.5Z" />
  </Icon>
);
export const IconAnvil = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7h11c0 3.5 2.5 5 5 5v1.5c-4 0-6.5-1-8-3v4l2.5 3v1.5h-9V17.5L8 14.5v-4C6 10.5 4 9.5 4 7Z" />
  </Icon>
);
export const IconStar = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3.5 2.5 5.3 5.5.7-4 4 1 5.7L12 16.5l-5 2.7 1-5.7-4-4 5.5-.7L12 3.5Z" />
  </Icon>
);
export const IconZap = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 2.5 5 13.5h5.5L11 21.5l8-11h-5.5l-.5-8Z" />
  </Icon>
);
export const IconSunrise = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v3.5M5 8l1.8 1.8M19 8l-1.8 1.8M3 17.5h3m12 0h3M7.5 17.5a4.5 4.5 0 0 1 9 0" />
    <path d="M4 21h16" />
  </Icon>
);
export const IconMedal = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="15" r="5" />
    <path d="m8.5 11 -3-7.5h4L12 8l2.5-4.5h4l-3 7.5" />
  </Icon>
);
export const IconScroll = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7 3.5h11.5A2.5 2.5 0 0 0 16 6v12.5a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V17H14" />
    <path d="M7 3.5A2.5 2.5 0 0 0 4.5 6v11M8 8.5h5M8 12h5" />
  </Icon>
);
export const IconFlame = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 21c-3.9 0-6.5-2.5-6.5-6 0-2.6 1.7-4.6 3-6.3.9-1.2 1.9-2.6 2.3-4.7 2.5 1.6 7.7 6.1 7.7 11 0 3.5-2.6 6-6.5 6Z" />
    <path d="M12 21c-1.8 0-3-1.2-3-2.9 0-1.3 1-2.5 1.7-3.4.4-.5.8-1 1-1.7 1.2.9 3.3 2.8 3.3 5.1 0 1.7-1.2 2.9-3 2.9Z" />
  </Icon>
);
