import * as React from 'react'
import {
  AlertTriangle, ChevronDown, ChevronUp, Leaf, Package,
  Pencil, Plus, Trash2, TrendingDown, TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { cn, formatDate } from '@/lib/utils'

type Aba = 'insumos' | 'produtos'

export function EstoquePage() {
  const {
    insumos, movimentacoes, areas, safras, produtosColhidos,
    adicionarInsumo, atualizarInsumo, removerInsumo,
    registrarEntradaEstoque, atualizarMovimentacao, removerMovimentacao,
    adicionarProdutoColhido, removerProdutoColhido,
    estoqueAtual,
  } = useData()
  const { pode } = useAuth()

  const podeGerenciar = pode('gerenciarEstoque')

  const [aba, setAba] = React.useState<Aba>('insumos')

  // ── Seleção de insumo e movimentação ─────────────────────────
  const [insumoSelecionadoId, setInsumoSelecionadoId] = React.useState<string | null>(null)
  const [editandoInsumoId, setEditandoInsumoId] = React.useState<string | null>(null)
  const [editNome, setEditNome] = React.useState('')
  const [editUnidade, setEditUnidade] = React.useState('')
  const [editEstoqueMinimo, setEditEstoqueMinimo] = React.useState('')

  // ── Movimentação selecionada para editar ──────────────────────
  const [movSelecionadaId, setMovSelecionadaId] = React.useState<string | null>(null)
  const [editMovQtd, setEditMovQtd] = React.useState('')
  const [editMovObs, setEditMovObs] = React.useState('')

  // ── Form novo insumo ──────────────────────────────────────────
  const [mostrarForm, setMostrarForm] = React.useState(false)
  const [nome, setNome] = React.useState('')
  const [unidade, setUnidade] = React.useState('L')
  const [estoqueMinimo, setEstoqueMinimo] = React.useState('')

  // ── Entrada de estoque ────────────────────────────────────────
  const [entradaInsumoId, setEntradaInsumoId] = React.useState<string | null>(null)
  const [qtdEntrada, setQtdEntrada] = React.useState('')
  const [obsEntrada, setObsEntrada] = React.useState('')

  // ── Histórico expandido ───────────────────────────────────────
  const [expandidoId, setExpandidoId] = React.useState<string | null>(null)

  // ── Form novo produto colhido ─────────────────────────────────
  const [mostrarFormProduto, setMostrarFormProduto] = React.useState(false)
  const [pAreaId, setPAreaId] = React.useState(() => areas[0]?.id ?? '')
  const [pSafraId, setPSafraId] = React.useState('')
  const [pCultura, setPCultura] = React.useState('')
  const [pQtd, setPQtd] = React.useState('')
  const [pUnidade, setPUnidade] = React.useState('sc')
  const [pData, setPData] = React.useState(() => new Date().toISOString().slice(0, 10))
  const [pObs, setPObs] = React.useState('')

  const UNIDADES = ['L', 'kg', 'sc', 'ton', 'un', 'cx', 'm³']
  const UNIDADES_PRODUTO = ['sc', 'ton', 'kg', 'cx']

  function handleCriarInsumo(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return
    adicionarInsumo({
      nome: nome.trim(),
      unidade: unidade.trim() || 'un',
      estoqueMinimo: estoqueMinimo ? Number(estoqueMinimo) : undefined,
    })
    setNome(''); setUnidade('L'); setEstoqueMinimo('')
    setMostrarForm(false)
  }

  function handleEntrada(insumoId: string) {
    const qtd = Number(qtdEntrada)
    if (!qtd || qtd <= 0) return
    registrarEntradaEstoque(insumoId, qtd, obsEntrada.trim() || undefined)
    setEntradaInsumoId(null); setQtdEntrada(''); setObsEntrada('')
  }

  function iniciarEdicaoInsumo(id: string) {
    const ins = insumos.find((i) => i.id === id)
    if (!ins) return
    setEditandoInsumoId(id)
    setEditNome(ins.nome)
    setEditUnidade(ins.unidade)
    setEditEstoqueMinimo(ins.estoqueMinimo?.toString() ?? '')
  }

  function cancelarEdicaoInsumo() {
    setEditandoInsumoId(null)
  }

  function iniciarEdicaoMov(movId: string) {
    const mov = movimentacoes.find((m) => m.id === movId)
    if (!mov) return
    setMovSelecionadaId(movId)
    setEditMovQtd(mov.quantidade.toString())
    setEditMovObs(mov.observacao ?? '')
  }

  function salvarEdicaoMov() {
    if (!movSelecionadaId) return
    const qtd = Number(editMovQtd)
    if (!qtd || qtd <= 0) return
    atualizarMovimentacao(movSelecionadaId, { quantidade: qtd, observacao: editMovObs.trim() || undefined })
    setMovSelecionadaId(null)
  }

  function handleCriarProduto(e: React.FormEvent) {
    e.preventDefault()
    if (!pAreaId || !pCultura.trim() || !pQtd) return
    adicionarProdutoColhido({
      areaId: pAreaId,
      safraId: pSafraId || undefined,
      cultura: pCultura.trim(),
      quantidade: Number(pQtd),
      unidade: pUnidade,
      data: pData,
      observacao: pObs.trim() || undefined,
    })
    setPCultura(''); setPQtd(''); setPObs('')
    setMostrarFormProduto(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Cabeçalho com abas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Estoque</h1>
          <p className="text-sm text-muted-foreground">Insumos e produtos colhidos</p>
        </div>
        <div className="flex gap-2">
          {aba === 'insumos' && podeGerenciar && (
            <>
              {insumoSelecionadoId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => iniciarEdicaoInsumo(insumoSelecionadoId)}
                  >
                    <Pencil className="mr-1 size-3" /> Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const ins = insumos.find((i) => i.id === insumoSelecionadoId)
                      if (ins && confirm(`Excluir "${ins.nome}" e todo o histórico?`)) {
                        removerInsumo(insumoSelecionadoId)
                        setInsumoSelecionadoId(null)
                        setExpandidoId(null)
                      }
                    }}
                  >
                    <Trash2 className="mr-1 size-3 text-destructive" /> Excluir
                  </Button>
                </>
              )}
              <Button onClick={() => setMostrarForm((v) => !v)} variant={mostrarForm ? 'outline' : 'default'}>
                <Plus className="mr-1 size-4" /> Novo insumo
              </Button>
            </>
          )}
          {aba === 'produtos' && podeGerenciar && (
            <Button onClick={() => setMostrarFormProduto((v) => !v)} variant={mostrarFormProduto ? 'outline' : 'default'}>
              <Plus className="mr-1 size-4" /> Registrar colheita
            </Button>
          )}
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setAba('insumos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            aba === 'insumos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Package className="size-4" /> Insumos
        </button>
        <button
          onClick={() => setAba('produtos')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
            aba === 'produtos'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          <Leaf className="size-4" /> Produtos colhidos
        </button>
      </div>

      {/* ── ABA INSUMOS ─────────────────────────────────────────── */}
      {aba === 'insumos' && (
        <>
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
                const selecionado = insumoSelecionadoId === ins.id
                const movs = movimentacoes
                  .filter((m) => m.insumoId === ins.id)
                  .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))

                // Form edição inline
                if (editandoInsumoId === ins.id) {
                  return (
                    <Card key={ins.id} className="border-primary/50">
                      <CardHeader><CardTitle className="text-sm">Editar insumo</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 sm:col-span-1">
                            <Label>Nome</Label>
                            <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} autoFocus />
                          </div>
                          <div>
                            <Label>Unidade</Label>
                            <Select value={editUnidade} onChange={(e) => setEditUnidade(e.target.value)}>
                              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
                            </Select>
                          </div>
                          <div>
                            <Label>Estoque mínimo</Label>
                            <Input type="number" min="0" step="0.01" value={editEstoqueMinimo} onChange={(e) => setEditEstoqueMinimo(e.target.value)} placeholder="Opcional" />
                          </div>
                          <div className="col-span-2 flex gap-2">
                            <Button size="sm" onClick={() => {
                              atualizarInsumo(ins.id, {
                                nome: editNome.trim() || ins.nome,
                                unidade: editUnidade,
                                estoqueMinimo: editEstoqueMinimo ? Number(editEstoqueMinimo) : undefined,
                              })
                              cancelarEdicaoInsumo()
                              setInsumoSelecionadoId(null)
                            }}>Salvar</Button>
                            <Button size="sm" variant="outline" onClick={cancelarEdicaoInsumo}>Cancelar</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }

                return (
                  <Card
                    key={ins.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      abaixoMinimo && 'border-destructive/50',
                      selecionado && 'ring-2 ring-primary/40'
                    )}
                    onClick={() => setInsumoSelecionadoId(selecionado ? null : ins.id)}
                  >
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
                            {selecionado && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                selecionado
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

                        <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
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
                            onClick={() => {
                              setExpandidoId(expandidoId === ins.id ? null : ins.id)
                              setMovSelecionadaId(null)
                            }}
                          >
                            {expandidoId === ins.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Form entrada */}
                      {entradaInsumoId === ins.id && (
                        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-md border border-primary/20 bg-primary/5 p-3">
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs">Quantidade ({ins.unidade})</Label>
                            <Input
                              type="number" min="0.01" step="0.01"
                              value={qtdEntrada} onChange={(e) => setQtdEntrada(e.target.value)}
                              placeholder="0" className="h-8 w-32" autoFocus
                            />
                          </div>
                          <div className="flex flex-col gap-1 flex-1 min-w-36">
                            <Label className="text-xs">Observação (opcional)</Label>
                            <Input value={obsEntrada} onChange={(e) => setObsEntrada(e.target.value)} placeholder="Ex.: Compra 10/07" className="h-8" />
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
                              {movs.slice(0, 30).map((m) => {
                                const editando = movSelecionadaId === m.id
                                if (editando) {
                                  return (
                                    <div key={m.id} className="flex flex-wrap items-end gap-2 rounded-md border border-primary/20 bg-primary/5 p-2">
                                      <div className="flex flex-col gap-0.5">
                                        <Label className="text-xs">Qtd ({ins.unidade})</Label>
                                        <Input
                                          type="number" min="0.01" step="0.01"
                                          value={editMovQtd} onChange={(e) => setEditMovQtd(e.target.value)}
                                          className="h-7 w-28 text-xs"
                                        />
                                      </div>
                                      <div className="flex flex-col gap-0.5 flex-1 min-w-28">
                                        <Label className="text-xs">Observação</Label>
                                        <Input value={editMovObs} onChange={(e) => setEditMovObs(e.target.value)} className="h-7 text-xs" />
                                      </div>
                                      <Button size="sm" className="h-7 text-xs" onClick={salvarEdicaoMov}>Salvar</Button>
                                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setMovSelecionadaId(null)}>×</Button>
                                    </div>
                                  )
                                }
                                return (
                                  <div key={m.id} className="flex items-center gap-2 text-xs group">
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
                                    {podeGerenciar && !m.despesaId && (
                                      <span className="ml-auto hidden group-hover:flex gap-1">
                                        <button
                                          onClick={() => iniciarEdicaoMov(m.id)}
                                          className="text-muted-foreground hover:text-foreground"
                                          title="Editar"
                                        >
                                          <Pencil className="size-3" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (confirm('Excluir esta movimentação?')) removerMovimentacao(m.id)
                                          }}
                                          className="text-destructive/60 hover:text-destructive"
                                          title="Excluir"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
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
        </>
      )}

      {/* ── ABA PRODUTOS COLHIDOS ────────────────────────────────── */}
      {aba === 'produtos' && (
        <>
          {mostrarFormProduto && (
            <Card>
              <CardHeader><CardTitle className="text-base">Registrar colheita</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCriarProduto} className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="p-area">Área</Label>
                    <Select id="p-area" value={pAreaId} onChange={(e) => setPAreaId(e.target.value)} required>
                      {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="p-safra">Safra (opcional)</Label>
                    <Select id="p-safra" value={pSafraId} onChange={(e) => setPSafraId(e.target.value)}>
                      <option value="">Sem safra</option>
                      {safras.map((s) => <option key={s.id} value={s.id}>{s.nome}{s.ativa ? ' ★' : ''}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="p-cultura">Cultura</Label>
                    <Input id="p-cultura" value={pCultura} onChange={(e) => setPCultura(e.target.value)} placeholder="Ex.: Soja" required autoFocus />
                  </div>
                  <div>
                    <Label htmlFor="p-data">Data da colheita</Label>
                    <Input id="p-data" type="date" value={pData} onChange={(e) => setPData(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="p-qtd">Quantidade</Label>
                    <Input id="p-qtd" type="number" min="0.01" step="0.01" value={pQtd} onChange={(e) => setPQtd(e.target.value)} placeholder="0" required />
                  </div>
                  <div>
                    <Label htmlFor="p-unidade">Unidade</Label>
                    <Select id="p-unidade" value={pUnidade} onChange={(e) => setPUnidade(e.target.value)}>
                      {UNIDADES_PRODUTO.map((u) => <option key={u} value={u}>{u}</option>)}
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="p-obs">Observação (opcional)</Label>
                    <Input id="p-obs" value={pObs} onChange={(e) => setPObs(e.target.value)} placeholder="Ex.: Qualidade boa, umidade ok" />
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button type="submit" disabled={!pAreaId || !pCultura.trim() || !pQtd}>Registrar</Button>
                    <Button type="button" variant="outline" onClick={() => setMostrarFormProduto(false)}>Cancelar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {produtosColhidos.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <Leaf className="size-10 opacity-30" />
                <p className="text-sm">Nenhum produto colhido registrado.</p>
                {podeGerenciar && <p className="text-sm">Clique em <strong>Registrar colheita</strong> para começar.</p>}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {produtosColhidos.map((p) => {
                const area = areas.find((a) => a.id === p.areaId)
                const safra = safras.find((s) => s.id === p.safraId)
                return (
                  <Card key={p.id}>
                    <CardContent className="flex items-center justify-between gap-4 py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{p.cultura}</span>
                          <span className="text-sm text-muted-foreground">
                            {p.quantidade.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} {p.unidade}
                          </span>
                          {area && (
                            <span
                              className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                              style={{ backgroundColor: area.cor }}
                            >
                              {area.nome}
                            </span>
                          )}
                          {safra && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              {safra.nome}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(p.data)}{p.observacao ? ` · ${p.observacao}` : ''}
                        </p>
                      </div>
                      {podeGerenciar && (
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => {
                            if (confirm(`Excluir colheita de ${p.cultura}?`)) removerProdutoColhido(p.id)
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
              <p className="text-xs text-right text-muted-foreground pr-1">
                {produtosColhidos.length} registro(s)
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

