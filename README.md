# Gestão Plantio

Sistema de **lançamento de despesas por área de plantio**, com visualização das áreas no **Google Maps**.

Front-end em **React + TypeScript + Vite**, estilizado com **Tailwind CSS** (componentes no padrão shadcn/ui). Os dados ficam, nesta fase, no **localStorage** do navegador.

## Funcionalidades

- **Mapa** — desenhe os talhões (polígonos) sobre o mapa de satélite; cada área mostra o total gasto e o tamanho em hectares (calculado da geometria).
- **Lançar despesa** — escolha a área, a data e adicione vários itens de uma vez (ex.: Diesel R$10.000 + Adubo R$300).
- **Histórico** — tabela com filtros por área, categoria e período; exportação para CSV.
- **Dashboard** — totais, gasto por área, gasto por categoria e custo por hectare.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173

### Chave do Google Maps

O mapa precisa de uma chave da **Maps JavaScript API**:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/google/maps-apis) e crie/selecione um projeto.
2. Habilite **Maps JavaScript API** (a biblioteca *Drawing* já vem junto).
3. Crie uma chave de API em *Credenciais*.
4. Copie `.env.example` para `.env` e cole a chave em `VITE_GOOGLE_MAPS_API_KEY`.
5. Reinicie o `npm run dev`.

> Sem a chave, o app funciona normalmente — apenas o mapa mostra um aviso no lugar.
> **Nunca** faça commit do arquivo `.env` (já está no `.gitignore`).

## Estrutura

```
src/
  components/
    ui/         -> componentes base (Button, Card, Input, Select, Table, Badge)
    layout/     -> AppLayout (navegacao)
    map/        -> PlantioMap (Google Maps + desenho de poligonos)
  lib/
    types.ts        -> tipos (Area, Despesa, Categoria)
    categories.ts   -> lista de categorias de despesa
    geo.ts          -> calculo de hectares a partir do poligono
    storage.ts      -> persistencia em localStorage
    maps.ts         -> configuracao do Google Maps
    utils.ts        -> cn(), formatacao de moeda/data
  store/
    DataContext.tsx -> estado global (areas + despesas) com persistencia
  pages/
    MapaPage / LancarDespesaPage / HistoricoPage / DashboardPage
```

## Próximos passos (sugestões)

- Edição do polígono de uma área já cadastrada.
- Back-end real (a camada `storage.ts` / `DataContext` isola isso — dá para trocar por API/Supabase sem mexer nas telas).
- Autenticação (vários usuários / propriedades).
- Categorias personalizáveis pela interface.
