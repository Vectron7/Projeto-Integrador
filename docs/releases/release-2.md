# Release Notes - v0.2.0-dashboard-rc

**Data:** 14 de Junho de 2026  
**Status:** Release Candidate — A1.8  
**Tag:** `v0.2.0-dashboard-rc`

---

## 1. Conteúdo desde Release 1 (v0.1.0)

| Entrega | Descrição |
|---------|-----------|
| **Tela Alertas** | Lista filtrável (canteiro, tipo, período) com alertas derivados de regras |
| **Tela Histórico** | Tabela paginada + export CSV |
| **Tela Canteiros** | CRUD completo com validação e persistência local |
| **Principal elevada** | Status dos canteiros cadastrados (padrão: Canteiro Alface com telemetria API), relatório de irrigações (7 dias), 4 estados visuais |
| **Roteamento** | Hash router (`#/principal`, `#/alertas`, `#/historico`, `#/canteiros`) |
| **dataService** | Camada unificada plugável (API real no canteiro A + mock de fallback para offline/edge cases) |
| **Threat model** | `docs/dashboard/threat-model.md` + mitigações XSS/sanitização |
| **Observabilidade** | Logs JSON, requestId, métricas, runbook |

### Divergência RFC vs A1.8

A RFC previa telas Controle/Configurações. A1.8 exige Cadastro de Canteiros — implementado. Irrigação manual permanece na Principal.

---

## 2. Breaking changes

- Navbar alterada: links antigos (Home, Crescimento, Sensores) removidos
- `renderNavbar(cenario, rotaAtiva)` — segundo parâmetro obrigatório para highlight
- Nova pasta `src/views/` para templates por tela
- Default hash: `#/principal` (antes: página única sem rota)

**Migração:** bookmarks devem usar `#/principal`. Cache/sessão de telemetria compatível. Canteiros: instalação nova inicia só com Alface (id A); seeds mock B/C/D antigos são removidos automaticamente do `localStorage`.

---

## 3. Issues e PRs

| ID | Tipo | Descrição |
|----|------|-----------|
| A1.8 | Feature | Dashboard 4 telas E2E |
| — | Security | Threat model dashboard |
| — | Ops | Observabilidade instrumentada |

*(Atualizar com links de issues/PRs reais ao abrir o PR)*

---

## 4. Rastreabilidade E2E (UC → componente → teste → release)

| UC | Tela | Componente | Teste | Release |
|----|------|------------|-------|---------|
| UC-01 | Principal | `dashboardViewService.js` | `principalView.test.js` | §1 Principal elevada |
| UC-01 | Alertas | `alertasView.js` + `alertasService.js` | `alertasService.test.js` | §1 Tela Alertas |
| UC-02 | Histórico | `historicoView.js` | `principalView.test.js` (CSV) | §1 Tela Histórico |
| UC-03 | Canteiros | `canteirosView.js` + `canteirosService.js` | `canteirosService.test.js` | §1 Tela Canteiros |
| UC-01→02 | Fluxo E2E | `appController.js` | `e2e/dashboard-flow.spec.js` | §1 Roteamento |

---

## 5. Stack diff

| Item | v0.1 | v0.2 |
|------|------|------|
| Framework UI | Vanilla JS | Vanilla JS (sem mudança) |
| Roteamento | Nenhum | Hash router |
| Testes E2E | — | Playwright |
| Observabilidade | console ad-hoc | `observabilityService.js` |

---

## 6. Como executar esta release

```bash
npm install
npm run preview
npm test
npm run test:e2e:install && npm run test:e2e
```

Documentação: `docs/dashboard/threat-model.md`, `docs/ops/observability-dashboard.md`


### A2 — Auditoria Individual (Victor Heredia Moura)
- **Risco #10 resolvido:** blindagem de regressão na paginação do Histórico (`getHistoricoLeituras` em `dataService.js`). Adicionada sanitização de `page`/`pageSize` inválidos (0, negativo, não-inteiro) que gerava `totalPages: Infinity` silenciosamente. Suíte de regressão em `src/__tests__/dataService.test.js` — 6 casos cobrindo união disjunta, última página não-vazia, `page > totalPages` coerente, e guardas contra inputs inválidos. 160/160 testes passando.
