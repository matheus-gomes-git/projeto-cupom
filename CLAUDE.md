# Projeto Cupom — Extensão Chrome de Comparação de Preços

## Repositório GitHub

- **Repositório:** https://github.com/matheus-gomes-git/projeto-cupom
- **Branch principal:** main
- **Auto-push:** ativo via hook `Stop` em `.claude/settings.json`

## O que é este projeto

Extensão pessoal para Google Chrome (Manifest V3) que detecta automaticamente o produto na página atual e busca o mesmo item nas principais lojas brasileiras e internacionais, exibindo uma lista de preços comparados ordenada do mais barato ao mais caro.

**Lojas cobertas:** Mercado Livre, Amazon Brasil, Shopee, Magazine Luiza, Casas Bahia, AliExpress.

**Custo:** R$ 0/mês (apenas a API pública gratuita do Mercado Livre + scraping direto das demais).

## Estrutura de Arquivos

```
projeto-cupom/
├── manifest.json                  # Manifest V3 — permissões e configuração
├── background/
│   └── service-worker.js          # Buscas paralelas, cache, badge
├── content/
│   └── content-script.js          # Detecta produto na página automaticamente
├── popup/
│   ├── popup.html                 # Interface da extensão
│   ├── popup.js                   # Lógica do popup
│   └── popup.css                  # Estilos
├── utils/
│   └── parsers/
│       ├── mercadolivre.js        # API oficial gratuita
│       ├── amazon.js              # HTML scraping
│       ├── shopee.js              # Endpoint JSON semi-público
│       ├── magalu.js              # HTML scraping
│       ├── casasbahia.js          # HTML scraping
│       └── aliexpress.js          # HTML scraping + fallback
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Arquitetura

```
[Content Script] → detecta produto → [Service Worker]
  → Mercado Livre API (gratuita)
  → Amazon / Shopee / Magalu / Casas Bahia / AliExpress (scraping via host_permissions)
  → cache 30min em chrome.storage.local
  → badge no ícone com menor preço em R$
[Popup] → mostra loading por loja → resultados ordenados por preço
```

**Por que sem backend?** Com `host_permissions` no manifest, o service worker faz fetch cross-origin sem CORS, usando o IP e User-Agent reais do usuário — anti-scrapers não bloqueiam.

## Como instalar/testar

1. Abra `chrome://extensions`
2. Ative "Modo do desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta `d:\Projeto pessoal\Projeto Cupom`
5. Acesse qualquer página de produto e clique no ícone da extensão

## Decisões Técnicas

- **Vanilla JS** — sem framework (sem overhead de bundle)
- **`Promise.allSettled()`** — buscas paralelas; falha de uma loja não bloqueia as demais
- **Extração de produto (waterfall):** JSON-LD Schema.org → seletor CSS por domínio → og:title → H1
- **Cache por 30 min** em `chrome.storage.local` — reabre o popup instantaneamente
- **AliExpress em USD** — toggle de moeda no popup para comparar com lojas BR

## Regras de Sincronização Automática

O hook `Stop` em `.claude/settings.json` faz commit e push automático para o GitHub ao fim de cada sessão do Claude Code:

```bash
git add -A && git commit -m "auto: atualização automática via Claude Code" && git push origin main
```
