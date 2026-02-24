# Deploy Manual do Webhook Asaas via Supabase Console

## Resumo Rápido

Você precisa copiar a função `webhook-asaas` para o Supabase Console e fazer o deploy.

---

## Passo 1: Acesse o Supabase Console

1. Vá para: **https://app.supabase.com**
2. Faça login com sua conta
3. Selecione o projeto **zentplataformaagência** (Project ID: `tohqjcsrgfvlotnkcmqy`)

---

## Passo 2: Acesse Edge Functions

1. No menu lateral esquerdo, procure por **Edge Functions**
2. Clique em **"Create a new function"**

---

## Passo 3: Configure a Função

1. **Nome da função:** `webhook-asaas`
2. **Clique em "Create function"**

---

## Passo 4: Copie o Código

Copie **TODO** o código abaixo e cole no editor do Supabase:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Apenas POST é aceito
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const body = await req.json();

    console.log("[Webhook Asaas] Recebido:", body);

    // Asaas envia essas propriedades:
    // event: "PAYMENT_CONFIRMED", "PAYMENT_OVERDUE", "PAYMENT_DELETED", etc
    // payment.externalReference: nosso formato "plan:starter:uid:USER_ID"
    // payment.status: "CONFIRMED"

    const event = body.event;
    const payment = body.payment;

    // Só processa pagamentos confirmados
    if (event !== "PAYMENT_CONFIRMED" || payment.status !== "CONFIRMED") {
      console.log("[Webhook Asaas] Ignorando evento:", event);
      return new Response(
        JSON.stringify({ message: "Event ignored", event }),
        { status: 200 }
      );
    }

    const externalRef = payment.externalReference;
    if (!externalRef || !externalRef.includes("plan:")) {
      console.warn("[Webhook Asaas] externalReference inválido:", externalRef);
      return new Response(
        JSON.stringify({ error: "Invalid externalReference" }),
        { status: 400 }
      );
    }

    // Parse: "plan:starter:uid:8d1589f9-d94a-42bc-b8da-0185286234e"
    const parts = externalRef.split(":");
    if (parts.length < 4) {
      console.warn("[Webhook Asaas] externalReference mal formatado:", externalRef);
      return new Response(
        JSON.stringify({ error: "Invalid externalReference format" }),
        { status: 400 }
      );
    }

    const plan = parts[1]; // "starter", "basico", "profissional", "premium"
    const userId = parts.slice(3).join(":"); // UUID do usuário (pode ter ":" em alguns contextos)

    console.log(`[Webhook Asaas] Plan: ${plan}, User ID: ${userId}`);

    // Validar plano
    const validPlans = ["starter", "basico", "profissional", "premium"];
    if (!validPlans.includes(plan)) {
      console.warn("[Webhook Asaas] Plano inválido:", plan);
      return new Response(
        JSON.stringify({ error: "Invalid plan" }),
        { status: 400 }
      );
    }

    // Conectar ao Supabase com service role (pode atualizar qualquer usuário)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Atualizar plano do usuário na tabela profiles
    const { data, error } = await supabase
      .from("profiles")
      .update({
        plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select();

    if (error) {
      console.error("[Webhook Asaas] Erro ao atualizar plano:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update plan", details: error }),
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.warn("[Webhook Asaas] Usuário não encontrado:", userId);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    console.log("[Webhook Asaas] ✅ Plano atualizado com sucesso:", {
      userId,
      plan,
      payment_id: payment.id,
    });

    // Registrar audit log
    await supabase.from("audit_log").insert({
      admin_id: null,
      action: "PAYMENT_CONFIRMED_WEBHOOK",
      resource_type: "subscription",
      resource_id: userId,
      changes: {
        plan: plan,
        payment_id: payment.id,
        asaas_reference: payment.externalReference,
      },
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Plan updated",
        userId,
        plan,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook Asaas] Erro geral:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
});
```

---

## Passo 5: Deploy a Função

1. Clique no botão **"Deploy"** (canto superior direito do editor)
2. Aguarde a função ser deployada
3. Você verá uma mensagem de sucesso

---

## Passo 6: Copie a URL da Função

Após o deploy:
1. A URL da função aparecerá na página
2. Será algo como: `https://tohqjcsrgfvlotnkcmqy.supabase.co/functions/v1/webhook-asaas`
3. **Copie essa URL!** Você vai precisar dela no próximo passo

---

## Passo 7: Configure o Webhook no Asaas

1. Acesse: **https://sandbox.asaas.com/settings/notifications** (ou produção se aplicável)
2. Clique em **"Webhooks"**
3. Clique em **"Adicionar webhook"**
4. Preencha com:
   - **URL**: Cola a URL que copiou acima
   - **Eventos**: Selecione APENAS `PAYMENT_CONFIRMED`
   - **Status da notificação**: Ativar/Ativo
5. Clique em **"Salvar"**

---

## Passo 8: Teste o Webhook (Opcional)

Para testar se está funcionando:

### Opção A: Teste via Asaas Console
1. Volte em Webhooks no Asaas
2. Clique no webhook que você criou
3. Clique em **"Enviar teste"**
4. Selecione evento **"PAYMENT_CONFIRMED"**
5. Clique em **"Enviar"**

### Opção B: Teste via cURL (se tiver terminal)
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

## Passo 9: Verifique os Logs

1. Volte ao Supabase Console
2. Vá em **Edge Functions**
3. Clique em **`webhook-asaas`**
4. Clique em **"Logs"**
5. Você deve ver as chamadas do webhook (teste ou reais)

---

## Pronto! 🎉

Seu webhook agora está ativo e pronto para:
1. ✅ Receber confirmação de pagamento do Asaas
2. ✅ Atualizar automaticamente o plano do usuário
3. ✅ Registrar a transação no audit log
4. ✅ Usuário vê o plano ativo em members.html

---

## Troubleshooting

### Webhook não foi criado?
- Verifique se você copiou TODO o código acima
- Confirme que clicou em "Deploy"
- Tente novamente

### URL não aparece?
- Aguarde alguns segundos após o deploy
- Recarregue a página

### Teste não funciona?
- Confirme que a URL do webhook está correta no Asaas
- Verifique os logs (Passo 9 acima)
- Procure por erros na mensagem de log

---

**Qualquer dúvida, me avise!**
