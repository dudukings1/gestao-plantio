import * as React from 'react'
import type {
  Area, Despesa, Entrada, Insumo, LatLng, MovimentacaoEstoque, Safra,
} from '@/lib/types'
import { gerarId, load, save } from '@/lib/storage'
import { poligonoHectares } from '@/lib/geo'

interface DataContextValue {
  // ── Existentes ──────────────────────────────────────────────
  areas: Area[]
  despesas: Despesa[]
  adicionarArea: (dados: { nome: string; cor: string; poligono: LatLng[]; cultura?: string; orcamento?: number }) => Area
  atualizarArea: (id: string, dados: Partial<Omit<Area, 'id' | 'criadoEm'>>) => void
  removerArea: (id: string) => void
  adicionarDespesa: (dados: Omit<Despesa, 'id' | 'criadoEm'>) => Despesa
  removerDespesa: (id: string) => void
  totalPorArea: (areaId: string) => number

  // ── Safras ───────────────────────────────────────────────────
  safras: Safra[]
  safraAtiva: Safra | null
  adicionarSafra: (dados: Omit<Safra, 'id' | 'criadoEm'>) => Safra
  ativarSafra: (id: string) => void
  removerSafra: (id: string) => void

  // ── Estoque ──────────────────────────────────────────────────
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = React.useState<Area[]>(() => load<Area[]>('areas', []))
  const [despesas, setDespesas] = React.useState<Despesa[]>(() => load<Despesa[]>('despesas', []))
  const [safras, setSafras] = React.useState<Safra[]>(() => load<Safra[]>('safras', []))
  const [insumos, setInsumos] = React.useState<Insumo[]>(() => load<Insumo[]>('insumos', []))
  const [movimentacoes, setMovimentacoes] = React.useState<MovimentacaoEstoque[]>(() =>
    load<MovimentacaoEstoque[]>('movimentacoes', [])
  )
  const [entradas, setEntradas] = React.useState<Entrada[]>(() => load<Entrada[]>('entradas', []))

  React.useEffect(() => { save('areas', areas) }, [areas])
  React.useEffect(() => { save('despesas', despesas) }, [despesas])
  React.useEffect(() => { save('safras', safras) }, [safras])
  React.useEffect(() => { save('insumos', insumos) }, [insumos])
  React.useEffect(() => { save('movimentacoes', movimentacoes) }, [movimentacoes])
  React.useEffect(() => { save('entradas', entradas) }, [entradas])

  // ── Áreas ────────────────────────────────────────────────────

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
    return area
  }

  const atualizarArea: DataContextValue['atualizarArea'] = (id, dados) => {
    setAreas((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a
        const atualizada = { ...a, ...dados }
        if (dados.poligono) atualizada.hectares = poligonoHectares(dados.poligono)
        return atualizada
      })
    )
  }

  const removerArea: DataContextValue['removerArea'] = (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id))
    setDespesas((prev) => prev.filter((d) => d.areaId !== id))
    setEntradas((prev) => prev.filter((e) => e.areaId !== id))
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

    // Débito automático no estoque se insumo vinculado
    if (dados.insumoId && dados.quantidadeInsumo && dados.quantidadeInsumo > 0) {
      const mov: MovimentacaoEstoque = {
        id: gerarId(),
        insumoId: dados.insumoId,
        tipo: 'saida',
        quantidade: dados.quantidadeInsumo,
        despesaId: despesa.id,
        criadoEm: new Date().toISOString(),
      }
      setMovimentacoes((prev) => [...prev, mov])
    }

    return despesa
  }

  const removerDespesa: DataContextValue['removerDespesa'] = (id) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id))
    // Remove movimentação de estoque associada
    setMovimentacoes((prev) => prev.filter((m) => m.despesaId !== id))
  }

  // ── Safras ────────────────────────────────────────────────────

  const safraAtiva = React.useMemo(
    () => safras.find((s) => s.ativa) ?? null,
    [safras]
  )

  const adicionarSafra: DataContextValue['adicionarSafra'] = (dados) => {
    const safra: Safra = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setSafras((prev) => {
      // Se a nova for ativa, desativa as demais
      const base = dados.ativa ? prev.map((s) => ({ ...s, ativa: false })) : prev
      return [...base, safra]
    })
    return safra
  }

  const ativarSafra: DataContextValue['ativarSafra'] = (id) => {
    setSafras((prev) => prev.map((s) => ({ ...s, ativa: s.id === id })))
  }

  const removerSafra: DataContextValue['removerSafra'] = (id) => {
    setSafras((prev) => prev.filter((s) => s.id !== id))
  }

  // ── Estoque ───────────────────────────────────────────────────

  const adicionarInsumo: DataContextValue['adicionarInsumo'] = (dados) => {
    const insumo: Insumo = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setInsumos((prev) => [...prev, insumo])
    return insumo
  }

  const removerInsumo: DataContextValue['removerInsumo'] = (id) => {
    setInsumos((prev) => prev.filter((i) => i.id !== id))
    setMovimentacoes((prev) => prev.filter((m) => m.insumoId !== id))
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
    return entrada
  }

  const removerEntrada: DataContextValue['removerEntrada'] = (id) => {
    setEntradas((prev) => prev.filter((e) => e.id !== id))
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
        areas, despesas, adicionarArea, atualizarArea, removerArea,
        adicionarDespesa, removerDespesa, totalPorArea,
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
