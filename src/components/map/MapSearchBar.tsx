import * as React from 'react'
import { Loader2, Search } from 'lucide-react'
import type L from 'leaflet'
import { cn } from '@/lib/utils'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
}

interface MapSearchBarProps {
  mapRef: React.RefObject<L.Map | null>
}

export function MapSearchBar({ mapRef }: MapSearchBarProps) {
  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<NominatimResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const wrapperRef = React.useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault()
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setOpen(false)
    try {
      const url =
        `https://nominatim.openstreetmap.org/search` +
        `?q=${encodeURIComponent(q)}` +
        `&format=json&limit=6&countrycodes=br` +
        `&accept-language=pt-BR`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR' },
      })
      const data: NominatimResult[] = await res.json()
      setResults(data)
      setOpen(data.length > 0)
    } catch {
      // ignora erros de rede silenciosamente
    } finally {
      setLoading(false)
    }
  }

  function irPara(result: NominatimResult) {
    const map = mapRef.current
    if (!map) return
    map.flyTo([parseFloat(result.lat), parseFloat(result.lon)], 13, {
      animate: true,
      duration: 1.2,
    })
    // Mostra só o nome principal (antes da primeira vírgula)
    setQuery(result.display_name.split(',')[0])
    setOpen(false)
    setResults([])
  }

  return (
    <div
      ref={wrapperRef}
      className="absolute left-12 top-3 z-[1000] w-72"
      // Impede que cliques na barra de pesquisa propaguem para o mapa (drag, zoom etc.)
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <form onSubmit={buscar} className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder="Buscar cidade…"
            className="h-9 w-full rounded-md border border-input bg-card px-3 pr-8 text-sm shadow-md placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          {loading && (
            <Loader2 className="absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-md hover:bg-primary/90 disabled:opacity-50"
          disabled={loading}
        >
          <Search className="size-4" />
        </button>
      </form>

      {open && results.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-md border bg-card shadow-lg">
          {results.map((r) => {
            const [nome, ...resto] = r.display_name.split(',')
            const detalhe = resto.slice(0, 2).join(',').trim()
            return (
              <li key={r.place_id}>
                <button
                  type="button"
                  onClick={() => irPara(r)}
                  className={cn(
                    'flex w-full flex-col px-3 py-2 text-left text-sm',
                    'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <span className="font-medium">{nome}</span>
                  {detalhe && (
                    <span className="text-xs text-muted-foreground">{detalhe}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {open && results.length === 0 && !loading && (
        <div className="mt-1 rounded-md border bg-card px-3 py-2 text-sm text-muted-foreground shadow-lg">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  )
}
