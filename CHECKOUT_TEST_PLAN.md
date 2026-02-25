# Plano de Teste — Checkout Customizado Asaas

**Versão:** 1.0
**Data:** 2026-02-25
**Responsável:** QA / Development Team
**Status:** Pronto para Execução

---

## 1. Escopo do Teste

Validar a integração completa do checkout customizado com API Asaas, incluindo:
- Fluxo PIX (QR Code, polling de confirmação)
- Fluxo Cartão de Crédito (validação, processamento)
- Validações de entrada (CPF, telefone, email)
- Atualização de plano após pagamento confirmado
- Tratamento de erros

---

## 2. Ambiente de Teste

### Sandbox Asaas
- **URL Base:** `https://sandbox.asaas.com`
- **API Endpoint:** `https://api.sandbox.asaas.com/v3`
- **API Key:** Use a chave sandbox do Asaas (diferente da produção)
- **Dashboard:** https://sandbox.asaas.com/login

### Supabase (Teste)
- **Ambiente:** Teste em staging ou create new project
- **Tabela:** `payments` (com RLS habilitado)
- **Edge Functions:** Deploy em staging

### Frontend (Local)
- **URL:** `http://localhost:3000/checkout.html?plan=starter`
- **Browser:** Chrome, Firefox, Safari (testar cross-browser)

---

## 3. Dados de Teste

### CPF Válido (Teste)
```
CPF: 123.456.789-01
Nome: João Silva Teste
Email: joao@teste.com
Telefone: (11) 99999-9999
```

### CPF Inválido (Validação)
```
CPF: 000.000.000-00 (todos iguais)
CPF: 111.111.111-11 (todos iguais)
```

### Cartão de Crédito (Sandbox Asaas)
```
Número: 4111 1111 1111 1111
Titular: JOAO S TESTE
Vencimento: 12/25
CVV: 123
```

**Nota:** Usar números de teste oficiais do Asaas (sandbox)

---

## 4. Cenários de Teste

### 4.1 Validação de Entrada

#### TC-001: CPF Válido
- **Ação:** Preencher CPF válido (123.456.789-01)
- **Resultado Esperado:** Sem erro, campo aceita valor
- **Status:** [ ] PASS [ ] FAIL

#### TC-002: CPF Inválido (Módulo 11)
- **Ação:** Preencher CPF 000.000.000-00
- **Resultado Esperado:** Erro "CPF inválido"
- **Status:** [ ] PASS [ ] FAIL

#### TC-003: Email Inválido
- **Ação:** Preencher email "invalido@"
- **Resultado Esperado:** Erro "E-mail inválido"
- **Status:** [ ] PASS [ ] FAIL

#### TC-004: Telefone Incompleto
- **Ação:** Preencher telefone "(11) 9999" (menos de 10 dígitos)
- **Resultado Esperado:** Erro "WhatsApp inválido"
- **Status:** [ ] PASS [ ] FAIL

---

### 4.2 Fluxo PIX

#### TC-005: Gerar QR Code
- **Ação:**
  1. Acessar `checkout.html?plan=starter`
  2. Preencher dados válidos
  3. Selecionar PIX
  4. Clicar "Gerar QR Code"
- **Resultado Esperado:**
  - QR Code é gerado e exibido
  - Código PIX (cópia e cola) é mostrado
  - Status "Aguardando confirmação..." aparece
  - Spinner de carregamento ativo
- **Status:** [ ] PASS [ ] FAIL

#### TC-006: Copiar Código PIX
- **Ação:**
  1. Após gerar QR Code, clicar "Copiar código"
  2. Colar em editor de texto
- **Resultado Esperado:**
  - Código PIX é copiado para clipboard
  - Alert "Código PIX copiado!" aparece
  - Código contém estrutura válida PIX (QR Code string)
- **Status:** [ ] PASS [ ] FAIL

#### TC-007: Confirmar Pagamento PIX (Sandbox)
- **Ação:**
  1. Gerar QR Code
  2. No Asaas Sandbox, marcar pagamento como confirmado
  3. Aguardar polling (máx 10s)
