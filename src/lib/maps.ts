/** Centro padrão do mapa quando ainda não há áreas (Brasil central). */
export const DEFAULT_CENTER = { lat: -15.78, lng: -47.93 }
export const DEFAULT_ZOOM = 5

/** Paleta de cores sugeridas para novas áreas. */
export const CORES_AREAS = [
  '#16a34a',
  '#2563eb',
  '#f59e0b',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
]

function hexParaRgb(hex: string) {
  const v = hex.replace('#', '')
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

function interpolarCor(a: string, b: string, t: number): string {
  const pa = hexParaRgb(a)
  const pb = hexParaRgb(b)
  const r = Math.round(pa.r + (pb.r - pa.r) * t)
  const g = Math.round(pa.g + (pb.g - pa.g) * t)
  const bch = Math.round(pa.b + (pb.b - pa.b) * t)
  return `rgb(${r}, ${g}, ${bch})`
}

/**
 * Cor de um mapa de calor verde→amarelo→vermelho.
 * `t` é a posição relativa (0 = mais barato, 1 = mais caro).
 */
export function corMapaDeCalor(t: number): string {
  const clamp = Math.max(0, Math.min(1, t))
  if (clamp < 0.5) return interpolarCor('#16a34a', '#eab308', clamp / 0.5)
  return interpolarCor('#eab308', '#dc2626', (clamp - 0.5) / 0.5)
}
