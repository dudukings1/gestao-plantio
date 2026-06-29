import * as React from 'react'
import { Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useData } from '@/store/DataContext'
import { CATEGORIAS, getCategoria } from '@/lib/categories'
import { formatCurrency, formatDate } from '@/lib/utils'

export function HistoricoPage() {
  const { areas, despesas, removerDespesa } = useData()

  const [areaId, setAreaId] = React.useState('')
  const [categoria, setCategoria] = React.useState('')
  const [de, setDe] = React.useState('')
  const [ate, setAte] = React.useState('')

  const areaNome = React.useCallback(
    (id: string) => areas.find((a) => a.id === id)?.nome ?? '—',
    [areas]
  )

  const filtradas = React.useMemo(() => {
    return despesas
      .filter((d) => (areaId ? d.areaId === areaId : true))
      .filter((d) => (categoria ? d.categoria === categoria : true))
      .filter((d) => (de ? d.data >= de : true))
      .filter((d) => (ate ? d.data <= ate : true))
      .sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [despesas, areaId, categoria, de, ate])

  const total = filtradas.reduce((soma, d) => soma + d.valor, 0)

  function exportarCsv() {
    const linhas = [
      ['Data', 'Área', 'Categoria', 'Descrição', 'Valor'],
      ...filtradas.map((d) => [
        d.data,
        areaNome(d.areaId),
        getCategoria(d.categoria).nome,
        d.descricao ?? '',
        d.valor.toFixed(2).replace('.', ','),
      ]),
    ]
    const csv = linhas
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob(['﻿' + csv], {
      type: 'text/csv;charset=utf-8;',
    })
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
        <Button
          variant="outline"
          onClick={exportarCsv}
          disabled={filtradas.length === 0}
        >
          <Download /> Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="f-area">Área</Label>
              <Select
                id="f-area"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                <option value="">Todas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-cat">Categoria</Label>
              <Select
                id="f-cat"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Todas</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="f-de">De</Label>
              <Input
                id="f-de"
                type="date"
                value={de}
                onChange={(e) => setDe(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="f-ate">Até</Label>
              <Input
                id="f-ate"
                type="date"
                value={ate}
                onChange={(e) => setAte(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filtradas.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma despesa encontrada para os filtros selecionados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtradas.map((d) => {
                  const cat = getCategoria(d.categoria)
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(d.data)}
                      </TableCell>
                      <TableCell>{areaNome(d.areaId)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: cat.cor,
                            color: cat.cor,
                          }}
                        >
                          {cat.nome}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.descricao ?? '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(d.valor)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Excluir"
                          onClick={() => removerDespesa(d.id)}
                        >
                          <Trash2 className="text-destructive" />
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

      <div className="flex items-center justify-end gap-3 pr-1">
        <span className="text-sm text-muted-foreground">
          {filtradas.length} lançamento(s) · Total
        </span>
        <span className="text-lg font-semibold">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
