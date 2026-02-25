# Quick Reference — Checkout Customizado ZENT A.I.

**TL;DR — Resumo Executivo**

---

## 1. Arquitetura

```
Frontend (checkout.html + checkout-new.js)
    ↓ POST /functions/v1/process-payment
Edge Function: process-payment (Deno/TypeScript)
    ↓ POST https://api.asaas.com/v3/payments
Asaas API (PIX + Cartão)
    ↓ Response: { qrCode, pixCopiaECola, paymentId }

Frontend: Exibe QR Code, inicia polling
    ↓ GET /functions/v1/confirm-pix-payment?paymentId=...
Edge Function: confirm-pix-payment (polling)
    ↓ GET https://api.asaas.com/v3/payments/{id}
Asaas API
    ↓ Response: { status: 'CONFIRMED' }
Edge Function: UPDATE payments + profiles
    ↓
Frontend: Redireciona para members.html
```

---

## 2. Fluxos Rápidos

### Fluxo PIX
1. User acessa `/checkout.html?plan=starter`
2. Preenche dados (nome, CPF, email, telefone)
3. Clica "Gerar QR Code"
4. Frontend: POST `/process-payment` com method='pix'
5. Backend: Cria cliente Asaas + cobrança PIX
6. Frontend: Exibe QR Code + código cópia-cola
7. Frontend: Inicia polling a cada 2s
8. User confirma no app bancário
9. Asaas marca como CONFIRMED
10. Frontend recebe status=CONFIRMED
11. Redireciona para `/members.html`

### Fluxo Cartão (Placeholder)
1. User seleciona "Cartão"
2. Preenche campos (número, titular, expiry, CVV)
3. Clica "Pagar com cartão"
4. Alert: "Pagamento por cartão será processado aqui"
5. ⏳ Implementação futura com tokenização

---

## 3. URLs Importantes

| Recurso | URL |
|---------|-----|
| Checkout | `/checkout.html?plan=starter\|basico\|profissional\|premium` |
| Checkout Sandbox | `/checkout.html?plan=starter&sandbox=true` |
| API Process Payment | `POST /functions/v1/process-payment` |
| API Confirm PIX | `GET /functions/v1/confirm-pix-payment?paymentId=X&userId=Y` |
| Asaas API (Prod) | `https://api.asaas.com/v3` |
| Asaas API (Sandbox) | `https://api.sandbox.asaas.com/v3` |
| Asaas Dashboard (Prod) | https://app.asaas.com |
| Asaas Dashboard (Sandbox) | https://sandbox.asaas.com |

---

## 4. Validações Implementadas

| Campo | Regra | Erro |
|-------|-------|------|
| Nome | min 3 caracteres | "Nome completo obrigatório" |
| CPF | Módulo 11 (2 dígitos) | "CPF inválido" |
| Email | Regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | "E-mail inválido" |
| Telefone | 10-11 dígitos | "WhatsApp inválido" |
| Número Cartão | Exatamente 16 dígitos | "Cartão inválido" |
| Expiração | MM/YY (2/4 dígitos) | "Formato: MM/YY" |
| CVV | 3-4 dígitos | "CVV inválido" |

---

## 5. Máscaras de Input

| Campo | Entrada | Saída |
|-------|---------|-------|
| CPF | 12345678901 | 123.456.789-01 |
| Telefone | 11999999999 | (11) 99999-9999 |
| Cartão | 1234567890123456 | 1234 5678 9012 3456 |
| Expiração | 1225 | 12/25 |

---

## 6. Planos e Valores

| Plano | Valor | Features |
|-------|-------|----------|
| starter | R$ 197 | 5 features |
| basico | R$ 397 | 6 features |
| profissional | R$ 697 | 7 features |
| premium | R$ 997 | 8 features |

---

## 7. Estados de Pagamento

```
PENDING → Pagamento criado, aguardando confirmação
CONFIRMED → Pagamento confirmado, plano ativado
FAILED → Pagamento falhou, user pode tentar novamente
```

---

## 8. Resposta API `/process-payment`

```json
{
  "success": true,
  "paymentId": "pay_123456",
  "status": "PENDING",
  "method": "pix",
  "qrCode": "00020126360014br.gov.bcb.brcode...",
  "pixCopiaECola": "00020126360014br.gov.bcb...",
  "expiresAt": "2026-02-26T14:30:00Z"
}
```

---

## 9. Resposta API `/confirm-pix-payment`

```json
{
  "success": true,
  "paymentId": "pay_123456",
  "status": "CONFIRMED",
  "confirmedAt": "2026-02-25T10:30:00Z"
}
```

