import { createClient } from '@supabase/supabase-js'
import type {
  Area, Categoria, Despesa, Insumo, LatLng, MovimentacaoEstoque,
  ProdutoColhido, Safra, TagCadastrada, Usuario,
} from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const db = createClient(url, key)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

// ── Mappers ─────────────────────────────────────────────────────

export const mapArea = (r: Row): Area => ({
  id: r.id, nome: r.nome, cor: r.cor,
  poligono: r.poligono as LatLng[],
  hectares: Number(r.hectares),
  cultura: r.cultura ?? undefined,
  orcamento: r.orcamento != null ? Number(r.orcamento) : undefined,
  criadoEm: r.criado_em,
})

export const mapDespesa = (r: Row): Despesa => ({
  id: r.id, areaId: r.area_id, categoria: r.categoria,
  valor: Number(r.valor), data: r.data,
  descricao: r.descricao ?? undefined,
  lancadoPorId: r.lancado_por_id ?? undefined,
  safraId: r.safra_id ?? undefined,
  tags: r.tags ?? [],
  insumoId: r.insumo_id ?? undefined,
  quantidadeInsumo: r.quantidade_insumo != null ? Number(r.quantidade_insumo) : undefined,
  criadoEm: r.criado_em,
})

export const mapSafra = (r: Row): Safra => ({
  id: r.id, nome: r.nome, cultura: r.cultura, ativa: r.ativa, criadoEm: r.criado_em,
})

export const mapInsumo = (r: Row): Insumo => ({
  id: r.id, nome: r.nome, unidade: r.unidade,
  categoriaId: r.categoria_id ?? undefined,
  estoqueMinimo: r.estoque_minimo != null ? Number(r.estoque_minimo) : undefined,
  criadoEm: r.criado_em,
})

export const mapMovimentacao = (r: Row): MovimentacaoEstoque => ({
  id: r.id, insumoId: r.insumo_id,
  tipo: r.tipo as 'entrada' | 'saida',
  quantidade: Number(r.quantidade),
  despesaId: r.despesa_id ?? undefined,
  observacao: r.observacao ?? undefined,
  criadoEm: r.criado_em,
})

export const mapCategoria = (r: Row): Categoria => ({
  id: r.id, nome: r.nome, cor: r.cor, criadoEm: r.criado_em,
})

export const mapTagCadastrada = (r: Row): TagCadastrada => ({
  id: r.id, nome: r.nome, criadoEm: r.criado_em,
})

export const mapProdutoColhido = (r: Row): ProdutoColhido => ({
  id: r.id, areaId: r.area_id,
  safraId: r.safra_id ?? undefined,
  cultura: r.cultura,
  tipo: (r.tipo as 'entrada' | 'saida' | undefined) ?? 'entrada',
  quantidade: Number(r.quantidade),
  unidade: r.unidade, data: r.data,
  observacao: r.observacao ?? undefined,
  criadoEm: r.criado_em,
})

export const mapUsuario = (r: Row): Usuario => ({
  id: r.id, nome: r.nome, login: r.login, senhaHash: r.senha_hash,
  role: r.role as 'admin' | 'funcionario', ativo: r.ativo, criadoEm: r.criado_em,
})

// ── Serializers ──────────────────────────────────────────────────

export const rowArea = (a: Area) => ({
  id: a.id, nome: a.nome, cor: a.cor, poligono: a.poligono,
  hectares: a.hectares, cultura: a.cultura ?? null,
  orcamento: a.orcamento ?? null, criado_em: a.criadoEm,
})

export const rowDespesa = (d: Despesa) => ({
  id: d.id, area_id: d.areaId, categoria: d.categoria, valor: d.valor,
  data: d.data, descricao: d.descricao ?? null, lancado_por_id: d.lancadoPorId ?? null,
  safra_id: d.safraId ?? null, tags: d.tags ?? [],
  insumo_id: d.insumoId ?? null, quantidade_insumo: d.quantidadeInsumo ?? null,
  criado_em: d.criadoEm,
})

export const rowSafra = (s: Safra) => ({
  id: s.id, nome: s.nome, cultura: s.cultura, ativa: s.ativa, criado_em: s.criadoEm,
})

export const rowInsumo = (i: Insumo) => ({
  id: i.id, nome: i.nome, unidade: i.unidade,
  categoria_id: i.categoriaId ?? null,
  estoque_minimo: i.estoqueMinimo ?? null, criado_em: i.criadoEm,
})

export const rowMovimentacao = (m: MovimentacaoEstoque) => ({
  id: m.id, insumo_id: m.insumoId, tipo: m.tipo, quantidade: m.quantidade,
  despesa_id: m.despesaId ?? null, observacao: m.observacao ?? null, criado_em: m.criadoEm,
})

export const rowCategoria = (c: Categoria) => ({
  id: c.id, nome: c.nome, cor: c.cor, criado_em: c.criadoEm,
})

export const rowTagCadastrada = (t: TagCadastrada) => ({
  id: t.id, nome: t.nome, criado_em: t.criadoEm,
})

export const rowProdutoColhido = (p: ProdutoColhido) => ({
  id: p.id, area_id: p.areaId, safra_id: p.safraId ?? null,
  cultura: p.cultura, tipo: p.tipo, quantidade: p.quantidade, unidade: p.unidade,
  data: p.data, observacao: p.observacao ?? null, criado_em: p.criadoEm,
})

export const rowUsuario = (u: Usuario) => ({
  id: u.id, nome: u.nome, login: u.login, senha_hash: u.senhaHash,
  role: u.role, ativo: u.ativo, criado_em: u.criadoEm,
})
