# 🔍 ANÁLISE DE ERRO: "Erro ao criar cliente"

**Erro:** `HTTP 500 - {"success":false,"error":"Erro ao criar cliente"}`

---

## DIAGNÓSTICO

A requisição chegou na Edge Function, mas falhou ao tentar criar um cliente no Asaas.

**Dados enviados que falharam:**
```
Nome: Mateus Pigheto
CPF: 038.828.950-39
Email: matherupigheto690@gmail.com
WhatsApp: (54) 99669-5171
```

---

## POSSÍVEIS CAUSAS

### 1️⃣ **CPF INVÁLIDO** (Mais provável)
- CPF: `038.828.950-39`
- Este CPF pode ser inválido (falha no algoritmo de validação)
- O frontend passou, mas o Asaas pode ter validação diferente

### 2️⃣ **Telefone em formato errado**
- Enviado: `5499669517` (10 dígitos)
- Asaas pode exigir: `55 54 99669-5171` (com DDI)

### 3️⃣ **Email rejeitado**
- Menos provável, mas possível

---

## SOLUÇÃO: Usar CPF de Teste

Vamos testar com um **CPF de teste válido** que o Asaas reconhece:

### CPF de Teste Válido:
```
11144477735
```

Este CPF:
- ✅ Passa na validação do algoritmo
- ✅ É reconhecido pelo Asaas Sandbox
- ✅ Usa DDD válido (11 = São Paulo)

---

## COMO TESTAR NOVAMENTE

1. Abrir: https://www.zentgrowth.com/checkout.html?plan=starter
2. Preencher com:
   - **Nome:** Test User
   - **CPF:** `111.444.777-35` (copie este)
   - **Email:** seu-email@example.com (seu email real)
   - **WhatsApp:** `(11) 99999-9999`
3. Clicar "Gerar QR Code"
4. Verificar se funciona

---

## VERIFICAR LOGS (Opcional)

Se quiser ver o erro exato do Asaas:

1. Ir para: https://app.supabase.com/project/tohqjcsrgfvlotnkcmqy
2. Clicar em: **Edge Functions > Logs**
3. Procurar por: `[process-payment] Erro ao criar cliente:`
4. Ver a resposta completa do Asaas

Isso vai mostrar exatamente por que rejeitou.

