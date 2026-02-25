# 🚀 GUIA DE DEPLOYMENT - SUPABASE CLOUD

**Status: Pronto para Deploy**
**Data:** 25/02/2026

---

## 📋 PRÉ-REQUISITOS

1. **Conta Supabase Cloud** (https://supabase.com)
2. **GitHub**: Repositório já configurado ✅
3. **Git Credentials**: Authentication com GitHub ✅
4. **Asaas API Key PRODUCTION**: (diferente da sandbox)

---

## 🎯 PASSO-A-PASSO DO DEPLOYMENT

### Passo 1: Criar Projeto Supabase Cloud

1. Acesse https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** `zent-ai-production`
   - **Password:** Gere uma senha forte
   - **Region:** Choose closest to your users (ex: `São Paulo`)
   - **Pricing Plan:** Pro (ou Free para teste)
4. Clique **"Create new project"** e aguarde (5-10 minutos)

### Passo 2: Obter Credenciais

Após o projeto ser criado:

1. Vá em **Settings → API**
2. Copie:
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **Anon Key** (ex: `eyJhbGc...`)
   - **Service Role Key** (ex: `eyJhbGc...`)

### Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env.production` na raiz do projeto:

```bash
# Supabase Cloud
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Asaas API Key PRODUCTION (não sandbox!)
ASAAS_API_KEY_PRODUCTION=$aact_prod_...
ASAAS_API_KEY_SANDBOX=$aact_hmlg_...  # Keep for testing

# URLs
VITE_SITE_URL=https://seu-dominio.com
```

### Passo 4: Configurar Supabase CLI

```bash
# 1. Login no Supabase CLI
supabase login

# 2. Link o projeto local ao projeto Cloud
supabase link --project-ref xxxxx

# 3. Verificar a conexão
supabase projects list
```

### Passo 5: Migrar Banco de Dados

```bash
# 1. Gerar migrations do banco local
supabase db pull

# 2. Fazer deploy das migrations para Cloud
supabase db push

# 3. Verificar status
supabase migration list
```

### Passo 6: Deploy das Edge Functions

```bash
# 1. Fazer deploy de todas as Edge Functions
supabase functions deploy

# 2. Configurar secrets em produção
supabase secrets set ASAAS_API_KEY_PRODUCTION=$aact_prod_...

# 3. Verificar deployment
supabase functions list
```

### Passo 7: Atualizar Frontend para Produção

Edite `js/auth.js` e `js/checkout-new.js`:

```javascript
// Mude de localhost para production URL
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // ← Production
const SUPABASE_ANON_KEY = 'eyJhbGc...';  // ← Anon Key do Cloud
```

### Passo 8: Build e Deploy Frontend

```bash
# 1. Build do projeto
npm run build

# 2. Deploy (escolha uma opção)

# Opção A: Vercel (recomendado)
npm install -g vercel
vercel

# Opção B: Netlify
npm install -g netlify-cli
netlify deploy

# Opção C: GitHub Pages
# Fazer push para gh-pages branch
```

### Passo 9: Configurar Webhook Asaas

No dashboard do Asaas:

1. Vá em **Settings → Webhooks**
2. Crie novo webhook com:
   - **URL:** `https://seu-dominio.com/api/webhook/asaas`
   - **Eventos:** `payment.confirmed`, `payment.failed`
3. Copie o **Token de Autenticação**

### Passo 10: Configurar RLS Policies em Produção

```bash
# Executar o script SQL de RLS
supabase migration new add_rls_policies

# Copiar conteúdo do arquivo:
# supabase/migrations/add_rls_policies.sql
```

---

## 🔐 SECURITY CHECKLIST

- [ ] Variáveis de ambiente configuradas (.env.production)
- [ ] API Keys PRODUCTION (não sandbox) no Supabase Cloud
- [ ] JWT Secret configurado
- [ ] RLS Policies ativadas em todas as tabelas
- [ ] CORS headers configurados
- [ ] SSL/HTTPS ativado
- [ ] Rate limiting em Edge Functions
- [ ] Webhook Asaas configurado
- [ ] Domínio verificado em Auth settings
- [ ] Backup database ativado

---

## 🧪 TESTES PÓS-DEPLOYMENT

### 1. Verificar Conectividade

```bash
curl https://xxxxx.supabase.co/rest/v1/profiles \
  -H "Authorization: Bearer $ANON_KEY"
```

### 2. Testar Signup/Login

```bash
# Acessar: https://seu-dominio.com/auth.html
# Criar conta nova
# Verificar se profile foi criado no banco
```

### 3. Testar Checkout

```bash
# Acessar: https://seu-dominio.com/checkout.html?plan=starter
# Preencher formulário
# Clicar em "Gerar QR Code"
# Verificar se pagamento foi criado no banco
```

### 4. Testar Webhook

```bash
# No dashboard Asaas:
# Settings → Webhooks → Test
# Verificar se webhook chega corretamente
```

### 5. Verificar Logs

```bash
# Ver logs do Supabase Cloud
supabase functions list --json
```

---

## 📊 ARQUIVOS IMPORTANTES PARA DEPLOYMENT

```
.
├── .env.production          ← Credenciais Cloud (não commitar!)
├── supabase/
│   ├── config.toml         ← Configuração local
│   ├── migrations/         ← Scripts SQL
│   └── functions/          ← Edge Functions
├── js/
│   ├── auth.js             ← Atualize SUPABASE_URL
│   └── checkout-new.js     ← Atualize SUPABASE_URL
└── dist/                   ← Build final (ignorar no git)
```

---

## 🚨 TROUBLESHOOTING

### "Erro 401 Unauthorized"
- Verificar se ANON_KEY está correto no frontend
- Verificar se RLS policies permitem acesso

### "Webhook não funciona"
- Verificar URL do webhook (deve ser pública)
- Verificar token de autenticação no Asaas
- Verificar logs em `supabase/functions/...`

### "Edge Functions com erro 500"
- Verificar se secrets estão configurados: `supabase secrets list`
- Fazer deploy novamente: `supabase functions deploy`
- Ver logs: `supabase functions logs {function-name}`

### "Database migration falhou"
- Verificar se há conflitos: `supabase migration list`
- Fazer rollback se necessário: `supabase migration repair`
- Testar migrations localmente primeiro

---

## 📝 COMANDOS ÚTEIS

```bash
# Status geral
supabase status

# Ver todos os secrets
supabase secrets list

# Ver logs de uma Edge Function
supabase functions logs process-payment

# Fazer deploy de função específica
supabase functions deploy process-payment

# Forçar redeploy
supabase functions deploy --no-verify-jwt

# Deletar função (cuidado!)
supabase functions delete process-payment
```

---

## ✅ CHECKLIST FINAL

- [x] Git push realizado com sucesso
- [ ] Projeto Supabase Cloud criado
- [ ] Credenciais obtidas
- [ ] .env.production configurado
- [ ] supabase link executado
- [ ] Database migrations feitas (supabase db push)
- [ ] Edge Functions deployadas (supabase functions deploy)
- [ ] Frontend atualizado com URLs de produção
- [ ] Build executado (npm run build)
- [ ] Frontend deployado
- [ ] Webhook Asaas configurado
- [ ] Testes pós-deployment realizados
- [ ] Domínio DNS apontando para frontend
- [ ] SSL/HTTPS verificado
- [ ] Alerts configurados no Supabase

---

## 🎯 PRÓXIMO PASSO

Após completar este guia, execute:

```bash
# Verificar status
supabase status

# Fazer testes
npm run build
```

Então você estará **pronto para colocar o site ao vivo! 🚀**

---

**Versão:** 1.0
**Data:** 25/02/2026
**Status:** Pronto para seguir passo-a-passo
