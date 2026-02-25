/**
 * confirm-pix-payment — Edge Function
 * Verifica status do pagamento PIX via API Asaas
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');
    const userId = url.searchParams.get('userId');

    console.log(`[confirm-pix-payment] Verificando: paymentId=${paymentId}`);

    if (!paymentId) {
      return errorResponse('paymentId obrigatório', 400);
    }

    // Obter Asaas API Key das Secrets do Supabase
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY_SANDBOX');

    if (!asaasApiKey) {
      console.error('[confirm-pix-payment] API Key não disponível');
      return errorResponse('Configuração interna inválida', 500);
    }

    const statusRes = await fetch(
      `https://api.asaas.com/v3/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'access-token': asaasApiKey,
        },
      }
    );

    if (!statusRes.ok) {
      const error = await statusRes.text();
      console.error(`[confirm-pix-payment] Erro Asaas: ${error}`);
      return errorResponse('Pagamento não encontrado', 404);
    }

    const paymentData = (await statusRes.json()) as {
      id: string;
      status: string;
      confirmedDate?: string;
      externalReference?: string;
    };

    const status = String(paymentData.status).toUpperCase();
    console.log(`[confirm-pix-payment] Status: ${status}`);

    if (status === 'CONFIRMED') {
      let targetUserId = userId;
      if (!targetUserId && paymentData.externalReference) {
        const match = paymentData.externalReference.match(/uid:([0-9a-f\-]+)/i);
        if (match) {
          targetUserId = match[1];
        }
      }

      if (targetUserId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
          { auth: { persistSession: false } }
        );

        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'CONFIRMED',
            confirmed_at: new Date().toISOString(),
          })
          .eq('asaas_payment_id', paymentId);

        if (updateError) {
          console.error(`[confirm-pix-payment] Erro BD: ${updateError.message}`);
        } else {
          console.log(`[confirm-pix-payment] Confirmada: ${paymentId}`);

          let plan = 'starter';
          if (paymentData.externalReference) {
            const planMatch = paymentData.externalReference.match(/plan:([a-z]+)/i);
            if (planMatch) {
              plan = planMatch[1].toLowerCase();
            }
          }

          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              plan: plan,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);

          if (!profileError) {
            console.log(`[confirm-pix-payment] Plano "${plan}" ativado`);

            await supabase.from('audit_log').insert({
              admin_id: null,
              action: 'PAYMENT_CONFIRMED_PIX',
              resource_type: 'subscription',
              resource_id: targetUserId,
              changes: {
                plan: plan,
                payment_id: paymentId,
                payment_method: 'pix',
              },
            });
          }
        }
      }
    }

    const response = {
      success: true,
      paymentId: paymentId,
      status: status,
      confirmedAt: paymentData.confirmedDate || null,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[confirm-pix-payment] Erro:', error);
    return errorResponse('Erro interno', 500);
  }
});

function errorResponse(message: string, status: number) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status: status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
