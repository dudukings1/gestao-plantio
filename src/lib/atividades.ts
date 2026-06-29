import type { AtividadeId } from './types'

export interface Atividade {
  id: AtividadeId
  nome: string
  cor: string
}

export const ATIVIDADES: Atividade[] = [
  { id: 'plantio',      nome: 'Plantio',       cor: '#22c55e' },
  { id: 'colheita',     nome: 'Colheita',       cor: '#f59e0b' },
  { id: 'pulverizacao', nome: 'Pulverização',   cor: '#3b82f6' },
  { id: 'adubacao',     nome: 'Adubação',       cor: '#8b5cf6' },
  { id: 'irrigacao',    nome: 'Irrigação',      cor: '#06b6d4' },
  { id: 'manutencao',   nome: 'Manutenção',     cor: '#f97316' },
  { id: 'outro',        nome: 'Outro',          cor: '#6b7280' },
]

export function getAtividade(id: AtividadeId): Atividade {
  return ATIVIDADES.find((a) => a.id === id) ?? ATIVIDADES[ATIVIDADES.length - 1]
}
