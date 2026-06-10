# Projeto Cupom

## Repositório GitHub

Este projeto é sincronizado automaticamente com o GitHub.

- **Repositório:** https://github.com/Matheusgomes062/projeto-cupom
- **Branch principal:** main

## Regras de Sincronização Automática

Toda vez que o Claude Code finalizar uma sessão (evento `Stop`), as alterações do projeto são automaticamente commitadas e enviadas para o GitHub com o comando:

```bash
git add -A && git diff --cached --quiet || git commit -m "auto: atualização automática via Claude Code" && git push origin main
```

Este hook está configurado em `.claude/settings.json` neste projeto.

## Configuração do Hook

O arquivo `.claude/settings.json` contém um hook `Stop` que executa o script de push automático após cada sessão do Claude Code.

## Padrões do Projeto

- Linguagem principal: a definir
- Estrutura: a definir conforme o projeto evolui
