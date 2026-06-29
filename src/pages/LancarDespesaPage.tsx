import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useData } from '@/store/DataContext'
import { useAuth } from '@/store/AuthContext'
import { CATEGORIAS } from '@/lib/categories'
import { formatCurrency } from '@/lib/utils'
import type { CategoriaId } from '@/lib/types'

interface Item {
  categoria: CategoriaId
  valor: string
  descricao: string
}

function novoItem(): Item {
  return { categoria: 'diesel', valor: '', descricao: '' }
}

function hoje(): string {
  return new Date().toISOString().slice(0, 10)
}

export function LancarDespesaPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { areas, adicionarDespesa } = useData()
  const { usuario } = useAuth()

  const [areaId, setAreaId] = React.useState(
    () => searchParams.get('area') ?? areas[0]?.id ?? ''
  )
  const [data, setData] = React.useState(hoje)
  const [itens, setItens] = React.useState<Item[]>([novoItem()])
  const [salvo, setSalvo] = React.useState(false)

  // Mantém a área selecionada válida caso a lista mude.
  React.useEffect(() => {
    if (!areaId && areas[0]) setAreaId(areas[0].id)
  }, [areas, areaId])

  function atualizarItem(index: number, patch: Partial<Item>) {
    setItens((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    )
  }

  function adicionarLinha() {
    setItens((prev) => [...prev, novoItem()])
  }

  function removerLinha(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  const total = itens.reduce(
    (soma, it) => soma + (Number.parseFloat(it.valor) || 0),
    0
  )

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
      })
    })

    setSalvo(true)
    setItens([novoItem()])
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
        Selecione a área e adicione um ou mais itens (ex.: diesel + adubo).
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Dados do lançamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={salvar} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="area">Área</Label>
                <Select
                  id="area"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nome}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Label className="mb-0">Itens</Label>
              {itens.map((it, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 rounded-md border p-3 sm:grid-cols-[1fr_140px_auto]"
                >
                  <Select
                    value={it.categoria}
                    onChange={(e) =>
                      atualizarItem(i, {
                        categoria: e.target.value as CategoriaId,
                      })
                    }
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
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
                    onClick={() => removerLinha(i)}
                    title="Remover item"
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                  <Input
                    className="sm:col-span-3"
                    placeholder="Descrição (opcional)"
                    value={it.descricao}
                    onChange={(e) =>
                      atualizarItem(i, { descricao: e.target.value })
                    }
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={adicionarLinha}
                className="self-start"
              >
                <Plus /> Adicionar item
              </Button>
            </div>

            <div className="flex items-center justify-between border-t pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-semibold">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={total <= 0}>
                <Check /> Salvar lançamento
              </Button>
              {salvo && (
                <span className="text-sm font-medium text-primary">
                  Lançamento salvo!
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
