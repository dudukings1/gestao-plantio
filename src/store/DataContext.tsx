import * as React from 'react'
import type { Area, Despesa, LatLng } from '@/lib/types'
import { gerarId, load, save } from '@/lib/storage'
import { poligonoHectares } from '@/lib/geo'

interface DataContextValue {
  areas: Area[]
  despesas: Despesa[]
  // Áreas
  adicionarArea: (dados: {
    nome: string
    cor: string
    poligono: LatLng[]
    cultura?: string
    orcamento?: number
  }) => Area
  atualizarArea: (id: string, dados: Partial<Omit<Area, 'id' | 'criadoEm'>>) => void
  removerArea: (id: string) => void
  // Despesas
  adicionarDespesa: (dados: Omit<Despesa, 'id' | 'criadoEm'>) => Despesa
  removerDespesa: (id: string) => void
  // Seletores
  totalPorArea: (areaId: string) => number
}

const DataContext = React.createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [areas, setAreas] = React.useState<Area[]>(() =>
    load<Area[]>('areas', [])
  )
  const [despesas, setDespesas] = React.useState<Despesa[]>(() =>
    load<Despesa[]>('despesas', [])
  )

  React.useEffect(() => {
    save('areas', areas)
  }, [areas])

  React.useEffect(() => {
    save('despesas', despesas)
  }, [despesas])

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
        if (dados.poligono) {
          atualizada.hectares = poligonoHectares(dados.poligono)
        }
        return atualizada
      })
    )
  }

  const removerArea: DataContextValue['removerArea'] = (id) => {
    setAreas((prev) => prev.filter((a) => a.id !== id))
    // remove também as despesas órfãs da área
    setDespesas((prev) => prev.filter((d) => d.areaId !== id))
  }

  const adicionarDespesa: DataContextValue['adicionarDespesa'] = (dados) => {
    const despesa: Despesa = {
      ...dados,
      id: gerarId(),
      criadoEm: new Date().toISOString(),
    }
    setDespesas((prev) => [...prev, despesa])
    return despesa
  }

  const removerDespesa: DataContextValue['removerDespesa'] = (id) => {
    setDespesas((prev) => prev.filter((d) => d.id !== id))
  }

  const totalPorArea: DataContextValue['totalPorArea'] = React.useCallback(
    (areaId) =>
      despesas
        .filter((d) => d.areaId === areaId)
        .reduce((soma, d) => soma + d.valor, 0),
    [despesas]
  )

  const value: DataContextValue = {
    areas,
    despesas,
    adicionarArea,
    atualizarArea,
    removerArea,
    adicionarDespesa,
    removerDespesa,
    totalPorArea,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = React.useContext(DataContext)
  if (!ctx) {
    throw new Error('useData deve ser usado dentro de <DataProvider>')
  }
  return ctx
}
