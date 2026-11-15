# FITAJE EarthPulse — Integração com backend e dados

Este documento descreve como o front-end está preparado para receber a API FastAPI e a base de dados, o que já existe e o que ainda depende da equipa de backend.

> Os endpoints abaixo são **planeamento**, não contratos. Nenhum pedido é feito a estas rotas enquanto o contrato não for confirmado com o responsável do backend.

## 1. Arquitectura de dados

```
Componentes React
      │  usam apenas hooks
      ▼
hooks/useData.ts ── useAsync ──► estados: idle | loading | success | error
      │
      ▼
services/dataService.ts   (cache de 5 min + partilha de pedidos em curso)
      │  escolhe a origem por VITE_DATA_SOURCE
      ├──► adapters/mockAdapter.ts ──► mock/field.ts      (dados DEMONSTRATIVOS)
      └──► adapters/apiAdapter.ts  ──► services/api.ts    (HTTP; esqueleto, ainda sem rotas)
```

Regras:

- Os componentes **nunca** importam `mock/` nem fazem `fetch`. Só os hooks de `hooks/useData.ts`.
- Os dados demonstrativos vivem isolados em `src/mock/` e a interface mostra o selo **Demonstrativo** enquanto `dataService.isDemo` for verdadeiro.
- Trocar mock por API é uma variável de ambiente (`VITE_DATA_SOURCE=api`) mais a implementação do `apiAdapter`. Os componentes não mudam.

## 2. Ficheiros relevantes

| Ficheiro | Responsabilidade |
|---|---|
| `src/config/env.ts` | Variáveis de ambiente (`VITE_DATA_SOURCE`, `VITE_API_BASE_URL`, `VITE_API_TIMEOUT_MS`, `VITE_MOCK_LATENCY_MS`). |
| `src/config/endpoints.ts` | Lista dos endpoints previstos (todos com `confirmed: false`). |
| `src/config/indicators.ts` | Metadados de cada indicador: unidade, escala de cores, fonte, dataset, resolução espacial, textos. **Para acrescentar um indicador, basta uma entrada aqui** (mais o tipo `IndicatorId`). |
| `src/config/mapSources.ts` | Imagens de satélite, vector tiles e fontes dos limites. Trocar uma fonte exige mexer só neste ficheiro. |
| `src/services/api.ts` | Cliente HTTP: URL base, timeout, repetição só em falhas de rede/5xx, erros tipados (`ApiError`), JSON. |
| `src/services/adapters/apiAdapter.ts` | **Esqueleto.** Devolve `ApiError('not-available')` até o contrato existir. |
| `src/types/` | `indicators.ts`, `geography.ts`, `api.ts` (contratos TypeScript). |

## 3. Endpoints previstos (por confirmar com o backend)

| Método | Rota | Para quê | Consumido por |
|---|---|---|---|
| GET | `/api/v1/provinces` | Lista de províncias (id, nome, centróide) | `useProvinces`, pesquisa |
| GET | `/api/v1/provinces/{id}` | Indicadores de uma província | `useLocationData` (kind = province) |
| GET | `/api/v1/points/{id}` | Indicadores de um ponto geográfico | `useLocationData` (kind = point), `DataPanel` |
| GET | `/api/v1/indicators` | Catálogo e metadados dos indicadores | `config/indicators.ts` (futuro) |
| GET | `/api/v1/indicators/{indicator}` | Valores por província/capital num período | `useProvinceValues`, `useCapitalsTable`, legenda |
| GET | `/api/v1/indicators/{indicator}/series` | Série temporal | gráficos do `DataPanel` e da página Indicadores |

### O que o front-end precisa de receber (não é um formato JSON definitivo)

Para cada valor mostrado: **valor, unidade, ano ou período, fonte, dataset e nota de limitação**. Em falta, a interface mostra "sem dados" e nunca inventa números.

Perguntas em aberto para o backend:

1. **Como se identifica um ponto?** O planeamento usa `/points/{id}`, mas o utilizador escolhe pontos livres (lat/lon). Pode ser `GET /points?lat=&lon=` ou o backend criar um id por coordenada.
2. **Como se casam províncias?** Por `id` estável, por código ADM1 ou por nome? Hoje o front-end casa pelo nome em `properties.name`.
3. **Resolução espacial por indicador**: NDVI, temperatura, precipitação e população são de grelha; a **mortalidade deve vir por província** (ver secção 6).
4. **Agregação por província**: média, mediana ou ponderada pela população? Tem de ser indicado na resposta.
5. **Períodos**: anos (2021–2025) ou datas? Define `YEARS` em `config/indicators.ts`.
6. **Erros**: formato do corpo de erro (para mostrar mensagens úteis).
7. **CORS** e porta do front-end (os PDFs indicam 3000 e 5173).
8. **Autenticação**: só se for necessária (o `api.ts` já aceita cabeçalhos).

