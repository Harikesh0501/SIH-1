import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind class names cleanly with clsx and twMerge.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Normalizes any date input (Date object, ISO string, SQL timestamp)
 * ensuring it resolves properly to Indian Standard Time (Asia/Kolkata).
 */
export function normalizeDateInput(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  let s = String(dateInput).trim();
  if (s.includes(' ') && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }
  // If no timezone offset (+/-) or Z, attach +05:30 (IST)
  if (!s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
    s += '+05:30';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format timestamp to Indian Standard Time (IST) military format:
 * e.g., "24 SEP 2026, 22:30 HRS IST"
 */
export function formatMilitaryDate(dateInput) {
  if (!dateInput) return "N/A";
  const d = normalizeDateInput(dateInput);
  if (!d) return String(dateInput);
  
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const parts = formatter.formatToParts(d);
  const getPart = (type) => parts.find((p) => p.type === type)?.value || '';
  const day = getPart('day');
  const month = getPart('month').toUpperCase();
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return `${day} ${month} ${year}, ${hour}:${minute} HRS IST`;
}

/**
 * Format timestamp to Indian Standard Time (IST) readable format:
 * e.g., "24 Sept 2026, 22:30:15 IST"
 */
export function formatISTDateTime(dateInput) {
  if (!dateInput) return "--";
  const d = normalizeDateInput(dateInput);
  if (!d) return String(dateInput);

  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) + ' IST';
}

/**
 * Format time to Indian Standard Time (IST):
 * e.g., "22:30:15 IST"
 */
export function formatISTTime(dateInput = new Date()) {
  const d = normalizeDateInput(dateInput);
  if (!d) return "--:--:-- IST";

  return d.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }) + ' IST';
}

/**
 * Format score to 1 decimal place or percentage.
 */
export function formatScore(num) {
  if (num === null || num === undefined || isNaN(num)) return "0.0";
  return Number(num).toFixed(1);
}

/**
 * Get color tokens and human labels for risk tiers.
 */
export function getRiskTierConfig(tier) {
  const normalized = (tier || "").toLowerCase().trim();
  switch (normalized) {
    case "resilient":
      return {
        label: "Resilient",
        labelHi: "सुरक्षित एवं सक्षम",
        color: "text-emerald-700",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
        dot: "bg-emerald-500",
        barColor: "bg-emerald-500",
        range: "0 - 45",
      };
    case "fatigued":
      return {
        label: "Fatigued",
        labelHi: "शारीरिक थकान",
        color: "text-amber-700",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-800 border-amber-300",
        dot: "bg-amber-500",
        barColor: "bg-amber-500",
        range: "46 - 65",
      };
    case "vulnerable":
      return {
        label: "Vulnerable",
        labelHi: "संवेदनशील / जोखिम",
        color: "text-orange-700",
        bg: "bg-orange-50",
        border: "border-orange-200",
        badge: "bg-orange-100 text-orange-800 border-orange-300",
        dot: "bg-orange-500",
        barColor: "bg-orange-500",
        range: "66 - 79",
      };
    case "critical":
      return {
        label: "Critical",
        labelHi: "अति संवेदनशील / संकट",
        color: "text-red-700",
        bg: "bg-red-50",
        border: "border-red-200",
        badge: "bg-red-100 text-red-800 border-red-300",
        dot: "bg-red-600",
        barColor: "bg-red-600",
        range: "80 - 100",
      };
    default:
      return {
        label: tier || "Unknown",
        labelHi: "अज्ञात",
        color: "text-slate-700",
        bg: "bg-slate-50",
        border: "border-slate-200",
        badge: "bg-slate-100 text-slate-800 border-slate-300",
        dot: "bg-slate-400",
        barColor: "bg-slate-400",
        range: "N/A",
      };
  }
}
