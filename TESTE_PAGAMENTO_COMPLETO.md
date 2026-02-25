# 🧪 TESTE COMPLETO DO FLUXO PIX

## TESTE 1: Validar que Edge Functions estão atualizadas

**Abrir no navegador:**
```
Console (F12) → copie e execute:
```

```javascript
fetch('https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/process-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: '550e8400-e29b-41d4-a716-446655440000',
    plan: 'starter',
    cpf: '11144477735',
    email: 'teste@example.com',
    phone: '11999999999',
    name: 'Teste Pagamento',
    method: 'pix'
  })
})
.then(r => r.json())
.then(data => {
  console.log('=== RESULTADO ===');
  console.log('Success:', data.success);
  console.log('PaymentID:', data.paymentId);
  console.log('Status:', data.status);
  console.log('QR Code:', data.qrCode ? 'PRESENTE ✅' : 'FALTA ❌');
  console.log('Pix Copia e Cola:', data.pixCopiaECola ? 'PRESENTE ✅' : 'FALTA ❌');
  if (data.success) console.log('✅ NOVO CÓDIGO FUNCIONANDO!');
  else console.log('❌ Erro:', data.error);
})
.catch(e => console.error('❌ Error:', e))
```

**Esperado:**
```
Success: true
PaymentID: pay_XXXXXXXXXXXX
Status: PENDING
QR Code: PRESENTE ✅
Pix Copia e Cola: PRESENTE ✅
✅ NOVO CÓDIGO FUNCIONANDO!
```

---

## TESTE 2: Testar Checkout Completo (Interface Visual)

### Passo 1: Carregar checkout
1. Abrir: https://www.zentgrowth.com/checkout.html?plan=starter
2. Verificar que **carrega sem erros** ✅

### Passo 2: Preencher formulário
- Nome: `Teste da Silva`
- CPF: `111.444.777-35`
- Email: `teste@seu-email.com`
- WhatsApp: `(11) 99999-9999`

### Passo 3: Selecionar PIX
- Clicar no botão de seleção **PIX**
- Verificar que a seção PIX fica **visível** ✅

### Passo 4: Gerar QR Code
- Clicar botão: **"Gerar QR Code"**
- **VERIFICAR:**
  - [ ] Botão muda para "Gerando QR Code..." (loading)
  - [ ] QR Code aparece na tela ✅
  - [ ] Código PIX Copia e Cola aparece ✅
  - [ ] Mensagem "Aguardando pagamento..." aparece
  - [ ] **SEM ERRO 500** ✅

### Passo 5: Verificar Logs no Supabase
1. Abrir: https://app.supabase.com/project/tohqjcsrgfvlotnkcmqy
2. Ir em: **Edge Functions > Logs**
3. Procurar por `[process-payment]`
4. **Deve ver:**
   ```
   [process-payment] Iniciando pagamento: userId=..., plan=starter, method=pix
   [process-payment] Cliente criado: cus_XXXXXXXXXXXX
   [process-payment] Cobrança criada: pay_XXXXXXXXXXXX
   ```
5. **NÃO deve ver:**
   ```
   ASAAS_API_KEY_SANDBOX ou ASAAS_API_KEY não configurada
   API Key não disponível
   ```

---

## TESTE 3: Testar com Todos os 4 Planos

Repetir Teste 2 para cada plano:

- [ ] `starter` - R$ 197
- [ ] `basico` - R$ 397
- [ ] `profissional` - R$ 697
- [ ] `premium` - R$ 997

**Esperado para cada:**
- QR Code gerado
- Valor correto no log
- Sem erro 500

---

## CHECKLIST DE SUCESSO

- [ ] Teste 1 (API direct): `success: true` retorna
- [ ] Teste 1: QR Code e Pix Copia e Cola presentes
- [ ] Teste 1: Logs mostram novo código (não erro antigo)
- [ ] Teste 2 (Starter): Checkout carrega sem erro
- [ ] Teste 2: QR Code gerado e visível
- [ ] Teste 2: Logs em Supabase mostram criação de cliente e cobrança
- [ ] Teste 2: Sem erro 500
- [ ] Teste 3: Todos 4 planos funcionam
- [ ] Teste 3: Valores corretos em cada plano

---

## SE ALGO DER ERRADO

### Cenário: Ainda mostra erro 500
1. Checar Supabase Dashboard > Edge Functions > Logs
2. Se vir `ASAAS_API_KEY_SANDBOX...` = **código antigo ainda rodando**
   - Aguardar 2-3 minutos (cache propagando)
   - Ou clicar Deploy novamente
3. Se vir `API Key não disponível` = **novo código rodando**
   - Mas há outro erro (talvez Asaas API)
   - Checar resposta completa do erro no log

### Cenário: QR Code não aparece
1. Abrir Console (F12)
2. Procurar por erros em vermelho
3. Checar se Edge Function retornou erro
4. Verificar logs em Supabase

### Cenário: "Pagamento não encontrado" em confirm-pix-payment
1. Isso é normal se usar paymentId fake
2. Usar um paymentId real do Asaas para testar polling

---

## PRÓXIMOS PASSOS

Depois que todos os testes passarem:
1. ✅ Testar com dados REAIS (seu CPF, email, telefone)
2. ✅ Simular pagamento no Asaas Sandbox
3. ✅ Verificar se transição de usuário para members.html funciona
4. ✅ Testar em produção com Asaas API Key de produção

