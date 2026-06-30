import * as React from 'react'
import { ChevronLeft, ChevronRight, Download, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TagInput } from '@/components/ui/tag-input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { getCategoriaNome, getCategoriaCor } from '@/lib/categories'
import { formatCurrency, formatDate } from '@/lib/utils'

const ITENS_POR_PAGINA = 50

export function HistoricoPage() {
  const { areas, despesas, safras, categorias, removerDespesa, todosTagsUsados, recarregar } = useData()
  const { usuario, usuarios, pode } = useAuth()

  const [areaId, setAreaId] = React.useState('')
  const [categoriaId, setCategoriaId] = React.useState('')
  const [safraId, setSafraId] = React.useState('')
  const [tagsFiltro, setTagsFiltro] = React.useState<string[]>([])
  const [de, setDe] = React.useState('')
  const [ate, setAte] = React.useState('')
  const [atualizando, setAtualizando] = React.useState(false)
  const [pagina, setPagina] = React.useState(1)

  const despesasVisiveis = React.useMemo(
    () =>
      usuario?.role === 'funcionario'
        ? despesas.filter((d) => d.lancadoPorId === usuario.id)
        : despesas,
    [despesas, usuario]
  )

  async function atualizar() {
    setAtualizando(true)
    await recarregar()
    setAtualizando(false)
  }

  const areaNome = React.useCallback(
    (id: string) => areas.find((a) => a.id === id)?.nome ?? '—',
    [areas]
  )

  const nomeUsuario = React.useCallback(
    (id?: string) => {
      if (!id) return '—'
      return usuarios.find((u) => u.id === id)?.nome ?? '—'
    },
    [usuarios]
  )

  const filtradas = React.useMemo(() => {
    return despesasVisiveis
      .filter((d) => (areaId ? d.areaId === areaId : true))
      .filter((d) => (categoriaId ? d.categoria === categoriaId : true))
      .filter((d) => (safraId ? d.safraId === safraId : true))
      .filter((d) =>
        tagsFiltro.length === 0 ? true : tagsFiltro.every((t) => d.tags?.includes(t))
      )
      .filter((d) => (de ? d.data >= de : true))
      .filter((d) => (ate ? d.data <= ate : true))
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [despesasVisiveis, areaId, categoriaId, safraId, tagsFiltro, de, ate])

  const total = filtradas.reduce((s, d) => s + d.valor, 0)

  React.useEffect(() => {
    setPagina(1)
  }, [areaId, categoriaId, safraId, tagsFiltro, de, ate])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / ITENS_POR_PAGINA))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  )

  function podeExcluir(lancadoPorId?: string) {
    if (pode('excluirDespesaQualquer')) return true
    return pode('excluirDespesaPropria') && lancadoPorId === usuario?.id
  }

  function exportarCsv() {
    const linhas = [
      ['Data', 'Área', 'Safra', 'Categoria', 'Descrição', 'Tags', 'Lançado por', 'Valor'],
      ...filtradas.map((d) => {
        const safra = safras.find((s) => s.id === d.safraId)
        return [
          d.data,
          areaNome(d.areaId),
          safra?.nome ?? '',
          getCategoriaNome(categorias, d.categoria),
          d.descricao ?? '',
          (d.tags ?? []).join(', '),
          nomeUsuario(d.lancadoPorId),
          d.valor.toFixed(2).replace('.', ','),
        ]
      }),
    ]
    const csv = linhas
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `despesas-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Histórico de despesas</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={atualizar} disabled={atualizando}>
            <RefreshCw className={atualizando ? 'animate-spin' : ''} /> Atualizar
          </Button>
          {pode('exportarCSV') && (
            <Button variant="outline" onClick={exportarCsv} disabled={filtradas.length === 0}>
              <Download /> Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="f-area">Área</Label>
              <Select id="f-area" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
                <option value="">Todas</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-cat">Categoria</Label>
              <Select id="f-cat" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                <option value="">Todas</option>
                {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-safra">Safra</Label>
              <Select id="f-safra" value={safraId} onChange={(e) => setSafraId(e.target.value)}>
                <option value="">Todas</option>
                {safras.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-de">De</Label>
              <Input id="f-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="f-ate">Até</Label>
              <Input id="f-ate" type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Tags</Label>
              <TagInput
                value={tagsFiltro}
                onChange={setTagsFiltro}
                sugestoes={todosTagsUsados}
                placeholder="Filtrar por tags…"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="pt-6">
          {filtradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma despesa encontrada para os filtros selecionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição / Tags</TableHead>
                    <TableHead>Lançado por</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiveis.map((d) => {
                    const catNome = getCategoriaNome(categorias, d.categoria)
                    const catCor = getCategoriaCor(categorias, d.categoria)
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(d.data)}</TableCell>
                        <TableCell>{areaNome(d.areaId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" style={{ borderColor: catCor, color: catCor }}>
                            {catNome}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm text-muted-foreground">{d.descricao ?? '—'}</span>
                            {d.tags && d.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {d.tags.map((t) => (
                                  <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {nomeUsuario(d.lancadoPorId)}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(d.valor)}</TableCell>
                        <TableCell>
                          {podeExcluir(d.lancadoPorId) && (
                            <Button size="icon" variant="ghost" onClick={() => removerDespesa(d.id)}>
                              <Trash2 className="text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {totalPaginas > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              disabled={paginaAtual <= 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              <ChevronLeft /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <Button
              variant="outline" size="sm"
              disabled={paginaAtual >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima <ChevronRight />
            </Button>
          </div>
        ) : <div />}

        <div className="flex items-center gap-3 pr-1">
          <span className="text-sm text-muted-foreground">
            {filtradas.length} lançamento(s) · Total
          </span>
          <span className="text-lg font-semibold">{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  )
}
