export interface LatLng {
  lat: number
  lng: number
}

export type CategoriaId = string

export interface Categoria {
  id: string
  nome: string
  cor: string
  criadoEm: string
}

export interface TagCadastrada {
  id: string
  nome: string
  criadoEm: string
}

export interface ProdutoColhido {
  id: string
  areaId: string
  safraId?: string
  cultura: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  unidade: string
  data: string
  observacao?: string
  criadoEm: string
}

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
  categoria: string
  valor: number
  data: string
  descricao?: string
  criadoEm: string
  lancadoPorId?: string
  safraId?: string
  tags?: string[]
  insumoId?: string
  quantidadeInsumo?: number
}

export interface Safra {
  id: string
  nome: string
  cultura: string
  ativa: boolean
  criadoEm: string
}

export interface Insumo {
  id: string
  nome: string
  unidade: string
  categoriaId?: string
  estoqueMinimo?: number
  criadoEm: string
}

export interface MovimentacaoEstoque {
  id: string
  insumoId: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  despesaId?: string
  observacao?: string
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
