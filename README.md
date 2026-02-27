# 🤖 ZENT A.I. — Plataforma de Automação com IA

Plataforma completa de automação para atendimento, CRM e marketing com inteligência artificial.

**Status:** ✅ Pronto para Produção | Deploy: Vercel | Banco: Supabase | Pagamentos: Asaas

---

## 🎯 Features

### 🔐 Autenticação
- ✅ Cadastro com email/senha
- ✅ Login com email/senha
- ✅ Login com Google OAuth
- ✅ Recuperação de senha (reset)
- ✅ Sessões gerenciadas pelo Supabase Auth

### 💳 Pagamentos
- ✅ Integração com Asaas (PIX + Cartão)
- ✅ Geração de QR Code PIX
- ✅ Webhook de confirmação
- ✅ Liberação automática de plano após pagamento
- ✅ Polling para confirmação PIX

### 📊 Planos
- ✅ **STARTER** - R$ 197/mês
- ✅ **BÁSICO** - R$ 397/mês
- ✅ **PROFISSIONAL** - R$ 697/mês
- ✅ **PREMIUM** - R$ 997/mês

### 🛡️ Segurança
- ✅ RLS (Row Level Security) em todas as tabelas
- ✅ HTTPS automático
- ✅ JWT tokens seguros
- ✅ Audit log de transações
- ✅ Proteção contra XSS/CSRF

---

## 🚀 Deploy

### Local Development
```bash
cd /Users/mateus/Documents/zentplataformaagência
supabase start
python3 -m http.server 3000
# Acesso: http://localhost:3000
```

### Production (Vercel)
```bash
git push origin main
# Vercel faz deploy automático
# https://www.zentgrowth.com
```

📖 **Guia completo:** Ver `DEPLOYMENT.md`

---

## 📚 Documentação

- **TESTING.md** - Guia de testes e verificação de funcionalidades
- **FIXES.md** - Histórico de problemas corrigidos
- **DEPLOYMENT.md** - Como fazer deploy em produção

---

## 🏗️ Arquitetura

```
Frontend (HTML/CSS/JS)
    ↓
Supabase Auth (email/Google OAuth)
    ↓
Supabase Database (PostgreSQL)
    ↓
Edge Functions (Serverless)
    ↓
Asaas API (Pagamentos)
```

### Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS |
| Banco | PostgreSQL (Supabase) |
| Autenticação | Supabase Auth |
| Serverless | Supabase Edge Functions (Deno) |
| Pagamentos | Asaas API |
| Hosting | Vercel |

---

## 📂 Estrutura de Arquivos

```
/
├── index.html              # Home page
├── auth.html              # Login/Cadastro
├── reset-password.html    # Reset de senha
├── update-password.html   # Atualizar senha
├── checkout.html          # Checkout
├── members.html           # Área protegida
├── solucoes.html          # Soluções (technical)
│
├── css/
│   └── style.css          # Estilos globais
│
├── js/
│   ├── auth.js            # Utilitários de auth
│   ├── auth-page.js       # Lógica da página auth
│   ├── reset-password-page.js    # Reset password
│   ├── update-password-page.js   # Update password
│   ├── checkout-new.js    # Checkout com Asaas
│   ├── members-page.js    # Gating de planos
│   └── config.js          # Configurações
│
├── supabase/
│   ├── config.toml        # Configuração local
│   ├── migrations/
│   │   ├── create_payment_tables.sql
│   │   └── fix_schema_issues.sql
│   └── functions/
│       ├── process-payment/
│       ├── confirm-pix-payment/
│       ├── asaas-webhook/
│       └── send-confirmation-email/
│
├── vercel.json            # Configuração Vercel
├── .env                   # Variáveis de ambiente
├── .gitignore            # Git ignores
├── TESTING.md            # Guia de testes
├── FIXES.md              # Histórico de fixes
└── DEPLOYMENT.md         # Guia de deployment
```

---

## 🧪 Testes

### Teste Rápido (5 min)
```bash
1. Abrir http://localhost:3000/auth.html
2. Criar conta
3. Fazer login
4. Ir para checkout
5. Testar pagamento PIX
```

### Suite Completa
Ver `TESTING.md` para:
- ✅ Testes de autenticação
- ✅ Testes de password recovery
- ✅ Testes de checkout
- ✅ Verificações de banco de dados
- ✅ Troubleshooting

---

## ⚙️ Configuração

### Supabase Local
```bash
supabase start  # Inicia banco local
supabase stop   # Para
supabase reset  # Reseta banco
```

### Variáveis de Ambiente (.env)
```bash
# Supabase
SUPABASE_URL=https://tohqjcsrgfvlotnkcmqy.supabase.co
SUPABASE_ANON_KEY=sb_publishable_KNJ58eZVQ2dlelSph-JNhA_6iYaHUbn
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Google OAuth (preenchido pelo user)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=

# Email (preenchido pelo user)
RESEND_API_KEY=

# Pagamentos (já configurado)
ASAAS_API_KEY_SANDBOX=$aact_hmlg_...
```

---

## 🔐 Segurança Checklist

- ✅ HTTPS em produção
- ✅ RLS policies em todas as tabelas
- ✅ Senhas com mínimo 8 caracteres
- ✅ Rate limiting em auth
- ✅ Audit log de transações
- ✅ CORS corretamente configurado
- ✅ XSS protection headers
- ✅ CSRF tokens em formulários
- ✅ Credenciais em .env (não versionadas)

---

## 📊 Status do Projeto

### Funcionalidades Implementadas
- ✅ Autenticação completa
- ✅ Recuperação de senha
- ✅ Google OAuth
- ✅ Checkout PIX
- ✅ Checkout Cartão
- ✅ Gating de planos
- ✅ Webhook de confirmação
- ✅ Audit log
- ✅ RLS policies

### Problemas Corrigidos (v1.0)
- ✅ Password recovery (implementado)
- ✅ plan_activated_at (adicionado)
- ✅ webhook_logs (criada)
- ✅ Google OAuth (configurado)
- ✅ RLS policies (completas)
- ✅ Webhook duplicada (removida)
- ✅ SERVICE_ROLE_KEY (preenchido)
- ✅ Segurança audit_log (corrigida)

Ver `FIXES.md` para detalhes completos.

---

## 🎓 Como Usar

### Para Usuários
1. Ir para https://www.zentgrowth.com
2. Criar conta ou login
3. Selecionar plano
4. Fazer pagamento PIX
5. Usar a plataforma!

### Para Desenvolvedores
1. Fork/Clone repositório
2. Instalar Supabase: `npm install -g supabase`
3. `supabase start`
4. Abrir `http://localhost:3000`
5. Fazer mudanças
6. `git push` = deploy automático no Vercel

---

## 🤝 Contribuindo

Para adicionar features:

1. Criar branch: `git checkout -b feature/sua-feature`
2. Fazer mudanças
3. Testar localmente
4. Commit: `git commit -m "feat: descrição"`
5. Push: `git push origin feature/sua-feature`
6. Abrir Pull Request

---

## 📞 Suporte

### Documentação
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
- Asaas: https://asaas.com/api

### Issues
Reportar bugs em: GitHub Issues

---

## 📄 Licença

MIT License - veja LICENSE para detalhes

---

## ✨ Créditos

- **Frontend:** HTML5, CSS3, Vanilla JS
- **Backend:** Supabase (PostgreSQL + Auth + Edge Functions)
- **Payments:** Asaas
- **Hosting:** Vercel
- **Design:** ZENT Growth

---

**Última atualização:** 2026-02-27
**Versão:** 1.0 - Production Ready
**Status:** ✅ Pronto para Deploy