## 4. Como ligar a API quando o contrato existir

1. Acrescentar em `src/types/api.ts` os tipos das respostas confirmadas.
2. Implementar os 3 métodos de `apiAdapter.ts` com `apiGet()` e `ENDPOINTS`, convertendo para `LocationData`, `CapitalRow[]` e `ProvinceValues` (ver `src/types/indicators.ts`).
3. Marcar `confirmed: true` em `config/endpoints.ts`.
4. Criar `.env` com `VITE_DATA_SOURCE=api` e `VITE_API_BASE_URL=...` (modelo em `.env.example`).
5. Verificar os estados: carregamento (esqueleto), erro (com "Tentar de novo"), vazio.

Nada nos componentes muda. Os pontos de contacto são `hooks/useData.ts` e `services/dataService.ts`.

## 5. Limites das províncias

`services/provinces.ts` tenta, por ordem, as fontes de `config/mapSources.ts`:

1. `public/data/angola-adm1.geojson` (gerado por `npm run data`);
2. API da geoBoundaries;
3. `media.githubusercontent.com` (geoBoundaries);
4. `raw.githubusercontent.com` (geoBoundaries).

Cada resposta é **validada**: tem de ser GeoJSON com polígonos, pelo menos 10 províncias, todas com nome e centróides dentro de Angola. Respostas inválidas (HTML, ponteiros Git LFS, limites de outro país) são rejeitadas e passa-se à fonte seguinte.

- Se todas falharem, a interface mostra um aviso com "Tentar de novo" e a razão de cada falha fica na consola.
- **Número de províncias:** a divisão administrativa actual tem 21 (`EXPECTED_PROVINCES`). Se a fonte tiver outro número (versão anterior dos limites), a página **Dados** mostra um aviso. Isto tem de ser confirmado com a equipa/GIS: não se desenham fronteiras à mão.
- Recomenda-se correr `npm run data` com Internet e incluir os ficheiros no repositório (licença geoBoundaries CC BY 4.0; Natural Earth é de domínio público), para a app não depender da rede.

## 6. Indicadores

- **NDVI, temperatura, precipitação, população:** resolução de grelha (250 m, 1 km, 11 km, 1 km).
- **Mortalidade:** taxa bruta de mortalidade (óbitos por 1000 habitantes). **Não** é mortalidade infantil nem natalidade. A resolução real da fonte está por confirmar e está assumida ao nível da província; nunca se assume 1 km. No painel, o valor de um ponto é o da sua província.
- A **área de análise de 1 km × 1 km (1 km²)** aplica-se aos indicadores de grelha. Está em `ANALYSIS` (`config/globe.ts`) e pode passar a círculo de raio 1 km (3,14 km²) alterando `shape`.

## 7. Mapas e licenças

| Fonte | Uso | Licença / nota |
|---|---|---|
| NASA GIBS (Blue Marble) | Imagem global | NASA |
| EOX Sentinel-2 cloudless | Satélite em detalhe | **CC BY-NC 4.0: uso não comercial** |
| OpenFreeMap + OpenStreetMap | Ruas, edifícios, nomes | ODbL; atribuição obrigatória. Sem chave de API. A cobertura de edifícios em Angola é parcial. |
| Natural Earth | Fronteiras nacionais | Domínio público |
| geoBoundaries | Províncias | CC BY 4.0 |

A avaliação de alternativas (MapTiler, etc.) ainda não foi feita e nada foi integrado além do que consta acima.

## 8. Convenções do projecto

- Pull requests sempre para `develop`; nunca fazer push para `main`.
- Commits no formato `tipo: descrição`, em inglês.
- Nunca fazer commit de `.env` nem de chaves/tokens.
- Variável de build da API: `VITE_API_BASE_URL` (o Vite exige o prefixo `VITE_`).

## 9. Inconsistências dos documentos do projecto a alinhar

- Contrato da API: `/api/ndvi` vs `/api/v1/indicators/point`.
- MVP só desktop (Fluxo da App) vs versão móvel (UI/UX).
- Porta do front-end: 3000 vs 5173.
