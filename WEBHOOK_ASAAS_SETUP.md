# Setup do Webhook Asaas → Supabase

Este guia configura automaticamente o plano do usuário após pagamento confirmado no Asaas.

## Arquitetura

```
Usuário paga no Asaas
    ↓
Asaas → POST para função Supabase
    ↓
Função atualiza plans na tabela profiles
    ↓
Usuário vê plano ativo em members.html
```

## Passo 1: Deploy da Edge Function

### Opção A: Deploy via Supabase CLI (Recomendado)

```bash
# 1. Instale Supabase CLI (se ainda não tem)
npm install -g supabase

# 2. Autentique com sua conta Supabase
supabase login

# 3. Faça deploy da função
cd /seu/caminho/zentplataformaagência
supabase functions deploy webhook-asaas --project-id tohqjcsrgfvlotnkcmqy

# Resultado: Você receberá uma URL como:
# https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/webhook-asaas
```

### Opção B: Deploy Manual no Supabase Console

1. Vai em: https://app.supabase.com/project/tohqjcsrgfvlotnkcmqy/functions
2. Clica em "Create a new function"
3. Nome: `webhook-asaas`
4. Copia o conteúdo de `supabase/functions/webhook-asaas/index.ts`
5. Clica em "Deploy"

---

## Passo 2: Copie a URL da Função

Após deploy, você receberá uma URL como:
```
https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/webhook-asaas
```

**Guarde essa URL!**

---

## Passo 3: Configure no Asaas

1. Acesse: https://sandbox.asaas.com/settings/notifications (ou prod se estiver em produção)
2. Clica em "Webhooks"
3. Clica em "Adicionar webhook"
4. Preencha:
   - **URL**: Cole a URL da função acima
   - **Eventos**: Selecione apenas "PAYMENT_CONFIRMED"
   - **Status da notificação**: Ativo

5. Clica em "Salvar"

---

## Passo 4: Teste o Webhook

### Via Asaas Console:

1. Volte em Webhooks
2. Clique no webhook criado
3. Clique em "Enviar teste"
4. Selecione evento "PAYMENT_CONFIRMED"
5. Clique em "Enviar"

### Via cURL (manual):

```bash
curl -X POST \
  https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/webhook-asaas \
  -H "Content-Type: application/json" \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test_123",
      "status": "CONFIRMED",
      "externalReference": "plan:starter:uid:8d1589f9-d94a-42bc-b8da-0185286234e"
    }
  }'
```

---

## Passo 5: Verifique os Logs

1. Acesse: https://app.supabase.com/project/tohqjcsrgfvlotnkcmqy/functions
2. Clique em `webhook-asaas`
3. Clique em "Logs"
4. Você verá as chamadas do webhook

---

## Como Funciona

1. **Checkout.html**:
   - Usuário clica em "Assinar Plano"
   - `externalReference` é criado: `plan:starter:uid:{USER_ID}`
   - Redireciona para Asaas com esse reference

2. **Asaas**:
   - Usuário paga
   - Status do pagamento muda para "CONFIRMED"
   - Asaas faz POST para `webhook-asaas`

3. **Supabase Edge Function**:
   - Recebe POST
   - Extrai plan e user_id
   - Atualiza tabela `profiles`: `plan = 'starter'`
   - Registra no `audit_log`

4. **Members.html**:
   - Usuário recarrega a página
   - `getProfile()` lê `plan = 'starter'`
   - Mostra conteúdo desbloqueado

---

## Troubleshooting

### Pagamento confirmado mas plano não atualiza

**Verificar:**
1. Logs da função (acesso acima)
2. Verifique se `externalReference` está correto em checkout.js
3. Confirme URL do webhook no Asaas está exata

### Webhook não é chamado

**Verificar:**
1. Webhook está ativo no Asaas
2. URL está correta (copie novamente)
3. Teste manual funciona?

### User not found (404)

**Verificar:**
1. UUID do usuário está correto
2. Usuário existe em tabela `profiles`

---

## Referência

- **Asaas Webhook Docs**: https://docs.asaas.com/#webhook
- **Supabase Functions**: https://supabase.com/docs/guides/functions
- **evento PAYMENT_CONFIRMED**: Confirmado que pagamento foi processado
