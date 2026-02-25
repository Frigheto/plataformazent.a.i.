import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    console.log('[asaas-webhook] Recebendo webhook do Asaas')

    const payload = await req.json()
    console.log('[asaas-webhook] Evento:', payload.event)

    // Validar estrutura do webhook
    if (!payload.event || !payload.payment) {
      console.error('[asaas-webhook] Webhook inválido')
      return new Response(JSON.stringify({ error: 'Invalid webhook structure' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const event = payload.event
    const payment = payload.payment

    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    })

    // Processar eventos de pagamento
    if (payment.status === 'RECEIVED') {
      await handlePaymentConfirmed(payment, supabase)
    } else if (payment.status === 'FAILED') {
      await handlePaymentFailed(payment, supabase)
    } else if (payment.status === 'OVERDUE') {
      await handlePaymentOverdue(payment, supabase)
    }

    // Log do webhook
    await supabase.from('webhook_logs').insert({
      webhook_type: 'asaas_payment',
      payload: payload,
      status: 'PROCESSED'
    }).catch(err => console.error('[webhook] Erro ao registrar log:', err))

    console.log('[asaas-webhook] ✅ Processado com sucesso')

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[asaas-webhook] ❌ Erro:', error)

    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

async function handlePaymentConfirmed(payment: any, supabase: any) {
  console.log('[webhook] Atualizando pagamento confirmado')

  try {
    // Buscar pagamento no banco
    const { data: localPayment } = await supabase
      .from('payments')
      .select('id, user_id, plan')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (!localPayment) {
      console.log('[webhook] Pagamento não encontrado:', payment.id)
      return
    }

    // Atualizar status
    await supabase
      .from('payments')
      .update({
        status: 'CONFIRMED',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', localPayment.id)

    // Atualizar plano
    await supabase
      .from('profiles')
      .update({
        plan: localPayment.plan,
        plan_activated_at: new Date().toISOString()
      })
      .eq('id', localPayment.user_id)

    console.log('[webhook] ✅ Plano atualizado para:', localPayment.plan)

  } catch (error) {
    console.error('[webhook] Erro:', error)
  }
}

async function handlePaymentFailed(payment: any, supabase: any) {
  console.log('[webhook] Pagamento falhou')

  try {
    const { data: localPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (localPayment) {
      await supabase
        .from('payments')
        .update({ status: 'FAILED' })
        .eq('id', localPayment.id)
    }
  } catch (error) {
    console.error('[webhook] Erro:', error)
  }
}

async function handlePaymentOverdue(payment: any, supabase: any) {
  console.log('[webhook] Pagamento vencido')

  try {
    const { data: localPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('asaas_payment_id', payment.id)
      .single()

    if (localPayment) {
      await supabase
        .from('payments')
        .update({ status: 'OVERDUE' })
        .eq('id', localPayment.id)
    }
  } catch (error) {
    console.error('[webhook] Erro:', error)
  }
}
