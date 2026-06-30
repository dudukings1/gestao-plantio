import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Flame, MapPlus, Move, Pencil, Plus, Trash2, X } from 'lucide-react'
import { PlantioMap } from '@/components/map/PlantioMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useData } from '@/store/DataContext'
import { CORES_AREAS, corMapaDeCalor } from '@/lib/maps'
import { poligonoHectares } from '@/lib/geo'
import { cn, formatCurrency } from '@/lib/utils'
import type { LatLng } from '@/lib/types'

export function MapaPage() {
  const navigate = useNavigate()
  const { areas, adicionarArea, atualizarArea, removerArea, totalPorArea } = useData()
  const confirm = useConfirm()

  const [drawing, setDrawing] = React.useState(false)
  const [pendingPath, setPendingPath] = React.useState<LatLng[] | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [editingAreaId, setEditingAreaId] = React.useState<string | null>(null)
  const [heatmapAtivo, setHeatmapAtivo] = React.useState(false)

  // Form da nova área
  const [nome, setNome] = React.useState('')
  const [cultura, setCultura] = React.useState('')
  const [cor, setCor] = React.useState(CORES_AREAS[0])
  const [orcamento, setOrcamento] = React.useState('')

  // Edição de orçamento inline por área
  const [editandoOrcamentoId, setEditandoOrcamentoId] = React.useState<string | null>(null)
  const [orcamentoEdit, setOrcamentoEdit] = React.useState('')

  function iniciarDesenho() {
    setSelectedId(null)
    setPendingPath(null)
    setEditingAreaId(null)
    setDrawing(true)
  }

  function cancelarDesenho() {
    setDrawing(false)
    setPendingPath(null)
    setNome('')
    setCultura('')
    setOrcamento('')
    setCor(CORES_AREAS[0])
  }

  function onPolygonComplete(path: LatLng[]) {
    setPendingPath(path)
    setDrawing(false)
    setNome(`Área ${areas.length + 1}`)
    setCor(CORES_AREAS[areas.length % CORES_AREAS.length])
  }

  function salvarArea(e: React.FormEvent) {
    e.preventDefault()
    if (!pendingPath) return
    adicionarArea({
      nome: nome.trim() || `Área ${areas.length + 1}`,
      cor,
      poligono: pendingPath,
      cultura: cultura.trim() || undefined,
      orcamento: orcamento ? Number.parseFloat(orcamento) : undefined,
    })
    cancelarDesenho()
  }

  function iniciarEdicaoPoligono(areaId: string) {
    setDrawing(false)
    setPendingPath(null)
    setSelectedId(areaId)
    setEditingAreaId(areaId)
  }

  function onPolygonEdit(areaId: string, path: LatLng[]) {
    atualizarArea(areaId, { poligono: path })
  }

  function salvarOrcamento(areaId: string) {
    const val = Number.parseFloat(orcamentoEdit)
    atualizarArea(areaId, { orcamento: Number.isFinite(val) && val > 0 ? val : undefined })
    setEditandoOrcamentoId(null)
  }

  const hectaresPendente = pendingPath ? poligonoHectares(pendingPath) : 0

  const heatColors = React.useMemo(() => {
    if (!heatmapAtivo) return undefined
    const custos = areas
      .filter((a) => a.hectares > 0)
      .map((a) => totalPorArea(a.id) / a.hectares)
    if (custos.length === 0) return undefined
    const min = Math.min(...custos)
    const max = Math.max(...custos)
    const mapa: Record<string, string> = {}
    for (const a of areas) {
      if (a.hectares <= 0) continue
      const custo = totalPorArea(a.id) / a.hectares
      const t = max > min ? (custo - min) / (max - min) : 0
      mapa[a.id] = corMapaDeCalor(t)
    }
    return mapa
  }, [heatmapAtivo, areas, totalPorArea])

  return (
    <div className="flex h-[calc(100svh-2rem)] flex-col gap-4 md:h-[calc(100svh-3rem)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Mapa das áreas</h1>
          <p className="text-sm text-muted-foreground">
            {areas.length} área(s) cadastrada(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={heatmapAtivo ? 'secondary' : 'outline'}
            onClick={() => setHeatmapAtivo((v) => !v)}
            title="Colorir áreas pelo custo por hectare"
          >
            <Flame /> Mapa de calor
          </Button>
          {drawing ? (
            <Button variant="outline" onClick={cancelarDesenho}>
              <X /> Cancelar desenho
            </Button>
          ) : (
            <Button onClick={iniciarDesenho} disabled={!!pendingPath || !!editingAreaId}>
              <MapPlus /> Nova área
            </Button>
          )}
        </div>
      </div>

      {heatmapAtivo && (
        <div className="flex items-center gap-3 rounded-md border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span>Custo/ha:</span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-full" style={{ backgroundColor: corMapaDeCalor(0) }} /> menor
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-full" style={{ backgroundColor: corMapaDeCalor(0.5) }} /> médio
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded-full" style={{ backgroundColor: corMapaDeCalor(1) }} /> maior
          </span>
        </div>
      )}

      {drawing && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          Clique no mapa para marcar os cantos do talhão. Para fechar a área,
          clique novamente no primeiro ponto.
        </div>
      )}

      {editingAreaId && (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          <span>Arraste os vértices do polígono para ajustar o formato da área.</span>
          <Button size="sm" onClick={() => setEditingAreaId(null)}>
            <Check /> Concluir edição
          </Button>
        </div>
      )}

      <div className="flex flex-1 gap-4 overflow-hidden">
        <PlantioMap
          className="h-full flex-1 overflow-hidden rounded-lg border"
          areas={areas}
          drawing={drawing}
          onPolygonComplete={onPolygonComplete}
          selectedAreaId={selectedId}
          onSelectArea={setSelectedId}
          editingAreaId={editingAreaId}
          onPolygonEdit={onPolygonEdit}
          getTotal={totalPorArea}
          heatColors={heatColors}
        />

        <aside className="hidden w-80 shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
          {/* Form de nova área */}
          {pendingPath && (
            <Card className="border-primary/40">
              <CardContent className="pt-6">
                <form onSubmit={salvarArea} className="flex flex-col gap-3">
                  <p className="text-sm font-medium">Nova área</p>
                  <div>
                    <Label htmlFor="nome">Nome / número</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex.: Área 4"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="cultura">Cultura (opcional)</Label>
                    <Input
                      id="cultura"
                      value={cultura}
                      onChange={(e) => setCultura(e.target.value)}
                      placeholder="Ex.: Soja"
                    />
                  </div>
                  <div>
                    <Label htmlFor="orcamento">Orçamento (R$, opcional)</Label>
                    <Input
                      id="orcamento"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={orcamento}
                      onChange={(e) => setOrcamento(e.target.value)}
                      placeholder="Ex.: 50000"
                    />
                  </div>
                  <div>
                    <Label>Cor</Label>
                    <div className="flex flex-wrap gap-2">
                      {CORES_AREAS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCor(c)}
                          className={cn(
                            'size-7 rounded-full border-2 transition-transform',
                            cor === c
                              ? 'scale-110 border-foreground'
                              : 'border-transparent'
                          )}
                          style={{ backgroundColor: c }}
                          aria-label={`Cor ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Tamanho estimado:{' '}
                    <span className="font-medium text-foreground">
                      {hectaresPendente.toFixed(2)} ha
                    </span>
                  </p>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Plus /> Salvar área
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelarDesenho}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Lista de áreas */}
          {areas.length === 0 && !pendingPath && (
            <Card>
              <CardContent className="pt-6 text-sm text-muted-foreground">
                Nenhuma área ainda. Clique em <strong>Nova área</strong> e
                desenhe o talhão no mapa.
              </CardContent>
            </Card>
          )}

          {areas.map((area) => {
            const total = totalPorArea(area.id)
            const pct = area.orcamento ? Math.min(100, (total / area.orcamento) * 100) : null
            const acima = pct !== null && pct >= 100

            return (
              <Card
                key={area.id}
                className={cn(
                  'cursor-pointer transition-colors',
                  selectedId === area.id && 'border-primary'
                )}
                onClick={() => setSelectedId(area.id)}
              >
                <CardContent className="flex items-start justify-between gap-2 pt-4 pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: area.cor }}
                      />
                      <p className="truncate font-medium">{area.nome}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {area.hectares.toFixed(2)} ha
                      {area.cultura ? ` · ${area.cultura}` : ''}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold">
                      {formatCurrency(total)}
                    </p>

                    {/* Barra de orçamento */}
                    {area.orcamento && pct !== null ? (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{pct.toFixed(0)}% do orçamento</span>
                          <span>{formatCurrency(area.orcamento)}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              acima ? 'bg-destructive' : 'bg-primary'
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      // Edição inline do orçamento
                      <div className="mt-2">
                        {editandoOrcamentoId === area.id ? (
                          <form
                            onSubmit={(e) => { e.preventDefault(); salvarOrcamento(area.id) }}
                            className="flex gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Input
                              autoFocus
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Orçamento R$"
                              value={orcamentoEdit}
                              onChange={(e) => setOrcamentoEdit(e.target.value)}
                              className="h-7 text-xs"
                            />
                            <Button type="submit" size="sm" className="h-7 px-2 text-xs">OK</Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => setEditandoOrcamentoId(null)}
                            >
                              ✕
                            </Button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditandoOrcamentoId(area.id)
                              setOrcamentoEdit('')
                            }}
                          >
                            + definir orçamento
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Lançar despesa nesta área"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/lancar?area=${area.id}`)
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon"
                      variant={editingAreaId === area.id ? 'secondary' : 'ghost'}
                      title="Editar polígono"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (editingAreaId === area.id) {
                          setEditingAreaId(null)
                        } else {
                          iniciarEdicaoPoligono(area.id)
                        }
                      }}
                    >
                      <Move />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Excluir área"
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (await confirm({
                          description: `Excluir "${area.nome}"? As despesas dessa área também serão removidas.`,
                          variant: 'destructive',
                        })) {
                          removerArea(area.id)
                        }
                      }}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
