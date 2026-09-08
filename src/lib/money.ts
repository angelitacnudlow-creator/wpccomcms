// DB prices are stored as integer poysha (BDT * 100) to avoid float
// rounding. Every admin form works in whole/decimal Taka for the user and
// converts at the boundary — these two functions are that boundary.
export function bdtToPoysha(bdt: number): number {
  return Math.round(bdt * 100);
}

export function poyshaToBdt(poysha: number): number {
  return poysha / 100;
}

export function formatBdt(poysha: number): string {
  return `৳${poyshaToBdt(poysha).toFixed(2)}`;
}
