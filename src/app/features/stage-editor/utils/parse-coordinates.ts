/**
 * Detecta dos números tipus lat/lng al text sencer.
 * Separadors entre els dos números: coma, punt i coma, o espais (un o més).
 * El punt decimal dins de cada nombre és `.` o `,`; el punt NO es fa servir com a separador entre lat i lng (evita ambigüitats).
 * Heurística Iberia: si un valor és ~35–45 i l’altre ~–10–5, s’ordena com a lat/lng.
 */
export function tryParseCoordinates(input: string): { lat: number; lng: number } | null {
  const t = input.trim();
  if (!t) return null;

  const num = String.raw`-?\d+(?:[.,]\d+)?`;
  const m = t.match(new RegExp(`^(${num})\\s*(?:[,;]|\\s+)\\s*(${num})\\s*$`));
  if (!m) return null;

  const a = parseFloat(m[1].replace(',', '.'));
  const b = parseFloat(m[2].replace(',', '.'));
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  if (Math.abs(a) > 90 || Math.abs(b) > 180) return null;

  const aLooksLat = a >= 35 && a <= 45;
  const bLooksLat = b >= 35 && b <= 45;
  const aLooksLngIberia = Math.abs(a) <= 10;
  const bLooksLngIberia = Math.abs(b) <= 10;

  if (aLooksLat && bLooksLngIberia && !bLooksLat) {
    return { lat: a, lng: b };
  }
  if (bLooksLat && aLooksLngIberia && !aLooksLat) {
    return { lat: b, lng: a };
  }

  return { lat: a, lng: b };
}
