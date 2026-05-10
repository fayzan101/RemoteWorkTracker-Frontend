/** Pakistani Rupee formatting for salaries, payroll, and dashboard summaries. */

export function formatPkr(
  value: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  if (!Number.isFinite(value)) {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(0);
  }
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: opts?.minimumFractionDigits ?? 0,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
  }).format(value);
}

/** Short amounts for dashboard cards (e.g. Rs 12.5K). */
export function formatPkrCompact(n: number): string {
  if (!Number.isFinite(n)) return formatPkr(0, { maximumFractionDigits: 0 });
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}Rs ${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}Rs ${(abs / 1_000).toFixed(1)}K`;
  return formatPkr(n, { maximumFractionDigits: 0 });
}
