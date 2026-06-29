import { createClient } from '@supabase/supabase-js'
import type { Area, Despesa, Entrada, Insumo, LatLng, MovimentacaoEstoque, Safra, Usuario } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const db = createClient(url, key)

// ── Mappers: linha do banco (snake_case) → tipo TypeScript (camelCase) ──

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

export const mapArea = (r: Row): Area => ({
  id: r.id,
  nome: r.nome,
  cor: r.cor,
  poligono: r.poligono as LatLng[],
  hectares: Number(r.hectares),
  cultura: r.cultura ?? undefined,
  orcamento: r.orcamento != null ? Number(r.orcamento) : undefined,
  criadoEm: r.criado_em,
})

export const mapDespesa = (r: Row): Despesa => ({
  id: r.id,
  areaId: r.area_id,
  categoria: r.categoria,
  valor: Number(r.valor),
  data: r.data,
  descricao: r.descricao ?? undefined,
  lancadoPorId: r.lancado_por_id ?? undefined,
  safraId: r.safra_id ?? undefined,
  tipoAtividade: r.tipo_atividade ?? undefined,
  tags: r.tags ?? [],
  insumoId: r.insumo_id ?? undefined,
  quantidadeInsumo: r.quantidade_insumo != null ? Number(r.quantidade_insumo) : undefined,
  criadoEm: r.criado_em,
})

export const mapSafra = (r: Row): Safra => ({
  id: r.id,
  nome: r.nome,
  cultura: r.cultura,
  ativa: r.ativa,
  criadoEm: r.criado_em,
})

export const mapInsumo = (r: Row): Insumo => ({
  id: r.id,
  nome: r.nome,
  unidade: r.unidade,
  categoriaId: r.categoria_id ?? undefined,
  estoqueMinimo: r.estoque_minimo != null ? Number(r.estoque_minimo) : undefined,
  criadoEm: r.criado_em,
})

export const mapMovimentacao = (r: Row): MovimentacaoEstoque => ({
  id: r.id,
  insumoId: r.insumo_id,
  tipo: r.tipo as 'entrada' | 'saida',
  quantidade: Number(r.quantidade),
  despesaId: r.despesa_id ?? undefined,
  observacao: r.observacao ?? undefined,
  criadoEm: r.criado_em,
})

export const mapEntrada = (r: Row): Entrada => ({
  id: r.id,
  areaId: r.area_id,
  safraId: r.safra_id ?? undefined,
  cultura: r.cultura,
  quantidade: Number(r.quantidade),
  unidade: r.unidade as 'sc' | 'ton',
  precoUnitario: Number(r.preco_unitario),
  total: Number(r.total),
  comprador: r.comprador ?? undefined,
  data: r.data,
  criadoEm: r.criado_em,
})

export const mapUsuario = (r: Row): Usuario => ({
  id: r.id,
  nome: r.nome,
  login: r.login,
  senhaHash: r.senha_hash,
  role: r.role as 'admin' | 'funcionario',
  ativo: r.ativo,
  criadoEm: r.criado_em,
})

// ── Serializers: tipo TypeScript → linha do banco ───────────────

export const rowArea = (a: Area) => ({
  id: a.id, nome: a.nome, cor: a.cor, poligono: a.poligono,
  hectares: a.hectares, cultura: a.cultura ?? null,
  orcamento: a.orcamento ?? null, criado_em: a.criadoEm,
})

export const rowDespesa = (d: Despesa) => ({
  id: d.id, area_id: d.areaId, categoria: d.categoria, valor: d.valor,
  data: d.data, descricao: d.descricao ?? null, lancado_por_id: d.lancadoPorId ?? null,
  safra_id: d.safraId ?? null, tipo_atividade: d.tipoAtividade ?? null,
  tags: d.tags ?? [], insumo_id: d.insumoId ?? null,
  quantidade_insumo: d.quantidadeInsumo ?? null, criado_em: d.criadoEm,
})

export const rowSafra = (s: Safra) => ({
  id: s.id, nome: s.nome, cultura: s.cultura, ativa: s.ativa, criado_em: s.criadoEm,
})

export const rowInsumo = (i: Insumo) => ({
  id: i.id, nome: i.nome, unidade: i.unidade, categoria_id: i.categoriaId ?? null,
  estoque_minimo: i.estoqueMinimo ?? null, criado_em: i.criadoEm,
})

export const rowMovimentacao = (m: MovimentacaoEstoque) => ({
  id: m.id, insumo_id: m.insumoId, tipo: m.tipo, quantidade: m.quantidade,
  despesa_id: m.despesaId ?? null, observacao: m.observacao ?? null, criado_em: m.criadoEm,
})

export const rowEntrada = (e: Entrada) => ({
  id: e.id, area_id: e.areaId, safra_id: e.safraId ?? null, cultura: e.cultura,
  quantidade: e.quantidade, unidade: e.unidade, preco_unitario: e.precoUnitario,
  total: e.total, comprador: e.comprador ?? null, data: e.data, criado_em: e.criadoEm,
})

export const rowUsuario = (u: Usuario) => ({
  id: u.id, nome: u.nome, login: u.login, senha_hash: u.senhaHash,
  role: u.role, ativo: u.ativo, criado_em: u.criadoEm,
})
