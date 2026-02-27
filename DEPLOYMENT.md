# 🚀 Guia de Deploy para Vercel - ZENT A.I.

## Status: Pronto para Produção

Seu site foi configurado para funcionar em **dois ambientes**:
- ✅ **Local Development:** `http://localhost:3000`
- ✅ **Production (Vercel):** `https://www.zentgrowth.com`

A detecção é **automática** - o código detecta se está em localhost e usa as credenciais corretas.

---

## 📋 Pré-requisitos

- [x] GitHub account
- [x] Vercel account (gratuito)
- [x] Domínio `zentgrowth.com` registrado (registrador de domínios)

---

## 🎯 Passo 1: Preparar o GitHub

### 1.1 Fazer commit final
```bash
cd /Users/mateus/Documents/zentplataformaagência
git status
```

Você verá os arquivos modificados:
- `js/auth.js` - URLs dinâmicas
- `js/checkout-new.js` - URLs dinâmicas
- `vercel.json` - Configuração Vercel
- `.gitignore` - Atualizado

### 1.2 Adicionar e fazer commit
```bash
git add js/auth.js js/checkout-new.js vercel.json .gitignore
git commit -m "feat: Configure for Vercel production deployment

- Add automatic environment detection (localhost vs production)
- Configure Supabase URLs for both local and cloud
- Add Vercel configuration with caching and headers
- Update .gitignore

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

### 1.3 Fazer push
```bash
git push origin main
```

---

## 🌐 Passo 2: Conectar Vercel ao GitHub

### 2.1 Acessar Vercel
1. Ir para https://vercel.com/login
2. Fazer login (ou criar conta)
3. Clicar em "New Project"

### 2.2 Importar repositório GitHub
1. Clicar em "Continue with GitHub"
2. Autorizar Vercel a acessar seus repositórios
3. Procurar por `zentplataformaagência`
4. Clicar em "Import"

### 2.3 Configurar projeto
Na tela "Import Project":
- **Project Name:** `zentgrowth` (ou outro nome)
- **Framework:** `Other` (site estático)
- **Root Directory:** `.` (deixar padrão)
- **Build Command:** (deixar vazio - não precisa build)
- **Output Directory:** (deixar vazio)

Clicar em **"Deploy"**

---

## ⏳ Passo 3: Aguardar Deploy

Vercel fará o deploy automaticamente:
1. Vai criar uma URL temporária: `seu-projeto.vercel.app`
2. Você receberá um email quando terminar
3. Clique no email para ver o site ao vivo

✅ **Seu site está VIVO neste ponto!** (mas com URL temporária)

---

## 🎁 Passo 4: Adicionar Seu Domínio Próprio

### 4.1 Adicionar domínio no Vercel
1. Na dashboard Vercel, ir para seu projeto
2. Clicar em **"Settings"**
3. Clicar em **"Domains"** (no menu à esquerda)
4. Clicar em **"Add Domain"**
5. Digitar: `www.zentgrowth.com`
6. Clicar em **"Add"**

### 4.2 Vercel mostrará instruções CNAME

Você verá algo assim:
```
Name: www
Type: CNAME
Value: cname.vercel.com
```

### 4.3 Ir para seu registrador de domínios

Onde você registrou `zentgrowth.com` (GoDaddy, Namecheap, etc):

1. Acessar **DNS Management** ou **DNS Settings**
2. Encontrar/Criar registro `www`
3. Mudar para:
   - **Type:** CNAME
   - **Name:** www
   - **Value:** cname.vercel.com
4. **Salvar**

### 4.4 Aguardar propagação de DNS

⏳ Pode levar **2-48 horas** para DNS propagar

Verificar status em Vercel:
- Se estiver ✅ Verde: Tudo certo!
- Se estiver 🟡 Amarelo: Ainda propagando
- Se estiver ❌ Vermelho: Verificar configuração CNAME

---

## ✅ Testar Seu Site

Uma vez propagado, testar:

### 1. Acessar site
```
https://www.zentgrowth.com
```

### 2. Testar funcionalidades
- ✅ Criar conta
- ✅ Fazer login
- ✅ Recuperar senha
- ✅ Selecionar plano
- ✅ Checkout PIX

### 3. Verificar console
Abrir DevTools (F12 → Console):
- Não deve haver erros de CORS
- Supabase deve conectar a `https://tohqjcsrgfvlotnkcmqy.supabase.co`

---

## 🔐 Configurar Variáveis de Ambiente (Se Necessário)

Se precisar adicionar variáveis secretas no Vercel:

1. Em Vercel → Settings → Environment Variables
2. Adicionar (se usar Resend para emails):
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```
3. Clicar em "Save"
4. Fazer redeploy (git push)

**Nota:** Seu site não usa variáveis de ambiente no .env porque tudo está em JavaScript puro. As credenciais são públicas (ANON_KEY é segura para expor).

---

## 🚨 Troubleshooting

### Site mostra "404 Not Found"
**Causa:** DNS ainda propagando
**Solução:** Aguardar mais tempo (até 48h) e recarregar página

### Login não funciona
**Causa:** Supabase URL errada
**Solução:** Verificar no DevTools console se mostra erro de CORS
- ✅ Certo: `https://tohqjcsrgfvlotnkcmqy.supabase.co`
- ❌ Errado: `http://127.0.0.1:54321`

### Checkout retorna erro de Edge Function
**Causa:** SERVICE_ROLE_KEY não está configurado
**Solução:** Verificar no Supabase Dashboard se Edge Functions estão online

### Email de reset não chega
**Causa:** RESEND_API_KEY não configurado
**Solução:** Ir para Vercel → Environment Variables e adicionar chave

---

## 📊 Checklist Final

Antes de sair vibrando:

- [ ] Commit feito e pushed para GitHub
- [ ] Vercel conectado ao GitHub
- [ ] Deploy completado (status verde)
- [ ] Domínio adicionado no Vercel
- [ ] CNAME configurado em registrador de domínios
- [ ] DNS propagou (site acessível em www.zentgrowth.com)
- [ ] Testar criar conta em produção
- [ ] Testar login em produção
- [ ] Testar recuperar senha
- [ ] Testar checkout (PIX/Cartão)
- [ ] Verificar console (sem erros)

---

## 🎉 Pronto!

Seu site está **ao vivo em produção** com:
- ✅ HTTPS automático
- ✅ CDN global (rápido em qualquer lugar)
- ✅ Auto-scaling (cresce se tiver muito tráfego)
- ✅ Deployments automáticos (git push = novo deploy)
- ✅ Seu domínio personalizado

---

## 🔄 Fluxo Contínuo de Atualizações

Agora toda vez que você fizer alterações:

```bash
# 1. Fazer mudanças locais
# ... editar arquivos ...

# 2. Commit e push
git add .
git commit -m "feat: sua mensagem"
git push origin main

# 3. Vercel faz deploy automaticamente
# ✅ Site atualizado em 1 minuto!
```

---

## 📞 Suporte Vercel

Se algo der errado:
- Documentação: https://vercel.com/docs
- Support: https://vercel.com/support

---

**Status:** ✅ Pronto para deploy
**Data:** 2026-02-27
**Versão:** Production v1.0
