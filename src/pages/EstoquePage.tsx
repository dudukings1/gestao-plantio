import * as React from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Package, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { CATEGORIAS } from '@/lib/categories'
import { cn, formatDate } from '@/lib/utils'
import type { CategoriaId } from '@/lib/types'

export function EstoquePage() {
  const {
    insumos, movimentacoes, adicionarInsumo, removerInsumo,
    registrarEntradaEstoque, estoqueAtual,
  } = useData()
  const { pode } = useAuth()

  const podeGerenciar = pode('gerenciarEstoque')

  // Form novo insumo
  const [mostrarForm, setMostrarForm] = React.useState(false)
  const [nome, setNome] = React.useState('')
  const [unidade, setUnidade] = React.useState('L')
  const [categoriaId, setCategoriaId] = React.useState<CategoriaId | ''>('')
  const [estoqueMinimo, setEstoqueMinimo] = React.useState('')

  // Entrada de estoque por insumo
  const [entradaInsumoId, setEntradaInsumoId] = React.useState<string | null>(null)
  const [qtdEntrada, setQtdEntrada] = React.useState('')
  const [obsEntrada, setObsEntrada] = React.useState('')

  // Histórico expandido por insumo
  const [expandidoId, setExpandidoId] = React.useState<string | null>(null)

  function handleCriarInsumo(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    adicionarInsumo({
      nome: nome.trim(),
      unidade: unidade.trim() || 'un',
      categoriaId: categoriaId || undefined,
      estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : undefined,
    })
    setNome('')
    setUnidade('L')
    setCategoriaId('')
    setEstoqueMinimo('')
    setMostrarForm(false)
  }

  function handleEntrada(insumoId: string) {
    const qtd = Number(qtdEntrada)
    if (!qtd || qtd <= 0) return
    registrarEntradaEstoque(insumoId, qtd, obsEntrada.trim() || undefined)
    setEntradaInsumoId(null)
    setQtdEntrada('')
    setObsEntrada('')
  }

  const UNIDADES = ['L', 'kg', 'sc', 'ton', 'un', 'cx', 'm³']

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground">
            Controle de quantidade de insumos
          </p>
        </div>
        {podeGerenciar && (
          <Button onClick={() => setMostrarForm((v) => !v)} variant={mostrarForm ? 'outline' : 'default'}>
            <Plus className="mr-1 size-4" /> Novo insumo
          </Button>
        )}
      </div>

      {/* Form novo insumo */}
      {mostrarForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cadastrar insumo</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCriarInsumo} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <Label htmlFor="i-nome">Nome</Label>
                <Input id="i-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Diesel B5" required autoFocus />
              </div>
              <div>
                <Label htmlFor="i-unidade">Unidade</Label>
                <Select id="i-unidade" value={unidade} onChange={(e) => setUnidade(e.target.value)}>
                  {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="i-cat">Categoria (sugestão)</Label>
                <Select id="i-cat" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value as CategoriaId | '')}>
                  <option value="">Nenhuma</option>
                  {CATEGORIAS.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="i-min">Estoque mínimo (alerta)</Label>
                <Input id="i-min" type="number" min="0" step="0.01" value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} placeholder="Opcional" />
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={!nome.trim()}>Cadastrar</Button>
                <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de insumos */}
      {insumos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Package className="size-10 opacity-30" />
            <p className="text-sm">Nenhum insumo cadastrado.</p>
            {podeGerenciar && <p className="text-sm">Clique em <strong>Novo insumo</strong> para começar.</p>}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {insumos.map((ins) => {
            const saldo = estoqueAtual(ins.id)
            const abaixoMinimo = ins.estoqueMinimo != null && saldo <= ins.estoqueMinimo
            const movs = movimentacoes
              .filter((m) => m.insumoId === ins.id)
              .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))

            return (
              <Card key={ins.id} className={cn(abaixoMinimo && 'border-destructive/50')}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{ins.nome}</p>
                        {abaixoMinimo && (
                          <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            <AlertTriangle className="size-3" /> estoque baixo
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-2xl font-bold tabular-nums">
                        {saldo.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                        <span className="ml-1 text-sm font-normal text-muted-foreground">{ins.unidade}</span>
                      </p>
                      {ins.estoqueMinimo != null && (
                        <p className="text-xs text-muted-foreground">
                          Mínimo: {ins.estoqueMinimo} {ins.unidade}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-1">
                      {podeGerenciar && (
                        <Button
                          size="sm"
                          onClick={() => setEntradaInsumoId(entradaInsumoId === ins.id ? null : ins.id)}
                          variant="outline"
                        >
                          <TrendingUp className="mr-1 size-3" /> Entrada
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setExpandidoId(expandidoId === ins.id ? null : ins.id)}
                      >
                        {expandidoId === ins.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                      {podeGerenciar && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Excluir "${ins.nome}" e todo o histórico?`)) removerInsumo(ins.id)
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Form entrada */}
                  {entradaInsumoId === ins.id && (
                    <div className="mt-4 flex flex-wrap items-end gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                      <div className="flex flex-col gap-1">
                        <Label className="text-xs">Quantidade ({ins.unidade})</Label>
                        <Input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={qtdEntrada}
                          onChange={(e) => setQtdEntrada(e.target.value)}
                          placeholder="0"
                          className="h-8 w-32"
                          autoFocus
                        />
                      </div>
                      <div className="flex flex-col gap-1 flex-1 min-w-36">
                        <Label className="text-xs">Observação (opcional)</Label>
                        <Input
                          value={obsEntrada}
                          onChange={(e) => setObsEntrada(e.target.value)}
                          placeholder="Ex.: Compra 10/07"
                          className="h-8"
                        />
                      </div>
                      <Button size="sm" className="h-8" onClick={() => handleEntrada(ins.id)} disabled={!qtdEntrada || Number(qtdEntrada) <= 0}>
                        Confirmar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setEntradaInsumoId(null)}>Cancelar</Button>
                    </div>
                  )}

                  {/* Histórico de movimentações */}
                  {expandidoId === ins.id && (
                    <div className="mt-4 border-t pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Histórico</p>
                      {movs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nenhuma movimentação ainda.</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {movs.slice(0, 20).map((m) => (
                            <div key={m.id} className="flex items-center gap-2 text-xs">
                              {m.tipo === 'entrada' ? (
                                <TrendingUp className="size-3 shrink-0 text-green-500" />
                              ) : (
                                <TrendingDown className="size-3 shrink-0 text-destructive" />
                              )}
                              <span className={cn('font-medium tabular-nums', m.tipo === 'entrada' ? 'text-green-600' : 'text-destructive')}>
                                {m.tipo === 'entrada' ? '+' : '−'}{m.quantidade} {ins.unidade}
                              </span>
                              <span className="text-muted-foreground">{formatDate(m.criadoEm.slice(0, 10))}</span>
                              {m.observacao && <span className="text-muted-foreground">· {m.observacao}</span>}
                              {m.despesaId && <span className="text-muted-foreground italic">· via despesa</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
