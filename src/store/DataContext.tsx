import * as React from 'react'
import type { Area, Despesa, Entrada, Insumo, LatLng, MovimentacaoEstoque, Safra } from '@/lib/types'
import { gerarId } from '@/lib/storage'
import { poligonoHectares } from '@/lib/geo'
import {
  db,
  mapArea, mapDespesa, mapSafra, mapInsumo, mapMovimentacao, mapEntrada,
  rowArea, rowDespesa, rowSafra, rowInsumo, rowMovimentacao, rowEntrada,
} from '@/lib/supabase'

interface DataContextValue {
  carregando: boolean

  // ── Áreas ─────────────────────────────────────────────────────
  areas: Area[]
  adicionarArea: (dados: { nome: string; cor: string; poligono: LatLng[]; cultura?: string; orcamento?: number }) => Area
  atualizarArea: (id: string, dados: Partial<Omit<Area, 'id' | 'criadoEm'>>) => void
  removerArea: (id: string) => void
  totalPorArea: (areaId: string) => number

  // ── Despesas ──────────────────────────────────────────────────
  despesas: Despesa[]
  adicionarDespesa: (dados: Omit<Despesa, 'id' | 'criadoEm'>) => Despesa
  removerDespesa: (id: string) => void

  // ── Safras ────────────────────────────────────────────────────
  safras: Safra[]
  safraAtiva: Safra | null
  adicionarSafra: (dados: Omit<Safra, 'id' | 'criadoEm'>) => Safra
  ativarSafra: (id: string) => void
  removerSafra: (id: string) => void

  // ── Estoque ───────────────────────────────────────────────────
  insumos: Insumo[]
  movimentacoes: MovimentacaoEstoque[]
  adicionarInsumo: (dados: Omit<Insumo, 'id' | 'criadoEm'>) => Insumo
  removerInsumo: (id: string) => void
  registrarEntradaEstoque: (insumoId: string, quantidade: number, observacao?: string) => void
  estoqueAtual: (insumoId: string) => number

  // ── Entradas (vendas) ─────────────────────────────────────────
  entradas: Entrada[]
  adicionarEntrada: (dados: Omit<Entrada, 'id' | 'criadoEm'>) => Entrada
  removerEntrada: (id: string) => void
  totalEntradasPorArea: (areaId: string) => number

  // ── Utilitários ───────────────────────────────────────────────
  todosTagsUsados: string[]
}

const DataContext = React.createContext<DataContextValue | null>(null)