- **Resultado Esperado:**
  - Página exibe "✓ Parabéns! Seu pagamento foi confirmado."
  - Redireciona para `members.html` após 2s
  - Tabela `payments` tem registro com status='CONFIRMED'
  - Tabela `profiles` tem plano atualizado para 'starter'
  - `audit_log` contém entry de PAYMENT_CONFIRMED_PIX
- **Status:** [ ] PASS [ ] FAIL

#### TC-008: Timeout PIX (sem confirmação)
- **Ação:**
  1. Gerar QR Code
  2. Aguardar 30s sem confirmar pagamento
- **Resultado Esperado:**
  - Página continua em "Aguardando confirmação..."
  - Nenhum erro é exibido
  - Usuário pode fechar e voltar (polling está em setTimeout)
- **Status:** [ ] PASS [ ] FAIL

---

### 4.3 Fluxo Cartão de Crédito

#### TC-009: Validação Número Cartão (16 dígitos)
- **Ação:**
  1. Selecionar Cartão
  2. Preencher "4111 1111 1111 111" (15 dígitos)
  3. Clicar "Pagar com cartão"
- **Resultado Esperado:**
  - Erro "Cartão inválido"
  - Campo fica com border vermelho (is-invalid)
- **Status:** [ ] PASS [ ] FAIL

#### TC-010: Validação Expiração (MM/YY)
- **Ação:**
  1. Preencher Vencimento "13/25" (mês inválido)
  2. Clicar "Pagar com cartão"
- **Resultado Esperado:**
  - Erro "Formato: MM/YY"
- **Status:** [ ] PASS [ ] FAIL

#### TC-011: Validação CVV (3-4 dígitos)
- **Ação:**
  1. Preencher CVV "12" (2 dígitos)
  2. Clicar "Pagar com cartão"
- **Resultado Esperado:**
  - Erro "CVV inválido"
- **Status:** [ ] PASS [ ] FAIL

#### TC-012: Submeter Cartão Válido (Placeholder)
- **Ação:**
  1. Preencher todos campos cartão válidos
  2. Clicar "Pagar com cartão"
- **Resultado Esperado:**
  - Alert "Pagamento por cartão será processado aqui" (placeholder)
  - Nenhuma chamada à API Asaas ainda (implementação futura)
- **Status:** [ ] PASS [ ] FAIL

---

### 4.4 Integração Asaas API

#### TC-013: Criar Cliente no Asaas
- **Ação:** Submeter PIX com CPF novo
- **Resultado Esperado:**
  - API Asaas cria novo customer via `POST /customers`
  - Log: "[process-payment] Cliente criado: cus_XXXXXX"
- **Status:** [ ] PASS [ ] FAIL

#### TC-014: Reutilizar Cliente Existente
- **Ação:** Submeter PIX 2x com mesmo CPF
- **Resultado Esperado:**
  - 1ª: Cliente criado (nova chamada POST)
  - 2ª: Cliente reutilizado (busca GET, sem novo POST)
  - Log: "[process-payment] Cliente existente: cus_XXXXXX"
- **Status:** [ ] PASS [ ] FAIL

#### TC-015: Criar Cobrança PIX
- **Ação:** Submeter PIX
- **Resultado Esperado:**
  - API Asaas cria payment via `POST /payments`
  - Response contém: `id`, `pixQrCode`, `pixCopiaECola`
  - `externalReference` = "plan:starter:uid:{userId}"
- **Status:** [ ] PASS [ ] FAIL

---

### 4.5 Banco de Dados (Supabase)

#### TC-016: Registro em `payments`
- **Ação:** Submeter PIX
- **Resultado Esperado:**
  - Inserção em `payments` com status='PENDING'
  - Campos preenchidos: user_id, asaas_payment_id, plan, amount, method, qr_code_id, pix_key
- **Status:** [ ] PASS [ ] FAIL

#### TC-017: Atualizar para CONFIRMED
- **Ação:** Confirmar pagamento PIX (Asaas Sandbox)
- **Resultado Esperado:**
  - `payments.status` = 'CONFIRMED'
  - `payments.confirmed_at` = timestamp
  - `profiles.plan` = 'starter' (ou plano escolhido)
  - `profiles.updated_at` = timestamp novo
- **Status:** [ ] PASS [ ] FAIL

