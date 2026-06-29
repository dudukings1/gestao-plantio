import type { CategoriaId } from './types'

export interface Categoria {
  id: CategoriaId
  nome: string
  /** Cor usada em gráficos e badges (hex). */
  cor: string
}

/**
 * Lista de categorias de despesa.
 * Mantida como configuração central — para adicionar/remover categorias,
 * basta editar este array (e o tipo CategoriaId em types.ts).
 */
export const CATEGORIAS: Categoria[] = [
  { id: 'diesel', nome: 'Diesel', cor: '#f59e0b' },
  { id: 'adubo', nome: 'Adubo', cor: '#16a34a' },
  { id: 'semente', nome: 'Semente', cor: '#a16207' },
  { id: 'defensivo', nome: 'Defensivo', cor: '#dc2626' },
  { id: 'mao_de_obra', nome: 'Mão de obra', cor: '#2563eb' },
  { id: 'manutencao', nome: 'Manutenção', cor: '#7c3aed' },
  { id: 'outros', nome: 'Outros', cor: '#64748b' },
]

const CATEGORIA_POR_ID = new Map(CATEGORIAS.map((c) => [c.id, c]))

export function getCategoria(id: CategoriaId): Categoria {
  return CATEGORIA_POR_ID.get(id) ?? CATEGORIAS[CATEGORIAS.length - 1]
}
