import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { TagInput } from '@/components/ui/tag-input'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { CATEGORIAS } from '@/lib/categories'
import { ATIVIDADES } from '@/lib/atividades'
import { formatCurrency } from '@/lib/utils'
import type { AtividadeId, CategoriaId } from '@/lib/types'

interface Item {
  categoria: CategoriaId
  valor: string
  descricao: string
  insumoId: string
  quantidadeInsumo: string
}

function novoItem(): Item {
  return { categoria: 'diesel', valor: '', descricao: '', insumoId: '', quantidadeInsumo: '' }
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LancarDespesaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { areas, safras, safraAtiva, insumos, adicionarDespesa, todosTagsUsados } = useData()
  const { usuario } = useAuth()

  const [areaId, setAreaId] = React.useState(
    () => searchParams.get('area') ?? areas[0]?.id ?? ''
  )
  const [data, setData] = React.useState(hoje)
  const [safraId, setSafraId] = React.useState(() => safraAtiva?.id ?? '')
  const [tipoAtividade, setTipoAtividade] = React.useState<AtividadeId | ''>('')
  const [tags, setTags] = React.useState<string[]>([])
  const [itens, setItens] = React.useState<Item[]>([novoItem()])
  const [salvo, setSalvo] = React.useState(false)

  // Sincroniza safraId quando safraAtiva muda (ex: usuário muda a safra ativa em outra aba)
  React.useEffect(() => {
    if (!safraId && safraAtiva) setSafraId(safraAtiva.id)
  }, [safraAtiva, safraId])

  React.useEffect(() => {
    if (!areaId && areas[0]) setAreaId(areas[0].id)
  }, [areas, areaId])

  function atualizarItem(index: number, patch: Partial<Item>) {
    setItens((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const total = itens.reduce((s, it) => s + (Number.parseFloat(it.valor) || 0), 0)

  function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!areaId) return
    const validos = itens.filter((it) => Number.parseFloat(it.valor) > 0)
    if (validos.length === 0) return

    validos.forEach((it) => {
      adicionarDespesa({
        areaId,
        categoria: it.categoria,
        valor: Number.parseFloat(it.valor),
        data,
        descricao: it.descricao.trim() || undefined,
        lancadoPorId: usuario?.id,
        safraId: safraId || undefined,
        tipoAtividade: tipoAtividade || undefined,
        tags,
        insumoId: it.insumoId || undefined,
        quantidadeInsumo: it.insumoId && it.quantidadeInsumo ? Number(it.quantidadeInsumo) : undefined,
      })
    })

    setSalvo(true)
    setItens([novoItem()])
    setTags([])
    setTipoAtividade('')
    setTimeout(() => setSalvo(false), 2500)
  }

  if (areas.length === 0) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <p className="font-medium">Nenhuma área cadastrada</p>
          <p className="text-sm text-muted-foreground">
            Cadastre uma área no mapa antes de lançar despesas.
          </p>
          <Button onClick={() => navigate('/')}>Ir para o mapa</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold">Lançar despesa</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Selecione a área e adicione os itens do lançamento.
      </p>

      <Card>
        <CardHeader><CardTitle>Dados do lançamento</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="flex flex-col gap-5">
            {/* Linha 1: área + data */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="area">Área</Label>
                <Select id="area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
            </div>

            {/* Linha 2: safra + atividade */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="safra">Safra</Label>
                <Select id="safra" value={safraId} onChange={(e) => setSafraId(e.target.value)}>
                  <option value="">Sem safra</option>
                  {safras.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}{s.ativa ? ' ★' : ''}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="atividade">Tipo de atividade</Label>
                <Select id="atividade" value={tipoAtividade} onChange={(e) => setTipoAtividade(e.target.value as AtividadeId | '')}>
                  <option value="">Nenhuma</option>
                  {ATIVIDADES.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags <span className="text-muted-foreground text-xs">(Enter ou vírgula para adicionar)</span></Label>
              <TagInput value={tags} onChange={setTags} sugestoes={todosTagsUsados} />
            </div>

            {/* Itens */}
            <div className="flex flex-col gap-3">
              <Label className="mb-0">Itens</Label>
              {itens.map((it, i) => (
                <div key={i} className="rounded-md border p-3 flex flex-col gap-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto]">
                    <Select
                      value={it.categoria}
                      onChange={(e) => atualizarItem(i, { categoria: e.target.value as CategoriaId })}
                    >
                      {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </Select>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      placeholder="Valor (R$)"
                      value={it.valor}
                      onChange={(e) => atualizarItem(i, { valor: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={itens.length === 1}
                      onClick={() => setItens((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                    <Input
                      className="sm:col-span-3"
                      placeholder="Descrição (opcional)"
                      value={it.descricao}
                      onChange={(e) => atualizarItem(i, { descricao: e.target.value })}
                    />
                  </div>

                  {/* Vínculo com estoque (opcional) */}
                  {insumos.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed">
                      <span className="text-xs text-muted-foreground shrink-0">Débito de estoque:</span>
                      <Select
                        value={it.insumoId}
                        onChange={(e) => atualizarItem(i, { insumoId: e.target.value, quantidadeInsumo: '' })}
                        className="flex-1 min-w-36"
                      >
                        <option value="">Nenhum</option>
                        {insumos.map((ins) => <option key={ins.id} value={ins.id}>{ins.nome}</option>)}
                      </Select>
                      {it.insumoId && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="Qtd"
                            value={it.quantidadeInsumo}
                            onChange={(e) => atualizarItem(i, { quantidadeInsumo: e.target.value })}
                            className="w-24 h-8 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">
                            {insumos.find((ins) => ins.id === it.insumoId)?.unidade ?? ''}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => setItens((prev) => [...prev, novoItem()])} className="self-start">
                <Plus /> Adicionar item
              </Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">{formatCurrency(total)}</span>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={total <= 0}>
                <Check /> Salvar lançamento
              </Button>
              {salvo && <span className="text-sm font-medium text-primary">Lançamento salvo!</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
