import type { Categoria } from './types'

export const CATEGORIAS_PADRAO: Omit<Categoria, 'criadoEm'>[] = [
  { id: 'diesel',      nome: 'Diesel',       cor: '#f59e0b' },
  { id: 'adubo',       nome: 'Adubo',        cor: '#16a34a' },
  { id: 'semente',     nome: 'Semente',      cor: '#a16207' },
  { id: 'defensivo',   nome: 'Defensivo',    cor: '#dc2626' },
  { id: 'mao_de_obra', nome: 'Mão de obra',  cor: '#2563eb' },
  { id: 'manutencao',  nome: 'Manutenção',   cor: '#7c3aed' },
  { id: 'outros',      nome: 'Outros',       cor: '#64748b' },
]

export function getCategoriaNome(categorias: Categoria[], id: string): string {
  return categorias.find((c) => c.id === id)?.nome ?? id
}

export function getCategoriaCor(categorias: Categoria[], id: string): string {
  return categorias.find((c) => c.id === id)?.cor ?? '#64748b'
}
