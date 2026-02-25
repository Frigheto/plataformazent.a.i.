# 🧪 COMO TESTAR A COMPRA PIX

## Resumo
Você vai **simular uma compra PIX completa** e validar que:
✅ Formulário funciona
✅ Edge Function retorna sucesso
✅ QR Code é gerado
✅ Código PIX é exibido

---

## PASSO 1: Abrir o Checkout

1. Abrir no navegador (Chrome ou Firefox):
```
https://www.zentgrowth.com/checkout.html?plan=starter
```

2. **IMPORTANTE:** Você precisa estar **logado**
   - Se não estiver, a página vai redirecionar para login
   - Faça login com sua conta

3. Verificar que a página carrega:
   - [ ] Vê "Starter — R$ 197/mês"
   - [ ] Vê o formulário vazio
   - [ ] Botão "Gerar QR Code" está visível

---

## PASSO 2: Abrir Developer Tools

Pressione: **F12** (ou Cmd+Option+I no Mac)

Você deve ver:
- Aba **Console** aberta
- Sem erros em vermelho (ainda)

---

## PASSO 3: Executar o Teste

Copie e cole NO CONSOLE:

```javascript
// Primeiro, carregue o script de teste
fetch('https://www.zentgrowth.com/TEST_PAYMENT_SIMULATION.js')
  .then(r => r.text())
  .then(code => {
    eval(code);
    console.log('✅ Script carregado. Execute: runPaymentTest()');
  });
```

Depois execute:

```javascript
runPaymentTest()
```

---

## PASSO 4: Acompanhar o Teste

Você vai ver no console uma série de ✅ mensagens:

```
🧪 INICIANDO TESTE DE PAGAMENTO PIX...

📋 STEP 1: Validando página...
✅ Formulário encontrado

📝 STEP 2: Preenchendo formulário...
  ✓ Nome: Test User QA
  ✓ CPF: 11144477735
  ✓ Email: test@zentgrowth.com
  ✓ Telefone: 11999999999

💳 STEP 3: Selecionando PIX...
✅ PIX selecionado

🚀 STEP 4: Enviando requisição de pagamento...
📤 Clicando em "Gerar QR Code"...

⏳ STEP 5: Aguardando geração do QR Code...
✅ QR Code gerado em 2345ms!

🔍 STEP 6: Validando dados do QR Code...
✅ Código PIX gerado:
   00020126360014br.gov.bcb.brcode01051.0.0...

✨ STEP 7: Validando UI de confirmação...
✅ Tela de confirmação visível

════════════════════════════════════════════
✅ TESTE PASSOU!
════════════════════════════════════════════

📊 RESULTADOS:
  ✓ Formulário preenchido corretamente
  ✓ PIX selecionado
  ✓ Edge Function retornou sucesso
  ✓ QR Code gerado
  ✓ Código PIX válido (123 caracteres)
  ✓ UI de confirmação exibida
```

---

## PASSO 5: Validar Resultado

### ✅ Se passou:
- [ ] Vi "TESTE PASSOU!"
- [ ] Vi o código PIX de 100+ caracteres
- [ ] Na página, vejo QR Code preto e branco
- [ ] Na página, vejo o código PIX para copiar

**PARABÉNS! ✨ Checkout funciona!**

### ❌ Se falhou:
Veja a mensagem de erro e checklist:

```
❌ TESTE FALHOU!

🔴 Erro: [descrição do erro]

📋 Checklist de debug:
  - [ ] Você está logado?
  - [ ] A URL tem ?plan=starter?
  - [ ] O formulário está visível?
  - [ ] As Edge Functions foram deploiadas?
  - [ ] A página não está em https://www.zentgrowth.com?
```

---

## PASSO 6: Testar Outros Planos (Opcional)

Repita o processo para cada plano:

**Starter:**
```
https://www.zentgrowth.com/checkout.html?plan=starter
```

**Básico:**
```
https://www.zentgrowth.com/checkout.html?plan=basico
```

**Profissional:**
```
https://www.zentgrowth.com/checkout.html?plan=profissional
```

**Premium:**
```
https://www.zentgrowth.com/checkout.html?plan=premium
```

Cada um deve gerar seu próprio QR Code.

---

## PASSO 7: Validar na Supabase (Opcional)

Se quiser ver os logs da Edge Function:

1. Abrir: https://app.supabase.com/project/tohqjcsrgfvlotnkcmqy
2. Ir em: **Edge Functions > Logs**
3. Procurar por `[process-payment]`
4. Deve ver:
```
[process-payment] Iniciando pagamento: userId=..., plan=starter, method=pix
[process-payment] Cliente criado: cus_XXXX
[process-payment] Cobrança criada: pay_XXXX
```

Se vir erro, avisa!

---

## ⏰ Tempo Esperado

- ⏱️ Abrir checkout: 2 segundos
- ⏱️ Executar teste: 5-10 segundos
- ⏱️ Total: ~15 segundos

---

## 🎯 Checklist Final

- [ ] Teste passou
- [ ] QR Code gerado
- [ ] Código PIX válido
- [ ] Logs em Supabase mostram sucesso
- [ ] Repetido para todos 4 planos

Se tudo passou, **checkout está PRONTO! ✅**

---

## 💬 Se tiver dúvidas

Compartilhe:
1. O erro (copie do console)
2. Screenshot do console
3. URL que estava testando

E me avisa! 🚀
