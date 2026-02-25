# 🔗 CONFIGURAÇÃO DE WEBHOOK ASAAS

**Status: Pronto para Configuração em Produção**
**Data:** 25/02/2026

---

## 📋 O QUE É O WEBHOOK

O webhook do Asaas permite que o sistema seja notificado **automaticamente** quando:
- ✅ Um pagamento é confirmado
- ❌ Um pagamento falha
- ⏰ Um pagamento vence

---

## 🚀 PASSO-A-PASSO: CONFIGURAR WEBHOOK

### Passo 1: Obter URL do Webhook

Após fazer deploy no Supabase Cloud, a URL será:
```
https://seu-projeto.supabase.co/functions/v1/asaas-webhook
```

### Passo 2: Acessar Dashboard Asaas

1. Acesse: https://www.asaas.com/login
2. Vá em **Settings → Webhooks**

### Passo 3: Criar Novo Webhook

1. Clique em **"Novo Webhook"**
2. Preencha:
   - **URL:** `https://seu-projeto.supabase.co/functions/v1/asaas-webhook`
   - **Eventos:**
     - ✅ `payment.confirmed`
     - ✅ `payment.failed`
     - ✅ `payment.overdue`

3. Clique em **Salvar**

### Passo 4: Testar Webhook

1. No Asaas, clique em **"Test"** na webhook criada
2. Selecione um evento de teste
3. Verifique logs em: `supabase functions logs asaas-webhook`

---

## 🔄 FLUXO COMPLETO

```
Usuário paga no Asaas
    ↓
Asaas chama webhook automaticamente
    ↓
Edge Function asaas-webhook processa
    ↓
Atualiza status do pagamento
    ↓
Atualiza plano do usuário
    ↓
✅ Confirmado instantaneamente!
```

---

## 🧪 TESTAR LOCALMENTE

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/asaas-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.confirmed",
    "payment": {
      "id": "test_123",
      "status": "RECEIVED",
      "value": 197.00,
      "customer": "cust_123",
      "description": "Starter — R$ 197/mês",
      "externalReference": "plan:starter:uid:user-id"
    }
  }'
```

Resposta esperada:
```json
{
  "success": true,
  "event": "payment.confirmed"
}
```

---

## 📝 CHECKLIST

- [ ] Edge Function `asaas-webhook` deployada
- [ ] Webhook criado no dashboard Asaas
- [ ] URL correta configurada
- [ ] Eventos selecionados (confirmed, failed, overdue)
- [ ] Teste manual realizado
- [ ] Logs verificados
- [ ] Pagamento de teste confirmado automaticamente

---

**Webhook pronto para produção! 🎉**

**Versão:** 1.0 | **Data:** 25/02/2026
