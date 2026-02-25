# 🔄 GUIA COMPLETO: FORÇAR REDEPLOY E TESTAR EDGE FUNCTIONS

## PROBLEMA DIAGNOSTICADO

O código foi atualizado no repositório git, mas a Supabase ainda está executando a versão antiga em cache.

**Evidência:** Seu log mostra: `"ASAAS_API_KEY_SANDBOX ou ASAAS_API_KEY não configurada"`

Mas o código atual diz: `"Asaas API Key não disponível"`

Isso significa: **A Supabase não redesplegou o novo código.**

---

## PARTE 1: TESTAR ANTES DO REDEPLOY (Validar problema)

### Teste 1: Verificar versão antiga executando

```bash
# Abrir Developer Console do navegador (F12)
# Ir em: Network tab
# Colar isso no console:

fetch('https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'test-user',
    plan: 'starter',
    cpf: '11144477735',
    email: 'test@example.com',
    phone: '11999999999',
    name: 'Teste User',
    method: 'pix'
  })
})
.then(r => r.json())
.then(data => console.log('Response:', JSON.stringify(data, null, 2)))
.catch(e => console.error('Error:', e))
```

**Esperado (antes do redeploy):**
```
{"success":false,"error":"Configuração interna inválida"}
```

Com log em background (Supabase Dashboard > Logs):
```
[process-payment] ASAAS_API_KEY_SANDBOX ou ASAAS_API_KEY não configurada
```

---

## PARTE 2: FORÇAR REDEPLOY (Solução)

### OPÇÃO A: Via Web UI (Recomendado - 100% funciona)

**Passo 1: Redeploy Edge Function 1**
1. Abrir: https://app.supabase.com/project/tohqjcsrgfvlotnkcmqy/functions
2. Clicar em `process-payment`
3. Você verá o código atual (com API Key hardcoded)
4. Clicar em botão **"Deploy"** (canto superior direito)
5. Aguardar popup aparecer: "Deployed successfully ✅"
6. Voltar para lista de Edge Functions (clique em "Functions" no menu)

**Passo 2: Redeploy Edge Function 2**
7. Clicar em `confirm-pix-payment`
8. Você verá o código atual (com API Key hardcoded)
9. Clicar em botão **"Deploy"** (canto superior direito)
10. Aguardar: "Deployed successfully ✅"

**Passo 3: Aguardar propagação**
- Esperar 30-60 segundos para CDN/cache se atualizar
- A mensagem de deploy pode levar um tempo para propagar

### OPÇÃO B: Via Supabase CLI (Se Web UI não funcionar)

```bash
# Se ainda não tem npm instalado:
npm install -g supabase

# No diretório do projeto:
cd /Users/mateus/Documents/zentplataformaagência
supabase functions deploy

# Ele redesplegará TODAS as Edge Functions
# Aguarde mensagem: "✅ Functions deployed successfully"
```

---

## PARTE 3: TESTAR APÓS REDEPLOY (Validar sucesso)

### Teste 1: Verificar nova versão executando

```bash
# Console do navegador (F12), cole e execute:

fetch('https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '550e8400-e29b-41d4-a716-446655440000',
    plan: 'starter',
    cpf: '11144477735',
    email: 'test@example.com',
    phone: '11999999999',
    name: 'Teste User',
    method: 'pix'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', JSON.stringify(data, null, 2));
  if (data.success) console.log('✅ NOVO CÓDIGO FUNCIONANDO!');
  else console.log('❌ Ainda erro:', data.error);
})
.catch(e => console.error('❌ Error:', e))
```

**Esperado (após redeploy correto):**
- ✅ `success: true` (o código conseguiu fazer a chamada Asaas)
- ✅ `paymentId` retornado
- ✅ `qrCode` ou `pixCopiaECola` retornado
- ✅ Log em Supabase mostrará: `[process-payment] Cliente criado: ...` ou similar

**Se ainda falhar:**
- ❌ `"Configuração interna inválida"` = ainda versão antiga
- Aguarde mais 60 segundos e tente novamente (cache)
- Ou limpe cache do browser: Ctrl+Shift+Delete (no Chrome)

### Teste 2: Fluxo completo no checkout

1. Abrir: https://www.zentgrowth.com/checkout.html?plan=starter
2. Preencher campos:
   - Nome: `Teste Pagamento`
   - CPF: `111.444.777-35`
   - Email: `test@zentagency.com`
   - WhatsApp: `(11) 99999-9999`
3. Selecionar: **PIX**
4. Clicar: **"Gerar QR Code"**
5. Verificar:
   - ✅ QR Code aparece
   - ✅ Código PIX Copia e Cola aparece
   - ✅ Mensagem de "Aguardando pagamento..." mostra
6. Abrir Supabase Dashboard > Logs
   - Verificar que `process-payment` passou (sem erro de API Key)
   - Verificar que `confirm-pix-payment` foi chamado (polling)

---

## CHECKLIST DE SUCESSO

- [ ] Redeploy `process-payment` concluído ✅
- [ ] Redeploy `confirm-pix-payment` concluído ✅
- [ ] Teste POST retorna `success: true` ✅
- [ ] QR Code gerado no checkout ✅
- [ ] Logs mostram novo código (ou com hardcoding funcionando) ✅
- [ ] Checkout não mostra erro 500 ✅

---

## SE ALGO DER ERRADO

### Cenário 1: "Ainda mostra erro 500 depois do redeploy"
1. Verificar logs: Supabase Dashboard > Edge Functions > Logs
2. Se log mostra `ASAAS_API_KEY_SANDBOX...` = **cache ainda não atualizado**
   - Aguardar 2-3 minutos
   - Ou clicar Deploy novamente
3. Se log mostra `Asaas API Key não disponível` = **novo código está rodando**
   - Mas há outro erro (talvez API Asaas rejeitando a requisição)
   - Checar formato da chamada Asaas ou validade da API Key

### Cenário 2: "Deploy botão não aparece"
- Tentar refresh (F5) na página
- Sair e entrar novamente no Supabase
- Usar CLI em vez de Web UI

### Cenário 3: "CLI npm install falha"
- Supabase CLI é opcional - web UI deploy é suficiente
- Continuar com Opção A (Web UI)

---

## EXPLICAÇÃO TÉCNICA (Por que isso aconteceu)

1. Você fez commit do código atualizado ✅
2. Seu repositório git tem a versão nova ✅
3. **MAS** Supabase tem 2 versões do código:
   - **Versão atual em execução** (o que o usuário vê) - ANTIGA
   - **Versão no editor web** (o que aparece quando abre) - NOVA
4. Para sincronizar, precisa clicar **"Deploy"** para empurrar a versão do editor para execução
5. O Git e a Web UI do Supabase não sincronizam automaticamente

---

## RESUMO

```
Seu Git ────► Atualizado ✅
              (commit 59d914c)

Supabase UI ─► Atualizado ✅
              (mostra código novo)

Supabase Edge Function (execução) ─► DESATUALIZADO ❌
              (ainda roda código antigo)

Solução: Clicar "Deploy" para sincronizar execução com UI
```

