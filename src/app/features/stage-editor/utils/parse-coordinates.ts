/**
 * Detecta dos números tipus lat/lng al text (separadors: coma, punt i coma, espais).
 * Heurística Iberia: si un valor és ~35–45 i l’altre ~–10–5, s’ordena com a lat/lng.
 */
export function tryParseCoordinates(input: string): { lat: number; lng: number } | null {
  const t = input.trim();
  if (!t) return null;

  const m = t.match(
    /^(-?\d{1,3}(?:[.,]\d+)?)\s*[,;\s]\s*(-?\d{1,3}(?:[.,]\d+)?)/,
  );
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
