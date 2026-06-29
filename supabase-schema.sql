-- ============================================================
-- Gestão Plantio — Schema Supabase
-- Execute no SQL Editor do Supabase (https://supabase.com)
-- ============================================================

-- Usuários (auth customizada — sem Supabase Auth)
create table if not exists usuarios (
  id          text primary key,
  nome        text        not null,
  login       text        not null unique,
  senha_hash  text        not null,
  role        text        not null check (role in ('admin', 'funcionario')),
  ativo       boolean     not null default true,
  criado_em   timestamptz not null default now()
);
alter table usuarios disable row level security;

-- Áreas de plantio
create table if not exists areas (
  id          text primary key,
  nome        text        not null,
  cor         text        not null,
  poligono    jsonb       not null,
  hectares    numeric     not null,
  cultura     text,
  orcamento   numeric,
  criado_em   timestamptz not null default now()
);
alter table areas disable row level security;

-- Safras
create table if not exists safras (
  id          text primary key,
  nome        text        not null,
  cultura     text        not null default '',
  ativa       boolean     not null default false,
  criado_em   timestamptz not null default now()
);
alter table safras disable row level security;

-- Insumos (controle de estoque)
create table if not exists insumos (
  id              text primary key,
  nome            text        not null,
  unidade         text        not null,
  categoria_id    text,
  estoque_minimo  numeric,
  criado_em       timestamptz not null default now()
);
alter table insumos disable row level security;

-- Despesas por área
create table if not exists despesas (
  id                  text primary key,
  area_id             text        not null references areas(id) on delete cascade,
  categoria           text        not null,
  valor               numeric     not null,
  data                date        not null,
  descricao           text,
  lancado_por_id      text,
  safra_id            text references safras(id) on delete set null,
  tipo_atividade      text,
  tags                text[]      not null default '{}',
  insumo_id           text references insumos(id) on delete set null,
  quantidade_insumo   numeric,
  criado_em           timestamptz not null default now()
);
alter table despesas disable row level security;

-- Movimentações de estoque
create table if not exists movimentacoes (
  id          text primary key,
  insumo_id   text        not null references insumos(id) on delete cascade,
  tipo        text        not null check (tipo in ('entrada', 'saida')),
  quantidade  numeric     not null,
  despesa_id  text references despesas(id) on delete cascade,
  observacao  text,
  criado_em   timestamptz not null default now()
);
alter table movimentacoes disable row level security;

-- Entradas (vendas da colheita)
create table if not exists entradas (
  id              text primary key,
  area_id         text        not null references areas(id) on delete cascade,
  safra_id        text references safras(id) on delete set null,
  cultura         text        not null default '',
  quantidade      numeric     not null,
  unidade         text        not null check (unidade in ('sc', 'ton')),
  preco_unitario  numeric     not null,
  total           numeric     not null,
  comprador       text,
  data            date        not null,
  criado_em       timestamptz not null default now()
);
alter table entradas disable row level security;
