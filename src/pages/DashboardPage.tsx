import * as React from 'react'
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { FileDown, Landmark, MapPinned, Ruler, TrendingUp, Wallet } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useData } from '@/store/DataContext'
import { CATEGORIAS } from '@/lib/categories'
import { formatCurrency, cn } from '@/lib/utils'
import { gerarRelatorioPDF } from '@/lib/relatorio'

export function DashboardPage() {
  const { areas, despesas, safras, entradas } = useData()

  const [safraFiltro, setSafraFiltro] = React.useState('')

  const despesasFiltradas = React.useMemo(
    () => despesas.filter((d) => (safraFiltro ? d.safraId === safraFiltro : true)),
    [despesas, safraFiltro]
  )

  const entradasFiltradas = React.useMemo(
    () => entradas.filter((e) => (safraFiltro ? e.safraId === safraFiltro : true)),
    [entradas, safraFiltro]
  )

  const totalGeral = despesasFiltradas.reduce((s, d) => s + d.valor, 0)
  const totalHectares = areas.reduce((s, a) => s + a.hectares, 0)
  const custoPorHectare = totalHectares > 0 ? totalGeral / totalHectares : 0
  const totalOrcamento = areas.reduce((s, a) => s + (a.orcamento ?? 0), 0)
  const totalReceita = entradasFiltradas.reduce((s, e) => s + e.total, 0)

  const porArea = React.useMemo(
    () =>
      areas
        .map((a) => {
          const gasto = despesasFiltradas.filter((d) => d.areaId === a.id).reduce((s, d) => s + d.valor, 0)
          const receita = entradasFiltradas.filter((e) => e.areaId === a.id).reduce((s, e) => s + e.total, 0)
          return {
            nome: a.nome,
            cor: a.cor,
            total: gasto,
            receita,
            resultado: receita - gasto,
            orcamento: a.orcamento ?? 0,
            hectares: a.hectares,
          }
        })
        .sort((a, b) => b.total - a.total),
    [areas, despesasFiltradas, entradasFiltradas]
  )

  const porCategoria = React.useMemo(
    () =>
      CATEGORIAS.map((c) => ({
        nome: c.nome,
        cor: c.cor,
        total: despesasFiltradas.filter((d) => d.categoria === c.id).reduce((s, d) => s + d.valor, 0),
      })).filter((c) => c.total > 0),
    [despesasFiltradas]
  )

  const areasComOrcamento = porArea.filter((a) => a.orcamento > 0)
  const areasComResultado = porArea.filter((a) => a.receita > 0 || a.total > 0)
  const temEntradas = entradasFiltradas.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          {safras.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="dash-safra" className="whitespace-nowrap text-sm">Safra:</Label>
              <Select
                id="dash-safra"
                value={safraFiltro}
                onChange={(e) => setSafraFiltro(e.target.value)}
                className="w-40"
              >
                <option value="">Todas</option>
                {safras.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => gerarRelatorioPDF(areas, despesasFiltradas)}
            disabled={despesasFiltradas.length === 0}
          >
            <FileDown /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<Wallet className="size-5" />} label="Total gasto" value={formatCurrency(totalGeral)} />
        <Kpi icon={<MapPinned className="size-5" />} label="Áreas" value={String(areas.length)} />
        <Kpi icon={<Ruler className="size-5" />} label="Hectares" value={`${totalHectares.toFixed(2)} ha`} />
        <Kpi icon={<Landmark className="size-5" />} label="Custo médio / ha" value={formatCurrency(custoPorHectare)} />
        {temEntradas && (
          <>
            <Kpi icon={<TrendingUp className="size-5 text-green-600" />} label="Receita total" value={formatCurrency(totalReceita)} cor="green" />
            <Kpi
              icon={<TrendingUp className={cn('size-5', totalReceita - totalGeral >= 0 ? 'text-green-600' : 'text-destructive')} />}
              label="Resultado geral"
              value={`${totalReceita - totalGeral >= 0 ? '+' : ''}${formatCurrency(totalReceita - totalGeral)}`}
              cor={totalReceita - totalGeral >= 0 ? 'green' : 'red'}
            />
          </>
        )}
      </div>

      {despesasFiltradas.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Sem dados ainda. Cadastre áreas e lance despesas para ver os gráficos.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Gasto por área */}
            <Card>
              <CardHeader><CardTitle>Gasto por área</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={porArea}>
                    <XAxis dataKey="nome" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                    <Bar dataKey="total" name="Gasto" radius={[4, 4, 0, 0]}>
                      {porArea.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gasto por categoria */}
            <Card>
              <CardHeader><CardTitle>Gasto por categoria</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={porCategoria}
                      dataKey="total"
                      nameKey="nome"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={(props) => { const p = props as { name?: string }; return p.name ?? '' }}
                    >
                      {porCategoria.map((entry, i) => <Cell key={i} fill={entry.cor} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resultado por área (receita vs despesas) */}
          {temEntradas && areasComResultado.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Receita vs Despesas por área</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(200, areasComResultado.length * 70)}>
                  <BarChart data={areasComResultado} layout="vertical" margin={{ left: 8, right: 24 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={70} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="receita" name="Receita" fill="#4ade80" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total" name="Despesas" radius={[0, 4, 4, 0]}>
                      {areasComResultado.map((entry, i) => (
                        <Cell key={i} fill={entry.total > entry.receita ? '#dc2626' : entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Orçamento vs Realizado */}
          {areasComOrcamento.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Orçamento vs Realizado
                  {totalOrcamento > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {formatCurrency(totalGeral)} de {formatCurrency(totalOrcamento)}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={Math.max(200, areasComOrcamento.length * 60)}>
                  <BarChart data={areasComOrcamento} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="nome" tick={{ fontSize: 12 }} width={70} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="orcamento" name="Orçamento" fill="#d1fae5" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="total" name="Gasto" radius={[0, 4, 4, 0]}>
                      {areasComOrcamento.map((entry, i) => (
                        <Cell key={i} fill={entry.total > entry.orcamento ? '#dc2626' : entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Custo por hectare */}
          <Card>
            <CardHeader><CardTitle>Custo por hectare</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col divide-y">
                {porArea.map((a) => {
                  const pct = a.orcamento > 0 ? (a.total / a.orcamento) * 100 : null
                  const acima = pct !== null && pct >= 100
                  return (
                    <div key={a.nome} className="py-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="size-3 rounded-full" style={{ backgroundColor: a.cor }} />
                          {a.nome}{' '}
                          <span className="text-muted-foreground">({a.hectares.toFixed(2)} ha)</span>
                        </span>
                        <span className="font-medium">
                          {a.hectares > 0 ? `${formatCurrency(a.total / a.hectares)}/ha` : '—'}
                        </span>
                      </div>
                      {pct !== null && (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span className={cn(acima && 'text-destructive font-medium')}>
                              {pct.toFixed(1)}% do orçamento {acima ? '⚠ acima' : ''}
                            </span>
                            <span>{formatCurrency(a.orcamento)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', acima ? 'bg-destructive' : 'bg-primary')}
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Kpi({ icon, label, value, cor }: { icon: React.ReactNode; label: string; value: string; cor?: 'green' | 'red' }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <div className={cn(
          'flex size-10 items-center justify-center rounded-lg',
          cor === 'green' ? 'bg-green-500/10 text-green-600' :
          cor === 'red' ? 'bg-destructive/10 text-destructive' :
          'bg-primary/10 text-primary'
        )}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn('text-lg font-semibold',
            cor === 'green' ? 'text-green-600' : cor === 'red' ? 'text-destructive' : ''
          )}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
