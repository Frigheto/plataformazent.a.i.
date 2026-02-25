/**
 * confirm-pix-payment — Edge Function
 * Verifica status do pagamento PIX via API Asaas
 *
 * GET /functions/v1/confirm-pix-payment?paymentId=pay_123456
 *
 * Response:
 * {
 *   "success": true,
 *   "paymentId": "pay_123456",
 *   "status": "CONFIRMED",
 *   "confirmedAt": "2026-02-25T10:30:00Z"
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  // CORS
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
    // Log para debug
    console.log('[confirm-pix-payment] Requisição recebida');
    console.log('[confirm-pix-payment] Headers:', Object.fromEntries(req.headers.entries()));

    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');
    const userId = url.searchParams.get('userId');

    console.log(
      `[confirm-pix-payment] Verificando status: paymentId=${paymentId}, userId=${userId}`
    );

    if (!paymentId) {
      return errorResponse('paymentId obrigatório', 400);
    }

    // Obter Asaas API Key (Sandbox ou Produção)
    // ⚠️ NOTA: API Key hardcoded para TESTE. Em produção, usar Secrets!
    const asaasApiKey = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmQ0ZTY5ZDc3LWI3MWQtNDQ1YS05NjMxLTZjMzk4N2U2ZmJkOTo6JGFhY2hfMDQ3OTQ2YjMtYjI1MS00MjYwLThlMDktYWZkNTA4NmRiOWVi';

    if (!asaasApiKey) {
      console.error('[confirm-pix-payment] Asaas API Key não disponível');
      return errorResponse('Configuração interna inválida', 500);
    }

    // --- Verificar status do pagamento no Asaas ---
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
      console.error(
        `[confirm-pix-payment] Erro ao verificar status: ${error}`
      );
      return errorResponse('Pagamento não encontrado', 404);
    }

    const paymentData = (await statusRes.json()) as {
      id: string;
      status: string;
      confirmedDate?: string;
      externalReference?: string;
    };

    const status = String(paymentData.status).toUpperCase();
    console.log(
      `[confirm-pix-payment] Status atual: ${status} (paymentId: ${paymentId})`
    );

    // Se CONFIRMED, atualizar Supabase
    if (status === 'CONFIRMED') {
      // Extrair userId do externalReference se não foi passado como param
      let targetUserId = userId;
      if (!targetUserId && paymentData.externalReference) {
        const match = paymentData.externalReference.match(
          /uid:([0-9a-f\-]+)/i
        );
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

        // Atualizar status do pagamento em Supabase
        const { error: updateError } = await supabase
          .from('payments')
          .update({
            status: 'CONFIRMED',
            confirmed_at: new Date().toISOString(),
          })
          .eq('asaas_payment_id', paymentId);

        if (updateError) {
          console.error(
            `[confirm-pix-payment] Erro ao atualizar Supabase: ${updateError.message}`
          );
        } else {
          console.log(
            `[confirm-pix-payment] Transação confirmada: ${paymentId}`
          );

          // Extrair plano do externalReference
          let plan = 'starter';
          if (paymentData.externalReference) {
            const planMatch = paymentData.externalReference.match(
              /plan:([a-z]+)/i
            );
            if (planMatch) {
              plan = planMatch[1].toLowerCase();
            }
          }

          // Atualizar plano do usuário em profiles
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              plan: plan,
              updated_at: new Date().toISOString(),
            })
            .eq('id', targetUserId);

          if (profileError) {
            console.error(
              `[confirm-pix-payment] Erro ao atualizar perfil: ${profileError.message}`
            );
          } else {
            console.log(
              `[confirm-pix-payment] Plano "${plan}" ativado para: ${targetUserId}`
            );

            // Audit log
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
