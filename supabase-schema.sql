-- ============================================================
-- Gestão Plantio — Schema Supabase
-- Execute no SQL Editor do Supabase (https://supabase.com)
-- ============================================================
-- RLS habilitado em todas as tabelas.
-- Política: anon key tem acesso total (app privado com auth própria).
-- A segurança real vem do login da aplicação — sem senha, sem acesso.
-- ============================================================

-- ── Helpers ──────────────────────────────────────────────────
-- Macro para habilitar RLS + criar política permissiva para anon.
-- Chamada manualmente para cada tabela abaixo.

-- ── Usuários (auth customizada — sem Supabase Auth) ───────────
create table if not exists usuarios (
  id          text        primary key,
  nome        text        not null,
  login       text        not null unique,
  senha_hash  text        not null,
  role        text        not null check (role in ('admin', 'funcionario')),
  ativo       boolean     not null default true,
  criado_em   timestamptz not null default now()
);
alter table usuarios enable row level security;
drop policy if exists "anon_all" on usuarios;
create policy "anon_all" on usuarios for all to anon using (true) with check (true);

-- ── Áreas de plantio ─────────────────────────────────────────
create table if not exists areas (
  id          text        primary key,
  nome        text        not null,
  cor         text        not null,
  poligono    jsonb       not null,
  hectares    numeric     not null,
  cultura     text,
  orcamento   numeric,
  criado_em   timestamptz not null default now()
);
alter table areas enable row level security;
drop policy if exists "anon_all" on areas;
create policy "anon_all" on areas for all to anon using (true) with check (true);

-- ── Safras ───────────────────────────────────────────────────
create table if not exists safras (
  id          text        primary key,
  nome        text        not null,
  cultura     text        not null default '',
  ativa       boolean     not null default false,
  criado_em   timestamptz not null default now()
);
alter table safras enable row level security;
drop policy if exists "anon_all" on safras;
create policy "anon_all" on safras for all to anon using (true) with check (true);

-- ── Insumos ──────────────────────────────────────────────────
create table if not exists insumos (
  id              text        primary key,
  nome            text        not null,
  unidade         text        not null,
  categoria_id    text,
  estoque_minimo  numeric,
  criado_em       timestamptz not null default now()
);
alter table insumos enable row level security;
drop policy if exists "anon_all" on insumos;
create policy "anon_all" on insumos for all to anon using (true) with check (true);

-- ── Despesas ─────────────────────────────────────────────────
create table if not exists despesas (
  id                  text        primary key,
  area_id             text        not null references areas(id) on delete cascade,
  categoria           text        not null,
  valor               numeric     not null,
  data                date        not null,
  descricao           text,
  lancado_por_id      text,
  safra_id            text        references safras(id) on delete set null,
  tipo_atividade      text,
  tags                text[]      not null default '{}',
  insumo_id           text        references insumos(id) on delete set null,
  quantidade_insumo   numeric,
  criado_em           timestamptz not null default now()
);
alter table despesas enable row level security;
drop policy if exists "anon_all" on despesas;
create policy "anon_all" on despesas for all to anon using (true) with check (true);

-- ── Movimentações de estoque ──────────────────────────────────
create table if not exists movimentacoes (
  id          text        primary key,
  insumo_id   text        not null references insumos(id) on delete cascade,
  tipo        text        not null check (tipo in ('entrada', 'saida')),
  quantidade  numeric     not null,
  despesa_id  text        references despesas(id) on delete cascade,
  observacao  text,
  criado_em   timestamptz not null default now()
);
alter table movimentacoes enable row level security;
drop policy if exists "anon_all" on movimentacoes;
create policy "anon_all" on movimentacoes for all to anon using (true) with check (true);

-- ── Entradas (vendas da colheita) ─────────────────────────────
create table if not exists entradas (
  id              text        primary key,
  area_id         text        not null references areas(id) on delete cascade,
  safra_id        text        references safras(id) on delete set null,
  cultura         text        not null default '',
  quantidade      numeric     not null,
  unidade         text        not null check (unidade in ('sc', 'ton')),
  preco_unitario  numeric     not null,
  total           numeric     not null,
  comprador       text,
  data            date        not null,
  criado_em       timestamptz not null default now()
);
alter table entradas enable row level security;
drop policy if exists "anon_all" on entradas;
create policy "anon_all" on entradas for all to anon using (true) with check (true);

-- ── Categorias de despesa (cadastráveis) ──────────────────────
create table if not exists categorias (
  id          text        primary key,
  nome        text        not null,
  cor         text        not null default '#64748b',
  criado_em   timestamptz not null default now()
);
alter table categorias enable row level security;
drop policy if exists "anon_all" on categorias;
create policy "anon_all" on categorias for all to anon using (true) with check (true);

-- ── Tags cadastradas ──────────────────────────────────────────
create table if not exists tags_cadastradas (
  id          text        primary key,
  nome        text        not null unique,
  criado_em   timestamptz not null default now()
);
alter table tags_cadastradas enable row level security;
drop policy if exists "anon_all" on tags_cadastradas;
create policy "anon_all" on tags_cadastradas for all to anon using (true) with check (true);

-- ── Produtos colhidos (estoque de colheita por área) ──────────
create table if not exists produtos_colhidos (
  id          text        primary key,
  area_id     text        not null references areas(id) on delete cascade,
  safra_id    text        references safras(id) on delete set null,
  cultura     text        not null,
  quantidade  numeric     not null,
  unidade     text        not null,
  data        date        not null,
  observacao  text,
  criado_em   timestamptz not null default now()
);
alter table produtos_colhidos enable row level security;
drop policy if exists "anon_all" on produtos_colhidos;
create policy "anon_all" on produtos_colhidos for all to anon using (true) with check (true);

-- ── Remover coluna tipo_atividade de despesas (se existir) ─────
-- alter table despesas drop column if exists tipo_atividade;
