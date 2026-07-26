const KG_PER_LB = 0.45359237;

export type Unit = 'kg' | 'lb';

export const kgToUnit = (kg: number, unit: Unit): number =>
  unit === 'kg' ? kg : kg / KG_PER_LB;

export const unitToKg = (value: number, unit: Unit): number =>
  unit === 'kg' ? value : value * KG_PER_LB;

/** 82.5 → "82,5" · 80 → "80" (affichage fr, au plus 1 décimale) */
export function fmtNumber(value: number, maxDecimals = 1): string {
  const rounded =
    Math.round(value * 10 ** maxDecimals) / 10 ** maxDecimals;
  return rounded.toLocaleString('fr-FR', { maximumFractionDigits: maxDecimals });
}

export const fmtWeight = (kg: number, unit: Unit): string =>
  `${fmtNumber(kgToUnit(kg, unit))} ${unit}`;

/** Tonnage compact : 12 480 → "12,5 t" en kg, sinon valeur brute */
export function fmtTonnage(kg: number, unit: Unit): string {
  const v = kgToUnit(kg, unit);
  if (unit === 'kg' && v >= 1000) return `${fmtNumber(v / 1000, 1)} t`;
  return `${fmtNumber(Math.round(v), 0)} ${unit}`;
}

/** 95 → "1:35" */
export function fmtTimer(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

/** 3725s → "1 h 02" · 310s → "5 min" */
export function fmtDurationLong(totalSec: number): string {
  const m = Math.round(totalSec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return `${h} h ${String(m % 60).padStart(2, '0')}`;
}