function erroDB(operacao: string, error: unknown) {
  console.error(`[Supabase] Erro em "${operacao}":`, error)
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [carregando, setCarregando] = React.useState(true)
  const [areas, setAreas] = React.useState<Area[]>([])
  const [despesas, setDespesas] = React.useState<Despesa[]>([])
  const [safras, setSafras] = React.useState<Safra[]>([])
  const [insumos, setInsumos] = React.useState<Insumo[]>([])
  const [movimentacoes, setMovimentacoes] = React.useState<MovimentacaoEstoque[]>([])
  const [entradas, setEntradas] = React.useState<Entrada[]>([])

  // ── Carga inicial ─────────────────────────────────────────────
  React.useEffect(() => {
    Promise.all([
      db.from('areas').select('*').order('criado_em'),
      db.from('despesas').select('*').order('data', { ascending: false }),
      db.from('safras').select('*').order('criado_em'),
      db.from('insumos').select('*').order('nome'),
      db.from('movimentacoes').select('*').order('criado_em'),
      db.from('entradas').select('*').order('data', { ascending: false }),
    ]).then(([a, d, s, i, m, e]) => {
      if (a.data) setAreas(a.data.map(mapArea))
      if (d.data) setDespesas(d.data.map(mapDespesa))
      if (s.data) setSafras(s.data.map(mapSafra))
      if (i.data) setInsumos(i.data.map(mapInsumo))
      if (m.data) setMovimentacoes(m.data.map(mapMovimentacao))
      if (e.data) setEntradas(e.data.map(mapEntrada))
      setCarregando(false)
    }).catch((err) => {
      erroDB('carga inicial', err)
      setCarregando(false)
    })
  }, [])

  // ── Áreas ─────────────────────────────────────────────────────

  const adicionarArea: DataContextValue['adicionarArea'] = (dados) => {
    const area: Area = {
      id: gerarId(),
      nome: dados.nome,
      cor: dados.cor,
      poligono: dados.poligono,
      hectares: poligonoHectares(dados.poligono),
      cultura: dados.cultura,
      orcamento: dados.orcamento,
      criadoEm: new Date().toISOString(),
    }
    setAreas((prev) => [...prev, area])
    db.from('areas').insert(rowArea(area)).then(({ error }) => {
      if (error) erroDB('adicionarArea', error)
    })
    return area
  }

  const atualizarArea: DataContextValue['atualizarArea'] = (id, dados) => {
    let atualizada: Area | undefined
    setAreas((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const next = { ...a, ...dados }
        if (dados.poligono) next.hectares = poligonoHectares(dados.poligono)
        atualizada = next
        return next
      })
    )
    if (atualizada) {
      const { id: _id, criado_em: _c, ...campos } = rowArea(atualizada)
      db.from('areas').update(campos).eq('id', id).then(({ error }) => {
        if (error) erroDB('atualizarArea', error)
      })
    }
  }

  const removerArea: DataContextValue['removerArea'] = (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id))
    setDespesas((prev) => prev.filter((d) => d.areaId !== id))
    setEntradas((prev) => prev.filter((e) => e.areaId !== id))
    db.from('areas').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerArea', error)
    })
  }

  const totalPorArea = React.useCallback(
    (areaId: string) =>
      despesas.filter((d) => d.areaId === areaId).reduce((s, d) => s + d.valor, 0),
    [despesas]
  )

  // ── Despesas ──────────────────────────────────────────────────

  const adicionarDespesa: DataContextValue['adicionarDespesa'] = (dados) => {
    const despesa: Despesa = {
      ...dados,
      tags: dados.tags ?? [],
      id: gerarId(),
      criadoEm: new Date().toISOString(),
    }
    setDespesas((prev) => [...prev, despesa])

    // Débito automático de estoque
    let mov: MovimentacaoEstoque | undefined
    if (dados.insumoId && dados.quantidadeInsumo && dados.quantidadeInsumo > 0) {
      mov = {
        id: gerarId(),
        insumoId: dados.insumoId,
        tipo: 'saida',
        quantidade: dados.quantidadeInsumo,
        despesaId: despesa.id,
        criadoEm: new Date().toISOString(),
      }
      setMovimentacoes((prev) => [...prev, mov!])
    }

    const ops = [db.from('despesas').insert(rowDespesa(despesa))]
    if (mov) ops.push(db.from('movimentacoes').insert(rowMovimentacao(mov)))
    Promise.all(ops).then(([r1, r2]) => {
      if (r1.error) erroDB('adicionarDespesa', r1.error)
      if (r2?.error) erroDB('adicionarDespesa/movimentacao', r2.error)
    })

    return despesa
  }

  const removerDespesa: DataContextValue['removerDespesa'] = (id) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id))
    setMovimentacoes((prev) => prev.filter((m) => m.despesaId !== id))
    db.from('despesas').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerDespesa', error)
    })
  }

  // ── Safras ────────────────────────────────────────────────────

  const safraAtiva = React.useMemo(
    () => safras.find((s) => s.ativa) ?? null,
    [safras]
  )

  const adicionarSafra: DataContextValue['adicionarSafra'] = (dados) => {
    const safra: Safra = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setSafras((prev) => {
      const base = dados.ativa ? prev.map((s) => ({ ...s, ativa: false })) : prev
      return [...base, safra]
    })
    const ops = dados.ativa
      ? [
          db.from('safras').update({ ativa: false }).neq('id', safra.id),
          db.from('safras').insert(rowSafra(safra)),
        ]
      : [db.from('safras').insert(rowSafra(safra))]
    Promise.all(ops).then((results) => {
      results.forEach((r) => { if (r.error) erroDB('adicionarSafra', r.error) })
    })
    return safra
  }

  const ativarSafra: DataContextValue['ativarSafra'] = (id) => {
    setSafras((prev) => prev.map((s) => ({ ...s, ativa: s.id === id })))
    Promise.all([
      db.from('safras').update({ ativa: false }).neq('id', id),
      db.from('safras').update({ ativa: true }).eq('id', id),
    ]).then(([r1, r2]) => {
      if (r1.error) erroDB('ativarSafra/desativar', r1.error)
      if (r2.error) erroDB('ativarSafra/ativar', r2.error)
    })
  }

  const removerSafra: DataContextValue['removerSafra'] = (id) => {
    setSafras((prev) => prev.filter((s) => s.id !== id))
    db.from('safras').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerSafra', error)
    })
  }

  // ── Estoque ───────────────────────────────────────────────────

  const adicionarInsumo: DataContextValue['adicionarInsumo'] = (dados) => {
    const insumo: Insumo = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setInsumos((prev) => [...prev, insumo])
    db.from('insumos').insert(rowInsumo(insumo)).then(({ error }) => {
      if (error) erroDB('adicionarInsumo', error)
    })
    return insumo
  }

  const removerInsumo: DataContextValue['removerInsumo'] = (id) => {
    setInsumos((prev) => prev.filter((i) => i.id !== id))
    setMovimentacoes((prev) => prev.filter((m) => m.insumoId !== id))
    db.from('insumos').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerInsumo', error)
    })
  }

  const registrarEntradaEstoque: DataContextValue['registrarEntradaEstoque'] = (
    insumoId, quantidade, observacao
  ) => {
    const mov: MovimentacaoEstoque = {
      id: gerarId(),
      insumoId,
      tipo: 'entrada',
      quantidade,
      observacao,
      criadoEm: new Date().toISOString(),
    }
    setMovimentacoes((prev) => [...prev, mov])
    db.from('movimentacoes').insert(rowMovimentacao(mov)).then(({ error }) => {
      if (error) erroDB('registrarEntradaEstoque', error)
    })
  }

  const estoqueAtual = React.useCallback(
    (insumoId: string) =>
      movimentacoes
        .filter((m) => m.insumoId === insumoId)
        .reduce((acc, m) => (m.tipo === 'entrada' ? acc + m.quantidade : acc - m.quantidade), 0),
    [movimentacoes]
  )

  // ── Entradas (vendas) ─────────────────────────────────────────

  const adicionarEntrada: DataContextValue['adicionarEntrada'] = (dados) => {
    const entrada: Entrada = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setEntradas((prev) => [...prev, entrada])
    db.from('entradas').insert(rowEntrada(entrada)).then(({ error }) => {
      if (error) erroDB('adicionarEntrada', error)
    })
    return entrada
  }

  const removerEntrada: DataContextValue['removerEntrada'] = (id) => {
    setEntradas((prev) => prev.filter((e) => e.id !== id))
    db.from('entradas').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerEntrada', error)
    })
  }

  const totalEntradasPorArea = React.useCallback(
    (areaId: string) =>
      entradas.filter((e) => e.areaId === areaId).reduce((s, e) => s + e.total, 0),
    [entradas]
  )

  // ── Utilitários ───────────────────────────────────────────────

  const todosTagsUsados = React.useMemo(() => {
    const set = new Set<string>()
    despesas.forEach((d) => d.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [despesas])

  return (
    <DataContext.Provider
      value={{
        carregando,
        areas, adicionarArea, atualizarArea, removerArea, totalPorArea,
        despesas, adicionarDespesa, removerDespesa,
        safras, safraAtiva, adicionarSafra, ativarSafra, removerSafra,
        insumos, movimentacoes, adicionarInsumo, removerInsumo,
        registrarEntradaEstoque, estoqueAtual,
        entradas, adicionarEntrada, removerEntrada, totalEntradasPorArea,
        todosTagsUsados,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = React.useContext(DataContext)
  if (!ctx) throw new Error('useData deve ser usado dentro de <DataProvider>')
  return ctx
}
