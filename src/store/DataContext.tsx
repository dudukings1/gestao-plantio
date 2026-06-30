import * as React from 'react'
import type {
  Area, Categoria, Despesa, Insumo, LatLng,
  MovimentacaoEstoque, ProdutoColhido, Safra, TagCadastrada,
} from '@/lib/types'
import { gerarId } from '@/lib/storage'
import { poligonoHectares } from '@/lib/geo'
import { CATEGORIAS_PADRAO } from '@/lib/categories'
import {
  db,
  mapArea, mapDespesa, mapSafra, mapInsumo, mapMovimentacao,
  mapCategoria, mapTagCadastrada, mapProdutoColhido,
  rowArea, rowDespesa, rowSafra, rowInsumo, rowMovimentacao,
  rowCategoria, rowTagCadastrada, rowProdutoColhido,
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
  toggleSafra: (id: string) => void
  removerSafra: (id: string) => void

  // ── Estoque (insumos) ─────────────────────────────────────────
  insumos: Insumo[]
  movimentacoes: MovimentacaoEstoque[]
  adicionarInsumo: (dados: Omit<Insumo, 'id' | 'criadoEm'>) => Insumo
  atualizarInsumo: (id: string, dados: Partial<Pick<Insumo, 'nome' | 'unidade' | 'estoqueMinimo'>>) => void
  removerInsumo: (id: string) => void
  registrarEntradaEstoque: (insumoId: string, quantidade: number, observacao?: string) => void
  atualizarMovimentacao: (id: string, dados: { quantidade?: number; observacao?: string }) => void
  removerMovimentacao: (id: string) => void
  estoqueAtual: (insumoId: string) => number

  // ── Produtos colhidos ─────────────────────────────────────────
  produtosColhidos: ProdutoColhido[]
  adicionarProdutoColhido: (dados: Omit<ProdutoColhido, 'id' | 'criadoEm'>) => ProdutoColhido
  removerProdutoColhido: (id: string) => void

  // ── Categorias ────────────────────────────────────────────────
  categorias: Categoria[]
  adicionarCategoria: (dados: { nome: string; cor: string }) => Categoria
  removerCategoria: (id: string) => void

  // ── Tags cadastradas ──────────────────────────────────────────
  tagsCadastradas: TagCadastrada[]
  adicionarTagCadastrada: (nome: string) => TagCadastrada
  removerTagCadastrada: (id: string) => void

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
  const [produtosColhidos, setProdutosColhidos] = React.useState<ProdutoColhido[]>([])
  const [categorias, setCategorias] = React.useState<Categoria[]>([])
  const [tagsCadastradas, setTagsCadastradas] = React.useState<TagCadastrada[]>([])

  // ── Carga inicial ─────────────────────────────────────────────
  React.useEffect(() => {
    Promise.all([
      db.from('areas').select('*').order('criado_em'),
      db.from('despesas').select('*').order('data', { ascending: false }),
      db.from('safras').select('*').order('criado_em'),
      db.from('insumos').select('*').order('nome'),
      db.from('movimentacoes').select('*').order('criado_em'),
      db.from('produtos_colhidos').select('*').order('data', { ascending: false }),
      db.from('categorias').select('*').order('nome'),
      db.from('tags_cadastradas').select('*').order('nome'),
    ]).then(([a, d, s, i, m, pc, c, tc]) => {
      if (a.data) setAreas(a.data.map(mapArea))
      if (d.data) setDespesas(d.data.map(mapDespesa))
      if (s.data) setSafras(s.data.map(mapSafra))
      if (i.data) setInsumos(i.data.map(mapInsumo))
      if (m.data) setMovimentacoes(m.data.map(mapMovimentacao))
      if (pc.data) setProdutosColhidos(pc.data.map(mapProdutoColhido))
      if (tc.data) setTagsCadastradas(tc.data.map(mapTagCadastrada))

      // Seed categorias padrão na primeira execução
      if (c.data) {
        if (c.data.length === 0) {
          const agora = new Date().toISOString()
          const seed: Categoria[] = CATEGORIAS_PADRAO.map((cat) => ({ ...cat, criadoEm: agora }))
          db.from('categorias').insert(seed.map(rowCategoria))
          setCategorias(seed)
        } else {
          setCategorias(c.data.map(mapCategoria))
        }
      }

      setCarregando(false)
    }).catch((err) => {
      erroDB('carga inicial', err)
      setCarregando(false)
    })
  }, [])

  // ── Áreas ─────────────────────────────────────────────────────

  const adicionarArea: DataContextValue['adicionarArea'] = (dados) => {
    const area: Area = {
      id: gerarId(), nome: dados.nome, cor: dados.cor, poligono: dados.poligono,
      hectares: poligonoHectares(dados.poligono),
      cultura: dados.cultura, orcamento: dados.orcamento,
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
    setProdutosColhidos((prev) => prev.filter((p) => p.areaId !== id))
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
      ...dados, tags: dados.tags ?? [], id: gerarId(), criadoEm: new Date().toISOString(),
    }
    setDespesas((prev) => [...prev, despesa])

    let mov: MovimentacaoEstoque | undefined
    if (dados.insumoId && dados.quantidadeInsumo && dados.quantidadeInsumo > 0) {
      mov = {
        id: gerarId(), insumoId: dados.insumoId, tipo: 'saida',
        quantidade: dados.quantidadeInsumo, despesaId: despesa.id,
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
    setSafras((prev) => [...prev, safra])
    db.from('safras').insert(rowSafra(safra)).then(({ error }) => {
      if (error) erroDB('adicionarSafra', error)
    })
    return safra
  }

  const toggleSafra: DataContextValue['toggleSafra'] = (id) => {
    let novoAtiva: boolean | undefined
    setSafras((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        novoAtiva = !s.ativa
        return { ...s, ativa: novoAtiva }
      })
    )
    if (novoAtiva !== undefined) {
      db.from('safras').update({ ativa: novoAtiva }).eq('id', id).then(({ error }) => {
        if (error) erroDB('toggleSafra', error)
      })
    }
  }

  const removerSafra: DataContextValue['removerSafra'] = (id) => {
    setSafras((prev) => prev.filter((s) => s.id !== id))
    db.from('safras').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerSafra', error)
    })
  }

  // ── Estoque (insumos) ─────────────────────────────────────────

  const adicionarInsumo: DataContextValue['adicionarInsumo'] = (dados) => {
    const insumo: Insumo = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setInsumos((prev) => [...prev, insumo])
    db.from('insumos').insert(rowInsumo(insumo)).then(({ error }) => {
      if (error) erroDB('adicionarInsumo', error)
    })
    return insumo
  }

  const atualizarInsumo: DataContextValue['atualizarInsumo'] = (id, dados) => {
    setInsumos((prev) => prev.map((i) => (i.id !== id ? i : { ...i, ...dados })))
    db.from('insumos').update({
      ...(dados.nome !== undefined ? { nome: dados.nome } : {}),
      ...(dados.unidade !== undefined ? { unidade: dados.unidade } : {}),
      ...(dados.estoqueMinimo !== undefined ? { estoque_minimo: dados.estoqueMinimo ?? null } : {}),
    }).eq('id', id).then(({ error }) => {
      if (error) erroDB('atualizarInsumo', error)
    })
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
      id: gerarId(), insumoId, tipo: 'entrada', quantidade,
      observacao, criadoEm: new Date().toISOString(),
    }
    setMovimentacoes((prev) => [...prev, mov])
    db.from('movimentacoes').insert(rowMovimentacao(mov)).then(({ error }) => {
      if (error) erroDB('registrarEntradaEstoque', error)
    })
  }

  const atualizarMovimentacao: DataContextValue['atualizarMovimentacao'] = (id, dados) => {
    setMovimentacoes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...dados } : m))
    )
    db.from('movimentacoes').update({
      ...(dados.quantidade !== undefined ? { quantidade: dados.quantidade } : {}),
      ...(dados.observacao !== undefined ? { observacao: dados.observacao } : {}),
    }).eq('id', id).then(({ error }) => {
      if (error) erroDB('atualizarMovimentacao', error)
    })
  }

  const removerMovimentacao: DataContextValue['removerMovimentacao'] = (id) => {
    setMovimentacoes((prev) => prev.filter((m) => m.id !== id))
    db.from('movimentacoes').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerMovimentacao', error)
    })
  }

  const estoqueAtual = React.useCallback(
    (insumoId: string) =>
      movimentacoes
        .filter((m) => m.insumoId === insumoId)
        .reduce((acc, m) => (m.tipo === 'entrada' ? acc + m.quantidade : acc - m.quantidade), 0),
    [movimentacoes]
  )

  // ── Produtos colhidos ─────────────────────────────────────────

  const adicionarProdutoColhido: DataContextValue['adicionarProdutoColhido'] = (dados) => {
    const prod: ProdutoColhido = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setProdutosColhidos((prev) => [prod, ...prev])
    db.from('produtos_colhidos').insert(rowProdutoColhido(prod)).then(({ error }) => {
      if (error) erroDB('adicionarProdutoColhido', error)
    })
    return prod
  }

  const removerProdutoColhido: DataContextValue['removerProdutoColhido'] = (id) => {
    setProdutosColhidos((prev) => prev.filter((p) => p.id !== id))
    db.from('produtos_colhidos').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerProdutoColhido', error)
    })
  }

  // ── Categorias ────────────────────────────────────────────────

  const adicionarCategoria: DataContextValue['adicionarCategoria'] = (dados) => {
    const cat: Categoria = { ...dados, id: gerarId(), criadoEm: new Date().toISOString() }
    setCategorias((prev) => [...prev, cat])
    db.from('categorias').insert(rowCategoria(cat)).then(({ error }) => {
      if (error) erroDB('adicionarCategoria', error)
    })
    return cat
  }

  const removerCategoria: DataContextValue['removerCategoria'] = (id) => {
    setCategorias((prev) => prev.filter((c) => c.id !== id))
    db.from('categorias').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerCategoria', error)
    })
  }

  // ── Tags cadastradas ──────────────────────────────────────────

  const adicionarTagCadastrada: DataContextValue['adicionarTagCadastrada'] = (nome) => {
    const tag: TagCadastrada = { id: gerarId(), nome: nome.trim(), criadoEm: new Date().toISOString() }
    setTagsCadastradas((prev) => [...prev, tag])
    db.from('tags_cadastradas').insert(rowTagCadastrada(tag)).then(({ error }) => {
      if (error) erroDB('adicionarTagCadastrada', error)
    })
    return tag
  }

  const removerTagCadastrada: DataContextValue['removerTagCadastrada'] = (id) => {
    setTagsCadastradas((prev) => prev.filter((t) => t.id !== id))
    db.from('tags_cadastradas').delete().eq('id', id).then(({ error }) => {
      if (error) erroDB('removerTagCadastrada', error)
    })
  }

  // ── Utilitários ───────────────────────────────────────────────

  const todosTagsUsados = React.useMemo(() => {
    const set = new Set<string>()
    tagsCadastradas.forEach((t) => set.add(t.nome))
    despesas.forEach((d) => d.tags?.forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [tagsCadastradas, despesas])

  return (
    <DataContext.Provider
      value={{
        carregando,
        areas, adicionarArea, atualizarArea, removerArea, totalPorArea,
        despesas, adicionarDespesa, removerDespesa,
        safras, safraAtiva, adicionarSafra, toggleSafra, removerSafra,
        insumos, movimentacoes, adicionarInsumo, atualizarInsumo, removerInsumo,
        registrarEntradaEstoque, atualizarMovimentacao, removerMovimentacao, estoqueAtual,
        produtosColhidos, adicionarProdutoColhido, removerProdutoColhido,
        categorias, adicionarCategoria, removerCategoria,
        tagsCadastradas, adicionarTagCadastrada, removerTagCadastrada,
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
