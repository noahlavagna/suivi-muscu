import type { SessionSummary } from '../state/session';
import type { RarityTier } from '../gamification/rarity';
import { fmtDurationLong, fmtTonnage, type Unit } from './format';

/** Rendu canvas de la carte de séance, partagée via la share sheet iOS. */

const PALETTE = {
  bg: '#0C0B0A',
  raised: '#171412',
  ink: '#F5F2EE',
  ink2: 'rgba(245,242,238,0.6)',
  ink3: 'rgba(245,242,238,0.35)',
  accent: '#E8963C',
};

const TIER_BORDER: Record<RarityTier, string> = {
  fonte: 'rgba(255,255,255,0.14)',
  acier: 'rgba(232,150,60,0.45)',
  damas: 'rgba(232,150,60,0.85)',
  mythique: '#E8963C',
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function shareSummaryCard(
  summary: SessionSummary,
  unit: Unit,
  dateLabel: string,
): Promise<void> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const font = (weight: number, size: number) =>
    `${weight} ${size}px -apple-system, "SF Pro Display", Inter, sans-serif`;

  // Fond + lueur
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 200, 50, W / 2, 200, 900);
  glow.addColorStop(0, 'rgba(232,150,60,0.14)');
  glow.addColorStop(1, 'rgba(232,150,60,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Cadre de rareté
  ctx.strokeStyle = TIER_BORDER[summary.rarity.tier];
  ctx.lineWidth = summary.rarity.tier === 'mythique' ? 7 : 4;
  roundRect(ctx, 44, 44, W - 88, H - 88, 56);
  ctx.stroke();
  if (summary.rarity.tier === 'mythique') {
    ctx.strokeStyle = 'rgba(232,150,60,0.35)';
    ctx.lineWidth = 3;
    roundRect(ctx, 64, 64, W - 128, H - 128, 44);
    ctx.stroke();
  }

  // En-tête
  ctx.fillStyle = PALETTE.accent;
  ctx.font = font(700, 34);
  ctx.textAlign = 'left';
  ctx.fillText('LA FORGE', 110, 160);
  ctx.fillStyle = PALETTE.ink3;
  ctx.font = font(500, 32);
  ctx.textAlign = 'right';
  ctx.fillText(dateLabel, W - 110, 160);

  // Rareté + nom
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.accent;
  ctx.font = font(800, 44);
  ctx.fillText(summary.rarity.label.toUpperCase(), 110, 300);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = font(800, 76);
  ctx.fillText(summary.name, 110, 395, W - 220);
  ctx.fillStyle = PALETTE.ink2;
  ctx.font = `italic ${font(500, 36)}`;
  ctx.fillText(summary.rarity.line, 110, 460, W - 220);

  // Stats
  const stats: [string, string][] = [
    ['DURÉE', fmtDurationLong(summary.durationSec)],
    ['SÉRIES', `${summary.setsDone}`],
    ['TONNAGE', fmtTonnage(summary.tonnageKg, unit)],
    ['RECORDS', `${summary.prCount}`],
  ];
  stats.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 110 + col * 440;
    const y = 570 + row * 240;
    ctx.fillStyle = PALETTE.raised;
    roundRect(ctx, x, y, 400, 200, 28);
    ctx.fill();
    ctx.fillStyle = PALETTE.ink3;
    ctx.font = font(600, 28);
    ctx.fillText(label, x + 36, y + 68);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = font(800, 64);
    ctx.fillText(value, x + 36, y + 150);
  });

  // Colosse
  if (summary.boss) {
    ctx.fillStyle = PALETTE.raised;
    roundRect(ctx, 110, 1070, W - 220, 120, 28);
    ctx.fill();
    ctx.fillStyle = PALETTE.accent;
    ctx.font = font(700, 40);
    ctx.fillText(
      summary.boss.slainNow
        ? `${summary.boss.name} — TERRASSÉ`
        : `−${fmtTonnage(summary.boss.damageKg, unit)} au ${summary.boss.name}`,
      146,
      1145,
      W - 290,
    );
  }

  // Pied
  ctx.fillStyle = PALETTE.ink3;
  ctx.font = font(500, 30);
  ctx.fillText('Forgé avec Suivi Muscu', 110, H - 100);

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
  const file = new File([blob], 'seance-forge.png', { type: 'image/png' });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Ma séance' });
      return;
    } catch {
      /* partage annulé → repli téléchargement */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'seance-forge.png';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
