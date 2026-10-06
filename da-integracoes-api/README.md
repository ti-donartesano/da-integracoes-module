# da-integracoes-api

API Fastify (ESM, Node 24) que centraliza credenciais e OAuth das integrações. Hoje só o provider `tiny`.

## Rotas

| Método e caminho | Auth | Função |
|---|---|---|
| `GET /health` | nenhuma | liveness |
| `GET /api/integrations` | nenhuma* | lista integrações (inclui `config`) |
| `POST /api/integrations` | nenhuma* | cria integração (`slug`, `display_name`, `provider`, `config`) |
| `PUT /api/integrations/:slug` | nenhuma* | salva `config` (`clientId`/`client_id`, `clientSecret`) |
| `GET /api/integrations/:slug/token` | `x-internal-key` | devolve os tokens |
| `GET /auth/tiny?slug=&redirect_uri=` | nenhuma | inicia OAuth (redireciona ao Tiny) |
| `GET /auth/tiny/callback` | nenhuma | troca `code` por tokens e grava |
| `POST /api/integrations/tiny/refresh` | nenhuma* | força renovação do token |
| `ALL /api/proxy/tiny/*` | `x-internal-secret` | repassa à API v3 do Tiny com o Bearer |

\* Ver "Riscos conhecidos".

## Proxy do Tiny

```bash
curl -H "x-internal-secret: $INTERNAL_SECRET" \
  "https://integracoes-api.solares.systems/api/proxy/tiny/produtos?pesquisa=torneira"
```

`/api/proxy/tiny/<caminho>` vira `https://api.tiny.com.br/public-api/v3/<caminho>`. O proxy lê o `access_token` do MySQL e **não renova** na hora.

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `PORT` | porta (padrão 4001) |
| `DATABASE_URL` | MySQL (`mysql://user:pass@host:3306/dondado`) |
| `INTERNAL_SECRET` | protege o proxy (mesmo valor no MCP consumidor) |
| `INTERNAL_KEY` | protege `GET /api/integrations/:slug/token` |

## Dados

Tabela `integrations` (criada no boot por `initDb`): `slug` único, `provider`, `config` JSON, `tokens` JSON, `status` (`active`, `expired`, `error`, `disconnected`), `last_refresh_at`, `error_message`. Linha `tiny` semeada como `disconnected`.

## Renovação

`src/jobs.js`: a cada 2 h renova o token das integrações `active` do provider `tiny` (`src/services/tinyAuth.js`, `grant_type=refresh_token`). Falha marca `status=error` com a mensagem.

## Testes

```bash
npm test   # node --test test/unit/*.test.js (fastify.inject)
```

## Riscos conhecidos

- Rotas de `/api/integrations` sem autenticação e com CORS `*`; o `GET` expõe o `clientSecret` salvo em `config`.
- Renovação só a cada 2 h, e sem `client_secret` no refresh (a troca do code envia). Não validado em produção.
- `src/db.js` tem `DATABASE_URL` padrão com credencial. Remover.

## Histórico de correções (06/10/2026)

- CORS com `methods` explícitos: o `PUT` do navegador falhava ("Erro de rede ao salvar").
- `client_secret` na troca do code: sem ele o Tiny respondia `unauthorized_client`.
- Removidas 3 cópias mortas do proxy em `routes/integrations.js`.

Contexto completo: [`../docs/ARQUITETURA.md`](../docs/ARQUITETURA.md).
