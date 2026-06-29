import type { LatLng } from './types'

const EARTH_RADIUS = 6378137 // raio da Terra em metros (WGS-84)

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Calcula a área de um polígono geográfico em metros quadrados,
 * usando a fórmula de área esférica (mesma abordagem do google.maps.geometry).
 */
export function poligonoAreaM2(pontos: LatLng[]): number {
  const n = pontos.length
  if (n < 3) return 0

  let area = 0
  for (let i = 0; i < n; i++) {
    const p1 = pontos[i]
    const p2 = pontos[(i + 1) % n]
    area +=
      toRad(p2.lng - p1.lng) *
      (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)))
  }
  area = (area * EARTH_RADIUS * EARTH_RADIUS) / 2
  return Math.abs(area)
}

/** Converte a área de um polígono geográfico para hectares. */
export function poligonoHectares(pontos: LatLng[]): number {
  return poligonoAreaM2(pontos) / 10_000
}

/** Centro (centroide simples) de um polígono — útil para posicionar rótulos/marcadores. */
export function poligonoCentro(pontos: LatLng[]): LatLng {
  if (pontos.length === 0) return { lat: 0, lng: 0 }
  const soma = pontos.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  )
  return {
    lat: soma.lat / pontos.length,
    lng: soma.lng / pontos.length,
  }
}