---

## 10. Tabela: payments

```sql
id                    UUID (PK)
user_id               UUID (FK → profiles.user_id)
asaas_payment_id      TEXT (UNIQUE)
plan                  TEXT (starter|basico|profissional|premium)
amount                DECIMAL (197.00, 397.00, etc)
method                TEXT (pix|card)
status                TEXT (PENDING|CONFIRMED|FAILED)
qr_code_id            TEXT (PIX QR code)
pix_key               TEXT (PIX cópia-cola)
created_at            TIMESTAMPTZ
confirmed_at          TIMESTAMPTZ
updated_at            TIMESTAMPTZ
```

---

## 11. Tabela: profiles (alterações)

```sql
-- Campo existente, será atualizado:
plan                  TEXT (após confirmação de pagamento)
updated_at            TIMESTAMPTZ (timestamp da atualização)
```

---

## 12. Segredos do Supabase

| Chave | Descrição |
|-------|-----------|
| `ASAAS_API_KEY` | Chave de produção da API Asaas |
| `ASAAS_API_KEY_SANDBOX` | Chave de teste (sandbox) da API Asaas |

---

## 13. Arquivos Criados

```
js/checkout-new.js                      (450+ linhas)
supabase/functions/process-payment/     (280+ linhas)
supabase/functions/confirm-pix-payment/ (140+ linhas)
CHECKOUT_TEST_PLAN.md                   (Este documento)
ASAAS_SANDBOX_SETUP.md                  (Setup sandbox)
CHECKOUT_QUICK_REFERENCE.md             (Este arquivo)
```

---

## 14. Arquivos Modificados

```
checkout.html                            (HTML redesenhado)
css/style.css                            (Estilos novos)
.env / Supabase Secrets                  (ASAAS_API_KEY adicionada)
```

---

## 15. Comandos Úteis (Supabase CLI)

```bash
# Deploy Edge Functions
supabase functions deploy process-payment
supabase functions deploy confirm-pix-payment

# Ver logs
supabase functions inspect process-payment
supabase functions inspect confirm-pix-payment

# Testar localmente (opcional)
supabase start
supabase functions serve
```

---

## 16. Testar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor local
npm run dev

# 3. Acessar checkout
# http://localhost:3000/checkout.html?plan=starter

# 4. DevTools (F12) para ver logs + requisições
# Network: POST /process-payment
# Network: GET /confirm-pix-payment
# Console: Logs do checkout-new.js
```

---

## 17. Deploy para Produção

```bash
# 1. Verificar alterações
git status
git diff

# 2. Commit
git add .
git commit -m "feat: Deploy checkout customizado Asaas com PIX + Cartão"

# 3. Push para main
git push origin main

# 4. Deploy Edge Functions
supabase functions deploy --project-ref <PROJECT_ID>

# 5. Testar em produção
# https://seu-dominio.com/checkout.html?plan=starter
```

---

## 18. Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| QR Code não aparece | Verificar DevTools → Network (QRCode.js carregou?) |
| Polling não confirma | Confirmar pagamento no Dashboard Asaas |
| API Key inválida | Verificar chave em Supabase → Secrets |
| CPF rejeitado | Usar CPF válido (módulo 11) ou 123.456.789-01 para teste |
| Erro 405 (Method Not Allowed) | Verificar se método é POST (process-payment) ou GET (confirm-pix-payment) |
| Erro 400 (Bad Request) | Validar JSON body (userId, plan, cpf, email, phone, name, method) |

---

## 19. Próximas Fases

### Fase 1: ✅ COMPLETO
- [x] Checkout customizado
- [x] PIX com QR Code
- [x] Validações
- [x] Integração Asaas

### Fase 2: ⏳ EM PROGRESSO
- [ ] Testes Sandbox (TC-001 a TC-023)
- [ ] Ajustes baseado em testes

### Fase 3: ⏳ PLANEJADO
- [ ] Migração para Produção
- [ ] Webhook Asaas (automático)

### Fase 4: ⏳ FUTURO
- [ ] Cartão de Crédito (tokenização)
- [ ] Reembolsos
- [ ] Faturas recorrentes

---

## 20. Contatos Úteis

| Recurso | Link |
|---------|------|
| Docs Asaas | https://docs.asaas.com |
| Docs Supabase | https://supabase.com/docs |
| QRCode.js | https://davidsharp.com/qrcode.js/ |
| Deno Manual | https://docs.deno.com |

---

**Versão:** 1.0
**Última Atualização:** 2026-02-25
**Mantido por:** Claude (Dev Agent)

