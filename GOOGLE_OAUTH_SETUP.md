# 🔐 Configuração Google OAuth no Supabase Cloud

**Status:** Credenciais obtidas ✅
**Data:** 2026-02-27

---

## 🎯 Configurar no Supabase Cloud Dashboard

### Passo 1: Acessar Supabase Dashboard
1. Ir para https://app.supabase.com/
2. Fazer login com sua conta Supabase
3. Selecionar projeto: `zentplataformaage_ncia`

### Passo 2: Ir para Authentication Settings

1. No menu à esquerda, clicar em **"Authentication"**
2. Clicar em **"Providers"**
3. Procurar por **"Google"** e clicar nele

### Passo 3: Habilitar Google OAuth

Na tela de configuração do Google:

1. Clique no toggle para **habilitar Google** (deve ficar verde)
2. Você verá dois campos:
   - **Client ID**
   - **Client Secret**

### Passo 4: Adicionar as Credenciais

Copie e cole **EXATAMENTE** (sem espaços extras):

**Client ID:** (obtido no Google Cloud Console)
```
[SEU_CLIENT_ID_AQUI]
```

**Client Secret:** (obtido no Google Cloud Console)
```
[SEU_CLIENT_SECRET_AQUI]
```

Veja as credenciais no seu arquivo `.env` (não versionado no Git por segurança)

### Passo 5: Configurar Redirect URL (se necessário)

Verifique se o **Redirect URL** está como:
```
https://tohqjcsrgfvlotnkcmqy.supabase.co/auth/v1/callback
```

Se estiver diferente, edite para essa URL.

### Passo 6: Salvar

Clicar em **"Save"** no canto inferior direito

---

## ✅ Verificar Configuração

Após salvar, você deve ver:
- Toggle Google **VERDE** (habilitado)
- Mensagem de sucesso
- Redirect URL configurada

---

## 🧪 Testar Google OAuth

Depois de configurar:

1. Ir para https://www.zentgrowth.com/auth.html
2. Clicar em **"Entrar com Google"**
3. Escolher conta Google
4. ✅ Deve redirecionar para members.html
5. ✅ Usuário criado no Supabase

---

## 🚨 Se Não Funcionar

### Erro: "Invalid Client ID"
→ Verificar se copiou exatamente (sem espaços)

### Erro: "Redirect URI mismatch"
→ Verificar se Redirect URL está correto em ambos os lugares:
- Google Cloud Console: `https://tohqjcsrgfvlotnkcmqy.supabase.co/auth/v1/callback`
- Supabase Dashboard: `https://tohqjcsrgfvlotnkcmqy.supabase.co/auth/v1/callback`

### Google OAuth não aparece na página auth
→ Limpar cache do navegador (Ctrl+Shift+Delete)

---

## 📋 Configuração Summary

| Campo | Valor |
|-------|-------|
| Project | ZENT AI |
| Client ID | [Armazenado em .env] |
| Client Secret | [Armazenado em .env] |
| Redirect URI | https://tohqjcsrgfvlotnkcmqy.supabase.co/auth/v1/callback |

**Nota:** Credenciais estão salvas no arquivo `.env` que não é versionado no Git por segurança.

---

**⏭️ PRÓXIMO:** Siga os passos acima no Supabase Cloud Dashboard!
