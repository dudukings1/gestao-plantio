import * as React from 'react'
import { Plus, Trash2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useData } from '@/store/DataContext'
import { formatCurrency, formatDate } from '@/lib/utils'

function hoje() { return new Date().toISOString().slice(0, 10) }

export function EntradasPage() {
  const {
    areas, safras, entradas, adicionarEntrada, removerEntrada, totalEntradasPorArea,
    totalPorArea,
  } = useData()

  const [mostrarForm, setMostrarForm] = React.useState(false)
  const [areaId, setAreaId] = React.useState('')
  const [safraId, setSafraId] = React.useState('')
  const [cultura, setCultura] = React.useState('')
  const [quantidade, setQuantidade] = React.useState('')
  const [unidade, setUnidade] = React.useState<'sc' | 'ton'>('sc')
  const [precoUnitario, setPrecoUnitario] = React.useState('')
  const [comprador, setComprador] = React.useState('')
  const [data, setData] = React.useState(hoje)

  React.useEffect(() => {
    if (!areaId && areas[0]) setAreaId(areas[0].id)
  }, [areas, areaId])

  const total = (Number(quantidade) || 0) * (Number(precoUnitario) || 0)

  function handleSalvar(e: React.FormEvent) {
    e.preventDefault()
    if (!areaId || !quantidade || !precoUnitario) return
    adicionarEntrada({
      areaId,
      safraId: safraId || undefined,
      cultura: cultura.trim(),
      quantidade: Number(quantidade),
      unidade,
      precoUnitario: Number(precoUnitario),
      total,
      comprador: comprador.trim() || undefined,
      data,
    })
    setQuantidade('')
    setPrecoUnitario('')
    setComprador('')
    setCultura('')
    setMostrarForm(false)
  }

  // Resultado por área (receita - despesas)
  const resultadoPorArea = areas.map((a) => ({
    area: a,
    receita: totalEntradasPorArea(a.id),
    despesas: totalPorArea(a.id),
    resultado: totalEntradasPorArea(a.id) - totalPorArea(a.id),
  })).filter((r) => r.receita > 0 || r.despesas > 0)

  const totalReceita = entradas.reduce((s, e) => s + e.total, 0)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entradas</h1>
          <p className="text-sm text-muted-foreground">Vendas da colheita por área</p>
        </div>
        <Button onClick={() => setMostrarForm((v) => !v)} variant={mostrarForm ? 'outline' : 'default'}>
          <Plus className="mr-1 size-4" /> Registrar venda
        </Button>
      </div>

      {/* Form nova entrada */}
      {mostrarForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">Registrar venda</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSalvar} className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="e-area">Área</Label>
                <Select id="e-area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="e-safra">Safra</Label>
                <Select id="e-safra" value={safraId} onChange={(e) => setSafraId(e.target.value)}>
                  <option value="">Sem safra</option>
                  {safras.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="e-cultura">Cultura</Label>
                <Input id="e-cultura" value={cultura} onChange={(e) => setCultura(e.target.value)} placeholder="Ex.: Soja" />
              </div>
              <div>
                <Label htmlFor="e-data">Data da venda</Label>
                <Input id="e-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="e-qtd">Quantidade</Label>
                <div className="flex gap-2">
                  <Input id="e-qtd" type="number" min="0.01" step="0.01" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="0" required />
                  <Select value={unidade} onChange={(e) => setUnidade(e.target.value as 'sc' | 'ton')} className="w-20">
                    <option value="sc">sc</option>
                    <option value="ton">ton</option>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="e-preco">Preço unitário (R$)</Label>
                <Input id="e-preco" type="number" min="0.01" step="0.01" value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} placeholder="Ex.: 125,00" required />
              </div>
              <div className="col-span-2">
                <Label htmlFor="e-comp">Comprador (opcional)</Label>
                <Input id="e-comp" value={comprador} onChange={(e) => setComprador(e.target.value)} placeholder="Ex.: Cooperativa, Trader" />
              </div>

              {total > 0 && (
                <div className="col-span-2 rounded-md bg-primary/5 px-4 py-2 text-sm">
                  Total: <span className="font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              )}

              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={!areaId || !quantidade || !precoUnitario}>Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Resultado por área */}
      {resultadoPorArea.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" /> Resultado por área
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Despesas</TableHead>
                  <TableHead className="text-right">Resultado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultadoPorArea.map(({ area, receita, despesas, resultado }) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.nome}</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(receita)}</TableCell>
                    <TableCell className="text-right text-destructive">{formatCurrency(despesas)}</TableCell>
                    <TableCell className={`text-right font-bold ${resultado >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {resultado >= 0 ? '+' : ''}{formatCurrency(resultado)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Lista de entradas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Histórico de vendas</CardTitle>
            {totalReceita > 0 && (
              <span className="text-sm font-semibold text-primary">{formatCurrency(totalReceita)} total</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {entradas.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma venda registrada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Cultura</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...entradas].reverse().map((e) => {
                  const area = areas.find((a) => a.id === e.areaId)
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(e.data)}</TableCell>
                      <TableCell>{area?.nome ?? '—'}</TableCell>
                      <TableCell>{e.cultura || '—'}</TableCell>
                      <TableCell className="tabular-nums">
                        {e.quantidade.toLocaleString('pt-BR')} {e.unidade}
                        <span className="ml-1 text-xs text-muted-foreground">
                          @ {formatCurrency(e.precoUnitario)}/{e.unidade}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(e.total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Excluir esta venda?')) removerEntrada(e.id)
                          }}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
