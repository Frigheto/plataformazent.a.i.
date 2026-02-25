# 🧪 Teste de Pagamentos Reais — Sandbox Asaas

**Data:** 2026-02-25
**Status:** 🟡 Pronto para Execução
**Ambiente:** Sandbox Asaas

---

## ✅ Pré-requisitos Completados

- ✅ Conta Sandbox Asaas criada
- ✅ API Key Sandbox gerada e configurada
- ✅ Secret `ASAAS_API_KEY_SANDBOX` adicionado no Supabase
- ✅ Edge Functions `process-payment` e `confirm-pix-payment` redeploy executado
- ✅ Checkout customizado pronto (localhost:5173)
- ✅ Banco de dados com tabela `payments` configurado

---

## 📋 Checklist de Testes

### Passo 1: Preparação

- [ ] Obter Supabase URL em Settings → API
- [ ] Obter Anon Key em Settings → API
- [ ] Fazer login no site (http://localhost:5173)
- [ ] Obter User ID via Console (DevTools F12)
- [ ] Editar `/tmp/test_sandbox_payment.sh` com valores reais
- [ ] Preparar Sandbox Asaas para testes (abrir em aba separada)

### Passo 2: Execução

- [ ] Executar: `bash /tmp/test_sandbox_payment.sh`
- [ ] Teste Starter (R$ 197)
  - [ ] QR Code gerado
  - [ ] Confirmar no Sandbox Asaas
  - [ ] Polling detectou confirmação
  - [ ] Redirecionou para /members.html
  - [ ] Plano ativo em Members
- [ ] Teste Básico (R$ 397) — repetir passos acima
- [ ] Teste Profissional (R$ 697) — repetir passos acima
- [ ] Teste Premium (R$ 997) — repetir passos acima

### Passo 3: Verificação

#### No Site (http://localhost:5173/members.html)
- [ ] Plano Starter aparece como ATIVO
- [ ] Plano Básico aparece como ATIVO
- [ ] Plano Profissional aparece como ATIVO
- [ ] Plano Premium aparece como ATIVO

#### No Supabase — Tabela `payments`
- [ ] 4 registros (um para cada plano)
- [ ] Coluna `status` = "CONFIRMED" em todos
- [ ] Coluna `asaas_payment_id` preenchida
- [ ] Coluna `plan` com valores corretos (starter, basico, profissional, premium)
- [ ] Coluna `confirmed_at` com data/hora

#### No Supabase — Tabela `profiles`
- [ ] Coluna `plan` contém o último plano testado
- [ ] Coluna `updated_at` é recente (último teste)
- [ ] Coluna `subscription_status` = "active"

#### No Supabase — Tabela `audit_log`
- [ ] 4 registros com `action` = "PAYMENT_CONFIRMED_PIX"
- [ ] Cada registro tem `resource_id` do usuário
- [ ] Coluna `changes` contém informações do pagamento

---

## 🎯 Fluxo Esperado

```
[1] Usuário acessa http://localhost:5173/checkout.html?plan=starter
    ↓
[2] Preenche formulário (nome, CPF, email, telefone)
    ↓
[3] Seleciona PIX e clica "Gerar QR Code"
    ↓
[4] Edge Function process-payment é acionada
    - Cria cliente no Asaas
    - Cria pagamento no Asaas
    - Insere em BD (payments) com status=PENDING
    - Retorna QR Code e código PIX
    ↓
[5] QR Code é exibido (gerado via QRCode.js)
    Código PIX cópia-cola é exibido
    ↓
[6] Frontend inicia polling (GET /confirm-pix-payment a cada 2s)
    ↓
[7] Usuário confirma pagamento no Sandbox Asaas
    ↓
[8] Polling detecta status=CONFIRMED
    - Atualiza payments.status = CONFIRMED
    - Atualiza profiles.plan = starter
    - Insere em audit_log
    ↓
[9] Exibe mensagem de sucesso
    Redireciona para /members.html
    ↓
[10] Usuário vê plano ativado em Members ✅
```

---

## 🚀 Instruções Rápidas

### Obter Supabase URL e Anon Key
```
1. https://app.supabase.com → seu projeto
2. Settings → API
3. Copie "Project URL" e "anon public"
```

### Obter User ID
```
1. http://localhost:5173 (faça login)
2. F12 → Console
3. Execute: const { data } = await supabase.auth.getUser(); console.log(data.user.id);
4. Copie o UUID
```

### Editar Script
```bash
nano /tmp/test_sandbox_payment.sh

# Altere:
SUPABASE_URL="https://abcxyz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1Ni..."
USER_ID="8d1589f9-d94a-42bc-bd8a-01852862349e"
```

### Executar Testes
```bash
bash /tmp/test_sandbox_payment.sh
```

---

## 🔗 Links Importantes

| Recurso | URL |
|---------|-----|
| Site (Checkout) | http://localhost:5173/checkout.html?plan=starter |
| Members | http://localhost:5173/members.html |
| Supabase Console | https://app.supabase.com |
| Sandbox Asaas | https://sandbox.asaas.com |
| API Asaas Docs | https://docs.asaas.com |

---

## 🆘 Troubleshooting

### Problema: "Edge Function error"
```
Solução: Verifique se o Secret ASAAS_API_KEY_SANDBOX foi configurado
         e se a Edge Function foi redeploy
```

### Problema: "paymentId não encontrado"
```
Solução: Verificar resposta completa do POST /process-payment
         Pode haver erro na API (CPF inválido, etc)
```

### Problema: "Pagamento não confirma"
```
Solução: Confirme corretamente no Sandbox Asaas
         Espere antes de pressionar ENTER no script
```

### Problema: "Não redireciona para /members.html"
```
Solução: Abra DevTools (F12 → Console)
         Verifique se há erros de JavaScript
```

---

## 📊 Resultado Esperado

```
✅ 4 Pagamentos criados (um para cada plano)
✅ Todos com status CONFIRMED
✅ Banco de dados atualizado corretamente
✅ Planos ativos em Members
✅ Audit log registrado
✅ Fluxo completo funcionando
```

---

## 📝 Observações

- CPF para teste: `11144477735` (válido para testes)
- Email pode ser qualquer um (teste@exemplo.com)
- Telefone em formato: (11) 99999-9999
- Cada teste confirma um plano diferente (Starter, Básico, Profissional, Premium)

---

**Próximo Passo:** Após validar todos os testes, estará pronto para **deploy em Produção** com a API Key real do Asaas.
