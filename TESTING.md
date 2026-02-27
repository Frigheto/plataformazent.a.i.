# 🧪 Guia de Testes - ZENT A.I.

## Status da Implementação

Todas as funcionalidades críticas foram implementadas e corrigidas:

### ✅ Concluído
- [x] Migração do banco para adicionar campos faltando (`plan_activated_at`, `webhook_logs`)
- [x] Password recovery (recuperação de senha) completo
- [x] Google OAuth configurado (faltam credenciais do user)
- [x] RLS policies corrigidas para pagamentos e audit_log
- [x] Webhook duplicada removida (mantém apenas `asaas-webhook`)
- [x] Environment variables configuradas

### ⚠️ Requer Configuração Manual
- Google OAuth Client ID e Secret (da Google Cloud Console)
- RESEND_API_KEY (para enviar emails de recuperação de senha)

---

## 📋 Pré-requisitos

1. **Supabase local rodando**
   ```bash
   cd /path/to/zentplataformaagência
   supabase start
   ```

2. **Servidor web rodando**
   ```bash
   # Em outro terminal
   python3 -m http.server 3000  # ou seu servidor preferido
   ```

3. **Banco de dados atualizado**
   As migrações foram criadas e devem ser aplicadas ao iniciar o Supabase

---

## 🔐 Configurar Google OAuth (Necessário)

### 1. Criar OAuth 2.0 Credentials na Google Cloud Console

1. Ir para https://console.cloud.google.com/
2. Criar novo projeto (ou usar existente)
3. Habilitar "Google+ API"
4. Ir para "APIs & Services" → "Credentials"
5. Criar "OAuth 2.0 Client ID" (tipo: Web application)
6. Adicionar URIs autorizados:
   - Redirect URI: `http://127.0.0.1:54321/auth/v1/callback` (local)
   - Redirect URI: `https://seu-dominio.com/auth/v1/callback` (produção)
7. Copiar Client ID e Client Secret

### 2. Configurar no .env

```bash
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=seu_client_id_aqui
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=seu_client_secret_aqui
```

---

## 📧 Configurar Email de Recuperação de Senha (Necessário)

### Opção 1: Usar Resend
1. Cadastrar em https://resend.com/
2. Obter API Key
3. Adicionar ao .env:
   ```bash
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### Opção 2: Usar SMTP (alternativa)
Editar `supabase/config.toml`:
```toml
[auth.email.smtp]
enabled = true
host = "smtp.seu-provider.com"
port = 587
user = "seu-email@seu-dominio.com"
pass = "env(SMTP_PASSWORD)"
admin_email = "noreply@seu-dominio.com"
sender_name = "ZENT A.I."
```

---

## 🧪 Fluxo de Teste Completo

### Teste 1: Criar Conta

1. Abrir `http://127.0.0.1:3000/auth.html`
2. Clicar em "Criar conta"
3. Preencher:
   - Nome: "Teste User"
   - Email: "teste@example.com"
   - Senha: "senhaSegura123"
4. Clicar em "Criar conta"
5. ✅ Esperado: Redirecionado para members.html ou mensagem de confirmação de email

### Teste 2: Password Recovery

1. Abrir `http://127.0.0.1:3000/auth.html`
2. Clicar em "Esqueceu sua senha?"
3. Inserir email: "teste@example.com"
4. Clicar em "Enviar link de recuperação"
5. ✅ Esperado: Mensagem "E-mail enviado!"
6. **Verificar email:**
   - Se usando local Supabase: Abrir http://127.0.0.1:54324 (Inbucket)
   - Procurar por email de reset
   - Clicar no link
7. ✅ Esperado: Redirecionado para `update-password.html`
8. Preencher nova senha: "novaSenha456"
9. Confirmar: "novaSenha456"
10. Clicar em "Atualizar Senha"
11. ✅ Esperado: "Senha atualizada!" → Ir para login com nova senha

### Teste 3: Login com Nova Senha

1. Abrir `http://127.0.0.1:3000/auth.html`
2. Inserir email: "teste@example.com"
3. Inserir senha: "novaSenha456"
4. Clicar em "Entrar"
5. ✅ Esperado: Redirecionado para members.html

### Teste 4: Selecionar Plano

1. Estando logado em members.html
2. Abrir `http://127.0.0.1:3000/checkout.html?plan=starter`
3. ✅ Esperado: Página carrega com plano STARTER (R$ 197)
4. Preencher dados:
   - CPF: "123.456.789-09"
   - Nome: "Teste User"
   - Email: "teste@example.com"
   - Telefone: "(11) 99999-9999"

