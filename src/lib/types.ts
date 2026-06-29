/** Coordenada geográfica (latitude/longitude). */
export interface LatLng {
  lat: number
  lng: number
}

/** Identificadores das categorias de despesa. */
export type CategoriaId =
  | 'diesel'
  | 'adubo'
  | 'semente'
  | 'defensivo'
  | 'mao_de_obra'
  | 'manutencao'
  | 'outros'

/** Uma área de plantio (talhão) desenhada sobre o mapa. */
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

/** Um lançamento de despesa associado a uma área. */
export interface Despesa {
  id: string
  areaId: string
  categoria: CategoriaId
  valor: number
  data: string
  descricao?: string
  criadoEm: string
  /** ID do usuário que registrou a despesa (opcional para compatibilidade com dados antigos). */
  lancadoPorId?: string
}

/** Roles disponíveis no sistema. */
export type Role = 'admin' | 'funcionario'

/** Usuário do sistema. */
export interface Usuario {
  id: string
  nome: string
  login: string
  senhaHash: string
  role: Role
  ativo: boolean
  criadoEm: string
}
