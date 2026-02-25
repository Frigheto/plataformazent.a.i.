# Configuração Sandbox Asaas — Guia Prático

**Objetivo:** Testar checkout customizado em ambiente sandbox antes de ir para produção.

---

## 1. Criar Conta Sandbox Asaas

### Passo 1: Acessar Sandbox
1. Ir para https://sandbox.asaas.com
2. Clicar em "Criar Conta Grátis"
3. Preencher:
   - Email: seu-email@teste.com
   - Senha: senha segura
   - Nome da Empresa: "ZENT Test"
   - Tipo: PJ ou PF (usar PF para testes)

### Passo 2: Verificar Email
1. Confirmar email na caixa de entrada
2. Login em sandbox.asaas.com

### Passo 3: Gerar API Key Sandbox
1. Dashboard → Configurações → API
2. Clicar em "Gerar Nova Chave"
3. Copiar chave (começa com `$aact_test_...`)

---

## 2. Configurar Edge Functions para Sandbox

### Opção A: Variável de Ambiente (Recomendado)

#### Criar novo secret no Supabase
1. **Supabase Console** → Project → Settings → Secrets
2. Clicar "New Secret"
3. Nome: `ASAAS_API_KEY_SANDBOX`
4. Valor: Cole a chave copiada acima
5. Salvar

#### Modificar Edge Functions para suportar ambos
**Em `supabase/functions/process-payment/index.ts`:**

```typescript
// Substituir linha 107:
const asaasApiKey = Deno.env.get('ASAAS_API_KEY_SANDBOX') || Deno.env.get('ASAAS_API_KEY');

// Substituir linha 117 (URL da API):
const searchCustomersUrl = new URL('https://api.sandbox.asaas.com/v3/customers');

// Substituir linha 140:
'https://api.sandbox.asaas.com/v3/customers',

// Substituir linha 185:
const createPaymentRes = await fetch('https://api.sandbox.asaas.com/v3/payments', {
```

**Em `supabase/functions/confirm-pix-payment/index.ts`:**

```typescript
// Substituir linha 52:
const asaasApiKey = Deno.env.get('ASAAS_API_KEY_SANDBOX') || Deno.env.get('ASAAS_API_KEY');

// Substituir linha 60:
`https://api.sandbox.asaas.com/v3/payments/${paymentId}`,
```

### Opção B: Via Query Parameter

Adicionar flag `?sandbox=true` ao checkout:

```javascript
// Em checkout-new.js, linha 69:
const params = new URLSearchParams(window.location.search);
const isSandbox = params.get('sandbox') === 'true';
const apiBase = isSandbox ? 'https://api.sandbox.asaas.com/v3' : 'https://api.asaas.com/v3';

// Em submitPixPayment():
const response = await fetch('/functions/v1/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Sandbox': isSandbox ? 'true' : 'false' },
  // ...
});
```

---

## 3. URLs de Teste

| Recurso | URL |
|---------|-----|
| **Checkout Sandbox** | `http://localhost:3000/checkout.html?plan=starter&sandbox=true` |
| **Asaas Dashboard** | https://sandbox.asaas.com |
| **Asaas API Base** | https://api.sandbox.asaas.com/v3 |

---

## 4. Dados de Teste Válidos

### CPF Teste
```
CPF: 123.456.789-01
Nome: João Silva
Email: joao@teste.com
Telefone: (11) 99999-9999
```

### PIX Teste
- QR Code será gerado automaticamente
- Código PIX será exibido
- **Não precisa escanear** — é gerado pelo Asaas

### Cartão Teste (para futura implementação)

#### Cartões aceitos (Sandbox)
| Bandeira | Número | Expiry | CVV | Status |
|----------|--------|--------|-----|--------|
| Visa | 4111 1111 1111 1111 | 12/25 | 123 | SUCESSO |
| Mastercard | 5555 5555 5555 4444 | 12/25 | 123 | SUCESSO |
| Visa | 4000 0000 0000 0002 | 12/25 | 123 | RECUSADO |

---

## 5. Confirmar Pagamento no Dashboard Sandbox

### Passo 1: Acessar Dashboard
1. Login em https://sandbox.asaas.com
2. Menu → Cobranças

### Passo 2: Localizar Cobrança
1. Filtrar por sua `externalReference` (plan:starter:uid:...)
2. Clicar na cobrança

### Passo 3: Marcar como Confirmada
1. Clicar em "Ações" → "Confirmar Pagamento"
2. Ou status muda automaticamente após alguns segundos em sandbox

### Passo 4: Verificar Atualização
1. Frontend deve receber status='CONFIRMED' no polling
2. Deve redirecionar para members.html

---

## 6. Monitorar Edge Functions (Logs)

### Ver Logs em Tempo Real
1. **Supabase Console** → Edge Functions
2. Clicar em "process-payment"
3. Aba "Logs"
4. Você verá:
   ```
   [process-payment] Iniciando pagamento: userId=..., plan=starter, method=pix
   [process-payment] Cliente criado: cus_XXXXXX
   [process-payment] Cobrança criada: pay_XXXXXX, status: PENDING
   ```

