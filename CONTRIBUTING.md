# Guia de Contribuição e Checklist de Deploy

Este documento orienta o fluxo de desenvolvimento e garante que cada deploy para produção seja seguro e funcional.

## 🌿 Fluxo de Git

-   **Branch `main`**: Somente código estável em produção.
-   **Branch `dev`**: Integração de novas funcionalidades.
-   **Branches `feat/nome-da-feature`**: Desenvolvimento local.
-   **Branches `fix/bug-fix`**: Correções rápidas.

### Padrão de Commits
Utilize [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` para novas funcionalidades.
- `fix:` para correções.
- `docs:` para alterações em documentação.
- `chore:` para tarefas de manutenção.

## 🚀 Checklist de Deploy (Produção)

Antes de realizar o merge para a `main`, verifique:

### 1. Variáveis de Ambiente
- [ ] Chaves do Supabase em produção estão configuradas na Vercel?
- [ ] O `WEBHOOK_GHL_URL` está apontando para o fluxo correto de produção?
- [ ] As `Edge Functions` no Supabase têm as chaves `ASAAS_API_KEY` e `SECRET_ROLE_KEY` configuradas?

### 2. Banco de Dados (Supabase)
- [ ] Todas as migrations em `supabase/migrations/` foram aplicadas no banco de produção?
- [ ] As políticas de RLS estão ativas e testadas?
- [ ] O usuário admin oficial já possui `role = 'admin'` no banco?

### 3. Integrações & Tracking
- [ ] O ID do Google Analytics (GA4) foi atualizado no `js/analytics.js`?
- [ ] O ID do Meta Pixel foi atualizado?
- [ ] Os links de pagamento no `js/checkout.js` estão com `ASAAS_SANDBOX = false`?

### 4. Testes Manuais Finais
- [ ] Fluxo de Cadastro -> Checkout -> Login funciona?
- [ ] O Plan Gating na Área de Membros está bloqueando corretamente as seções conforme o plano?
- [ ] O agendamento de call está criando o evento no calendário?

## 🧪 Comandos Úteis

- `npm run build`: Valida o build do Vite.
- `npm run preview`: Testa o build localmente.

---
> [!IMPORTANT]
> Nunca comite o arquivo `.env` com chaves reais. Sempre utilize o `.env.example` para referências.
