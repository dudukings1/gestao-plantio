import * as React from 'react'
import { MapContainer, Polygon, Tooltip, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css'
// Importar o JS garante que o module augmentation do geoman seja aplicado ao tipo L.Map
import '@geoman-io/leaflet-geoman-free'
import type { Area, LatLng } from '@/lib/types'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/lib/maps'
import { formatCurrency } from '@/lib/utils'
import { MapSearchBar } from './MapSearchBar'

interface PlantioMapProps {
  areas: Area[]
  /** Quando true, ativa o modo de desenho de polígono. */
  drawing?: boolean
  /** Chamado quando o usuário termina de desenhar um polígono. */
  onPolygonComplete?: (path: LatLng[]) => void
  selectedAreaId?: string | null
  onSelectArea?: (id: string) => void
  /** Retorna o total gasto em uma área — usado para exibir o rótulo no polígono. */
  getTotal?: (areaId: string) => number
  className?: string
}

// Reenquadra o mapa sempre que novas áreas são adicionadas.
function FitBoundsControl({ areas }: { areas: Area[] }) {
  const map = useMap()
  const prev = React.useRef(0)

  React.useEffect(() => {
    if (areas.length === 0 || areas.length === prev.current) return
    prev.current = areas.length
    const all = areas.flatMap((a) => a.poligono)
    if (all.length === 0) return
    map.fitBounds(
      L.latLngBounds(all.map((p) => L.latLng(p.lat, p.lng))),
      { padding: [20, 20] }
    )
  }, [areas, map])

  return null
}

// Captura a instância do mapa e a expõe via ref (para componentes fora do MapContainer).
function CaptureMap({ mapRef }: { mapRef: React.MutableRefObject<L.Map | null> }) {
  const map = useMap()
  React.useEffect(() => {
    mapRef.current = map
  }, [map, mapRef])
  return null
}

// Ativa o modo de desenho de polígono via leaflet.pm (geoman).
function DrawingControl({
  onPolygonComplete,
}: {
  onPolygonComplete: (path: LatLng[]) => void
}) {
  const map = useMap()

  React.useEffect(() => {
    map.pm.enableDraw('Polygon', {
      snappable: false,
      templineStyle: { color: '#16a34a' },
      hintlineStyle: { color: '#16a34a', dashArray: '5,5' },
      pathOptions: { color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.3 },
    })

    function handleCreate(e: { layer: L.Layer }) {
      const polygon = e.layer as L.Polygon
      const ring = polygon.getLatLngs()[0]
      const path = (Array.isArray(ring) ? ring : [ring]).map((ll) => {
        const latLng = ll as L.LatLng
        return { lat: latLng.lat, lng: latLng.lng }
      })
      map.removeLayer(polygon)
      onPolygonComplete(path)
    }

    map.on('pm:create', handleCreate)

    return () => {
      map.pm.disableDraw()
      map.off('pm:create', handleCreate)
    }
  }, [map, onPolygonComplete])

  return null
}

export function PlantioMap({
  areas,
  drawing = false,
  onPolygonComplete,
  selectedAreaId,
  onSelectArea,
  getTotal,
  className,
}: PlantioMapProps) {
  const mapRef = React.useRef<L.Map | null>(null)

  return (
    <div className={className} style={{ isolation: 'isolate', position: 'relative' }}>
      {/* Barra de busca de cidades posicionada sobre o mapa */}
      <MapSearchBar mapRef={mapRef} />

      <MapContainer
        center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl
      >
        <CaptureMap mapRef={mapRef} />

        {/* Satélite ESRI — gratuito, sem chave */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, GIS User Community"
          maxZoom={19}
        />
        {/* Rótulos ESRI (cidades, rodovias) por cima do satélite */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          opacity={1}
        />

        <FitBoundsControl areas={areas} />

        {drawing && onPolygonComplete && (
          <DrawingControl onPolygonComplete={onPolygonComplete} />
        )}

        {areas.map((area) => {
          const total = getTotal?.(area.id) ?? 0
          return (
            <Polygon
              key={area.id}
              positions={area.poligono.map((p) => [p.lat, p.lng] as [number, number])}
              eventHandlers={{ click: () => onSelectArea?.(area.id) }}
              pathOptions={{
                color: area.cor,
                fillColor: area.cor,
                fillOpacity: selectedAreaId === area.id ? 0.5 : 0.3,
                weight: selectedAreaId === area.id ? 4 : 2,
              }}
            >
              <Tooltip
                permanent
                direction="center"
                className="area-label"
                interactive={false}
              >
                <div style={{ fontWeight: 700, fontSize: '13px' }}>{area.nome}</div>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>
                  {formatCurrency(total)}
                </div>
              </Tooltip>
            </Polygon>
          )
        })}
      </MapContainer>
    </div>
  )
}
