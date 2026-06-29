export interface LatLng {
  lat: number
  lng: number
}

export type CategoriaId =
  | 'diesel'
  | 'adubo'
  | 'semente'
  | 'defensivo'
  | 'mao_de_obra'
  | 'manutencao'
  | 'outros'

export type AtividadeId =
  | 'plantio'
  | 'colheita'
  | 'pulverizacao'
  | 'adubacao'
  | 'irrigacao'
  | 'manutencao'
  | 'outro'

export interface Area {
  id: string
  nome: string
  cor: string
  poligono: LatLng[]
  hectares: number
  cultura?: string
  orcamento?: number
  criadoEm: string
}

export interface Despesa {
  id: string
  areaId: string
  categoria: CategoriaId
  valor: number
  data: string
  descricao?: string
  criadoEm: string
  lancadoPorId?: string
  // Novas fields (opcionais para compatibilidade com dados antigos)
  safraId?: string
  tipoAtividade?: AtividadeId
  tags?: string[]
  insumoId?: string
  quantidadeInsumo?: number
}

export interface Safra {
  id: string
  nome: string      // "Soja 24/25"
  cultura: string
  ativa: boolean
  criadoEm: string
}

export interface Insumo {
  id: string
  nome: string
  unidade: string   // "L", "kg", "sc", "un"
  categoriaId?: CategoriaId
  estoqueMinimo?: number
  criadoEm: string
}

export interface MovimentacaoEstoque {
  id: string
  insumoId: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  despesaId?: string     // saída automática via despesa
  observacao?: string
  criadoEm: string
}

export interface Entrada {
  id: string
  areaId: string
  safraId?: string
  cultura: string
  quantidade: number
  unidade: 'sc' | 'ton'
  precoUnitario: number
  total: number
  comprador?: string
  data: string
  criadoEm: string
}

export type Role = 'admin' | 'funcionario'

export interface Usuario {
  id: string
  nome: string
  login: string
  senhaHash: string
  role: Role
  ativo: boolean
  criadoEm: string
}