#### TC-018: Audit Log
- **Ação:** Confirmar pagamento PIX
- **Resultado Esperado:**
  - Inserção em `audit_log` com:
    - action='PAYMENT_CONFIRMED_PIX'
    - resource_type='subscription'
    - changes.plan, changes.payment_id, changes.payment_method
- **Status:** [ ] PASS [ ] FAIL

---

### 4.6 Tratamento de Erros

#### TC-019: API Key Inválida
- **Ação:** Remover/invalidar ASAAS_API_KEY no Supabase
- **Resultado Esperado:**
  - Submeter PIX
  - Error: "Configuração interna inválida"
- **Status:** [ ] PASS [ ] FAIL

#### TC-020: Plano Inválido (URL)
- **Ação:** Acessar `checkout.html?plan=invalido`
- **Resultado Esperado:**
  - Formulário não é exibido
  - Mensagem: "Plano não encontrado. Ver planos disponíveis."
- **Status:** [ ] PASS [ ] FAIL

#### TC-021: Sem Autenticação
- **Ação:** Acessar `checkout.html` sem estar logado
- **Resultado Esperado:**
  - Função `zentAuth.requireAuth()` redireciona para login
  - Ou mostra erro de autenticação
- **Status:** [ ] PASS [ ] FAIL

---

## 5. Testes Cross-Browser

| Browser | Versão | TC-001 | TC-005 | TC-007 | TC-009 | Status |
|---------|--------|--------|--------|--------|--------|--------|
| Chrome | 130+ | [ ] | [ ] | [ ] | [ ] | [ ] |
| Firefox | 130+ | [ ] | [ ] | [ ] | [ ] | [ ] |
| Safari | 17+ | [ ] | [ ] | [ ] | [ ] | [ ] |
| Mobile Chrome | Latest | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## 6. Testes de Performance

#### TC-022: Tempo de Geração QR Code
- **Ação:** Medir tempo entre submit e aparição do QR Code
- **Resultado Esperado:** < 2 segundos
- **Tempo Medido:** _____ ms
- **Status:** [ ] PASS [ ] FAIL

#### TC-023: Latência Polling
- **Ação:** Confirmar PIX e medir até redirecionamento
- **Resultado Esperado:** < 10 segundos (com polling a cada 2s)
- **Tempo Medido:** _____ ms
- **Status:** [ ] PASS [ ] FAIL

---

## 7. Checklist Pré-Produção

- [ ] Todas TCs do 4.1 (Validação) = PASS
- [ ] Todas TCs do 4.2 (PIX) = PASS
- [ ] Todas TCs do 4.4 (Asaas API) = PASS
- [ ] Todas TCs do 4.5 (BD) = PASS
- [ ] Todas TCs do 4.6 (Erros) = PASS
- [ ] Cross-browser teste = PASS (Chrome, Firefox, Safari)
- [ ] API Key configurada corretamente em produção
- [ ] Webhook Asaas testado (confirmação automática)
- [ ] Emails de confirmação enviados (se configurado)
- [ ] RLS policies verificadas

---

## 8. Rollback Plan

Se algum teste falhar criticamente:

1. **Revert checkout.html** para versão anterior (sem checkout customizado)
2. **Revert js/checkout-new.js** (ou desabilitar em HTML)
3. **Manter Edge Functions** (não são críticas se não chamadas)
4. **Verificar logs** em Supabase Console → Edge Functions
5. **Contactar Asaas** se erro for na API deles

---

## 9. Próximos Passos

1. ✅ **Implementação:** Checkout customizado criado
2. ✅ **Deploy:** Edge Functions ativas
3. ⏳ **Testes Sandbox:** Executar TCs deste plano
4. ⏳ **Testes Produção:** Migrar API Key de sandbox → produção
5. ⏳ **Monitoramento:** Verificar logs após ativação
6. ⏳ **Otimizações:** Implementar Cartão (tokenização)

---

## 10. Referências

- **Asaas API Docs:** https://docs.asaas.com
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions
- **QRCode.js:** https://davidsharp.com/qrcode.js/
- **Código Frontend:** `/js/checkout-new.js`
- **Código Backend:** `/supabase/functions/process-payment/` + `/confirm-pix-payment/`

---

**Assinado:** Claude (Dev Agent)
**Data:** 2026-02-25
