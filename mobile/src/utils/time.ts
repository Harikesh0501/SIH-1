/**
 * Indian Standard Time (IST - Asia/Kolkata) Utility for Mobile
 * Guarantees zero UTC drift across all defense telemetry logs & passes.
 */

export function normalizeDateInput(dateInput: any): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  let s = String(dateInput).trim();
  if (s.includes(' ') && !s.includes('T')) {
    s = s.replace(' ', 'T');
  }
  // Attach +05:30 if string has no timezone offset
  if (!s.endsWith('Z') && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
    s += '+05:30';
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export function formatMilitaryDate(dateInput: any): string {
  if (!dateInput) return 'N/A';
  const d = normalizeDateInput(dateInput);
  if (!d) return String(dateInput);

  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';
  const day = getPart('day');
  const month = getPart('month').toUpperCase();
  const year = getPart('year');
  const hour = getPart('hour');
  const minute = getPart('minute');

  return `${day} ${month} ${year}, ${hour}:${minute} HRS IST`;
}

export function formatISTDateTime(dateInput: any): string {
  if (!dateInput) return '--';
  const d = normalizeDateInput(dateInput);
  if (!d) return String(dateInput);

  return (
    d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' IST'
  );
}

export function formatISTTime(dateInput: any = new Date()): string {
  const d = normalizeDateInput(dateInput);
  if (!d) return '--:--:-- IST';

  return (
    d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }) + ' IST'
  );
}

export function getIstIsoString(): string {
  const now = new Date();
  const istOffset = 330 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  return istTime.toISOString().replace('Z', '+05:30');
}
