import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPlus, Pencil, Plus, Trash2, X } from 'lucide-react'
import { PlantioMap } from '@/components/map/PlantioMap'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useData } from '@/store/DataContext'
import { CORES_AREAS } from '@/lib/maps'
import { poligonoHectares } from '@/lib/geo'
import { cn, formatCurrency } from '@/lib/utils'
import type { LatLng } from '@/lib/types'

export function MapaPage() {
  const navigate = useNavigate()
  const { areas, adicionarArea, atualizarArea, removerArea, totalPorArea } = useData()

  const [drawing, setDrawing] = React.useState(false)
  const [pendingPath, setPendingPath] = React.useState<LatLng[] | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

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

  function salvarOrcamento(areaId: string) {
    const val = Number.parseFloat(orcamentoEdit)
    atualizarArea(areaId, { orcamento: Number.isFinite(val) && val > 0 ? val : undefined })
    setEditandoOrcamentoId(null)
  }

  const hectaresPendente = pendingPath ? poligonoHectares(pendingPath) : 0

  return (
    <div className="flex h-[calc(100svh-2rem)] flex-col gap-4 md:h-[calc(100svh-3rem)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Mapa das áreas</h1>
          <p className="text-sm text-muted-foreground">
            {areas.length} área(s) cadastrada(s)
          </p>
        </div>
        {drawing ? (
          <Button variant="outline" onClick={cancelarDesenho}>
            <X /> Cancelar desenho
          </Button>
        ) : (
          <Button onClick={iniciarDesenho} disabled={!!pendingPath}>
            <MapPlus /> Nova área
          </Button>
        )}
      </div>

      {drawing && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm text-primary">
          Clique no mapa para marcar os cantos do talhão. Para fechar a área,
          clique novamente no primeiro ponto.
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
          getTotal={totalPorArea}
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
                      variant="ghost"
                      title="Excluir área"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`Excluir "${area.nome}"? As despesas dessa área também serão removidas.`)) {
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
