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
  /** Cor usada para o polígono no mapa (hex). */
  cor: string
  /** Vértices do polígono que delimita a área. */
  poligono: LatLng[]
  /** Área calculada a partir da geometria, em hectares. */
  hectares: number
  /** Cultura plantada (opcional), ex.: "Soja", "Milho". */
  cultura?: string
  /** Orçamento planejado para a área em reais (opcional). */
  orcamento?: number
  criadoEm: string
}

/** Um lançamento de despesa associado a uma área. */
export interface Despesa {
  id: string
  areaId: string
  categoria: CategoriaId
  /** Valor em reais. */
  valor: number
  /** Data da despesa no formato ISO (YYYY-MM-DD). */
  data: string
  descricao?: string
  criadoEm: string
}