### Debug Polling
1. Abrir DevTools (F12)
2. Console → Filtrar por "confirm-pix-payment"
3. Você verá as requisições a cada 2 segundos

---

## 7. Testes Recomendados (Ordem)

### Fase 1: Validação de Entrada ✅
- [ ] CPF válido aceita
- [ ] CPF inválido rejeita
- [ ] Email inválido rejeita
- [ ] Telefone incompleto rejeita

### Fase 2: Integração API ✅
- [ ] Gera QR Code com sucesso
- [ ] Código PIX é copiável
- [ ] Logs mostram "Cliente criado"
- [ ] Logs mostram "Cobrança criada"

### Fase 3: Confirmação PIX ✅
- [ ] Confirmar no Dashboard
- [ ] Frontend recebe CONFIRMED
- [ ] Redireciona para members.html
- [ ] Tabela payments tem status='CONFIRMED'
- [ ] Tabela profiles tem plano atualizado

### Fase 4: Cartão (Futura) ⏳
- [ ] Validação de número (16 dígitos)
- [ ] Validação de expiração (MM/YY)
- [ ] Validação de CVV (3-4 dígitos)

---

## 8. Webhook Asaas (Automático)

Se quiser que o Asaas confirme pagamentos automaticamente (sem polling):

### Configurar Webhook no Dashboard
1. **Sandbox** → Configurações → Webhooks
2. Clicar "Novo Webhook"
3. **URL:** `https://seu-dominio.com/functions/v1/webhook-asaas`
4. **Eventos:** Selecionar "payment.confirmed"
5. Salvar

### O Webhook Receberá (POST)
```json
{
  "id": "evt_XXXXXX",
  "event": "payment.confirmed",
  "data": {
    "id": "pay_XXXXXX",
    "status": "CONFIRMED",
    "externalReference": "plan:starter:uid:..."
  }
}
```

---

## 9. Migração para Produção

Uma vez que sandbox está funcionando:

### Passo 1: Obter Chave Produção
1. Acessar https://app.asaas.com (produção)
2. Dashboard → Configurações → API
3. Copiar chave de produção (começa com `$aact_prod_...`)

### Passo 2: Atualizar Supabase
1. **Supabase Console** → Settings → Secrets
2. Editar `ASAAS_API_KEY` com chave de produção
3. **Não deletar** `ASAAS_API_KEY_SANDBOX` (manter para testes)

### Passo 3: Revert Edge Functions
Se modificou as URLs para sandbox, voltar para produção:
- `https://api.sandbox.asaas.com/v3` → `https://api.asaas.com/v3`

### Passo 4: Re-deploy
```bash
supabase functions deploy process-payment
supabase functions deploy confirm-pix-payment
```

### Passo 5: Testar em Produção
1. Acessar `checkout.html?plan=starter` (sem sandbox=true)
2. Fazer teste com CPF real (válido)
3. Confirmar pagamento em https://app.asaas.com
4. Verificar logs em Supabase

---

## 10. Troubleshooting

### Problema: "Chave inválida"
```
Erro: 401 Unauthorized
```
**Solução:** Verificar se a chave é do Asaas (começa com `$aact_`) e está copiada corretamente.

### Problema: "URL não encontrada"
```
Erro: 404 Not Found
```
**Solução:** Verificar se está usando a URL correta:
- Sandbox: `https://api.sandbox.asaas.com/v3`
- Produção: `https://api.asaas.com/v3`

### Problema: "Cliente não criado"
```
[process-payment] Erro ao criar cliente: {...}
```
**Solução:** CPF pode já estar registrado em produção. Usar CPF diferente.

### Problema: "QR Code não aparece"
**Solução:**
1. Verificar se QRCode.js CDN está carregando (DevTools → Network)
2. Verificar se `qrContainer` tem elemento `<div id="qr-code-container">`
3. Verificar console por erros JavaScript

### Problema: "Polling não confirma"
**Solução:**
1. Confirmar cobrança manualmente no Dashboard Asaas
2. Aguardar 2-5 segundos (polling a cada 2s)
3. Verificar se `paymentId` está sendo passado corretamente
4. Verificar logs em "confirm-pix-payment"

---

## 11. Checklist Final

Antes de ir para produção:

- [ ] Sandbox criado em https://sandbox.asaas.com
- [ ] API Key sandbox gerada e salva
- [ ] Edge Functions modificadas para sandbox (URL e/ou chave)
- [ ] Todas as validações (TC-001 a TC-004) = PASS
- [ ] QR Code gerado com sucesso (TC-005) = PASS
- [ ] Código PIX copiável (TC-006) = PASS
- [ ] Confirmação de pagamento funciona (TC-007) = PASS
- [ ] Banco de dados atualizado corretamente (TC-016 a TC-018) = PASS
- [ ] Logs não mostram erros de API
- [ ] API Key produção copiada
- [ ] Edge Functions revertidas para produção
- [ ] Webhook produção configurado (opcional)
- [ ] Primeiro pagamento real testado com valor mínimo

---

**Sucesso! 🎉 Seu checkout customizado está pronto para produção.**

