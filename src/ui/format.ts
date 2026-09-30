export function formatMoney(credits: number): string {
  return `${Math.round(credits).toLocaleString('en-US')} cr`;
}

export function formatPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}