### Teste 5: Pagamento PIX

1. Na página de checkout, selecionar "PIX"
2. Clicar em "Gerar QR Code"
3. ✅ Esperado: QR Code aparece na tela
4. Escanear QR Code com app do banco (ou usar simulador)
5. Confirmar pagamento
6. ✅ Esperado:
   - Página mostra "Pagamento confirmado"
   - Webhook é acionado (`asaas-webhook`)
   - Campo `plan` em `profiles` é atualizado para "starter"
   - Campo `plan_activated_at` é preenchido

### Teste 6: Verificar Plano Liberado

1. Abrir `http://127.0.0.1:3000/members.html`
2. ✅ Esperado: Menu muda de acordo com plano
   - `profile.plan = "starter"` mostra features do STARTER
   - Acesso bloqueado a features de planos superiores

### Teste 7: Google OAuth (se configurado)

1. Abrir `http://127.0.0.1:3000/auth.html`
2. Clicar em "Entrar com Google"
3. ✅ Esperado: Redireciona para Google login
4. Fazer login com conta Google
5. ✅ Esperado: Redireciona para members.html com usuário criado

---

## 🔍 Verificações do Banco de Dados

Usar Supabase Studio (http://127.0.0.1:54323) ou SQL:

### Verificar profiles
```sql
SELECT id, email, plan, plan_activated_at FROM profiles WHERE email = 'teste@example.com';
```
✅ Esperado: `plan = 'starter'`, `plan_activated_at` != NULL

### Verificar payments
```sql
SELECT id, user_id, plan, status, confirmed_at FROM payments
WHERE asaas_payment_id = 'ID_DO_ASAAS';
```
✅ Esperado: `status = 'CONFIRMED'`, `confirmed_at` != NULL

### Verificar webhook_logs
```sql
SELECT * FROM webhook_logs WHERE asaas_payment_id = 'ID_DO_ASAAS';
```
✅ Esperado: Log registrado com sucesso

### Verificar audit_log
```sql
SELECT * FROM audit_log WHERE resource_type = 'subscription';
```
✅ Esperado: Registro do pagamento confirmado

---

## ⚠️ Troubleshooting

### "Email not confirmed"
- **Causa:** Email confirmation está ativado
- **Fix:** Clicar no link de confirmação em http://127.0.0.1:54324 (Inbucket)

### "Invalid login credentials"
- **Causa:** Email/senha incorretos
- **Fix:** Verificar dados no Supabase Studio

### Pagamento não atualiza plano
- **Causa 1:** SUPABASE_SERVICE_ROLE_KEY vazio
  - **Fix:** Adicionar ao `.env` e reiniciar Supabase
- **Causa 2:** Webhook não foi acionada
  - **Fix:** Verificar logs em http://127.0.0.1:54323 → Functions
- **Causa 3:** RLS policies bloqueando UPDATE
  - **Fix:** Rodar migration `fix_schema_issues.sql`

### Google OAuth não funciona
- **Causa:** Client ID/Secret não configurado
- **Fix:** Preencher corretamente em `.env` e reiniciar Supabase

---

## 📊 Resumo das Mudanças

### Arquivos Criados
- `reset-password.html` - Página de recuperação de senha
- `update-password.html` - Página de atualizar senha
- `js/reset-password-page.js` - Lógica de reset
- `js/update-password-page.js` - Lógica de atualizar
- `supabase/migrations/fix_schema_issues.sql` - Correções de schema

### Arquivos Modificados
- `js/auth.js` - Adicionado `resetPasswordForEmail()` e `updatePassword()`
- `js/auth-page.js` - (não modificado, links adicionados em HTML)
- `auth.html` - Adicionado link "Esqueceu sua senha?"
- `supabase/config.toml` - Google OAuth habilitado
- `.env` - Variáveis para Google OAuth e email

### Arquivos Removidos
- `supabase/functions/webhook-asaas/index.ts` - Webhook duplicada

---

## ✨ Próximos Passos (Opcional)

1. **Testes com Selenium/Playwright** - Automatizar testes completos
2. **Email Remoto** - Configurar SMTP com domínio real
3. **CI/CD** - Adicionar testes automáticos no GitHub Actions
4. **Monitoramento** - Configurar alertas para falhas de pagamento
5. **Analytics** - Rastrear conversão de pagamentos

---

**Última atualização:** 2026-02-27
**Versão:** 1.0 - Sistema pronto para testes
