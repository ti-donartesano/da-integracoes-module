# da-integracoes-ui

Tela de Integrações (Vite + React 18 + Tailwind). Lista as integrações da API, salva credenciais (Client ID/Secret) e inicia o OAuth.

## Comandos

```bash
npm install
npm run dev      # Vite local
npm run build    # gera dist/integracoes-bundle.js + style.css (IIFE)
npm start        # serve -s dist
```

## Como funciona

- `API_BASE` sai de `window.location.origin` (em `localhost` aponta para a API local, senão para a API publicada). É Vite: **não use `process.env`**.
- Salvar: `PUT {API_BASE}/api/integrations/:slug` com `{ config: { clientId, clientSecret } }`.
- Conectar: redireciona para `{API_BASE}/auth/:slug?slug=:slug&redirect_uri=...`.
- A caixa azul no topo explica o proxy `/api/proxy/<app>/<endpoint>` e o header `x-internal-secret`.
- O bundle único (`integracoes-bundle.js`) também é usado para embutir a tela na Central.

## Cuidados

- Arquivos `.tsx` em UTF-8 sem BOM. Edição por regex no PowerShell já corrompeu a acentuação uma vez.

Contexto: [`../docs/ARQUITETURA.md`](../docs/ARQUITETURA.md).
