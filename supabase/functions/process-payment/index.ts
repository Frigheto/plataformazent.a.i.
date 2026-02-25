/**
 * process-payment — Edge Function
 * Processa pagamento via API Asaas (PIX ou Cartão de Crédito)
 *
 * POST /functions/v1/process-payment
 *
 * Body:
 * {
 *   "userId": "uuid",
 *   "plan": "starter|basico|profissional|premium",
 *   "cpf": "11144477735",
 *   "email": "user@example.com",
 *   "phone": "11999999999",
 *   "name": "João Silva",
 *   "method": "pix|card",
 *   "cardData": { "number", "holder", "expiry", "cvv" } // Se method=card
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "paymentId": "pay_123456",
 *   "status": "PENDING",
 *   "method": "pix",
 *   "qrCode": "00020126360014...",
 *   "pixCopiaECola": "00020126...",
 *   "expiresAt": "2026-02-26T14:30:00Z"
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Mapeamento de planos para valores Asaas
const PLAN_VALUES: Record<string, number> = {
  starter: 197,
  basico: 397,
  profissional: 697,
  premium: 997,
};

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter — R$ 197/mês',
  basico: 'Básico — R$ 397/mês',
  profissional: 'Profissional — R$ 697/mês',
  premium: 'Premium — R$ 997/mês',
};

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Log para debug
    console.log('[process-payment] Requisição recebida');
    console.log('[process-payment] Headers:', Object.fromEntries(req.headers.entries()));

    const body = await req.json() as Record<string, unknown>;

    // Validações
    const userId = String(body.userId || '');
    const plan = String(body.plan || '').toLowerCase();
    const cpf = String(body.cpf || '').replace(/\D/g, '');
    const email = String(body.email || '');
    const phone = String(body.phone || '').replace(/\D/g, '');
    const name = String(body.name || '');

    console.log('[process-payment] Body:', { userId, plan, cpf, email, phone, name });
    const method = String(body.method || '').toLowerCase();

    console.log(
      `[process-payment] Iniciando pagamento: userId=${userId}, plan=${plan}, method=${method}`
    );

    // Validar entrada
    if (!userId || !plan || !cpf || !email || !phone || !name || !method) {
      return errorResponse('Campos obrigatórios faltando', 400);
    }

    if (!PLAN_VALUES[plan]) {
      return errorResponse(`Plano inválido: ${plan}`, 400);
    }

    if (method !== 'pix' && method !== 'card') {
      return errorResponse(`Método inválido: ${method}`, 400);
    }

    const amount = PLAN_VALUES[plan];

    // Conectar Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Obter Asaas API Key (Sandbox ou Produção)
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY_SANDBOX') || Deno.env.get('ASAAS_API_KEY');
    if (!asaasApiKey) {
      console.error('[process-payment] ASAAS_API_KEY_SANDBOX ou ASAAS_API_KEY não configurada');
      return errorResponse('Configuração interna inválida', 500);
    }

    // --- STEP 1: Buscar ou criar cliente no Asaas ---
    let customerId: string | null = null;

    // Procurar cliente por CPF
    const searchCustomersUrl = new URL('https://api.asaas.com/v3/customers');
    searchCustomersUrl.searchParams.set('cpfCnpj', cpf);

    const searchRes = await fetch(searchCustomersUrl.toString(), {
      method: 'GET',
      headers: {
        'access-token': asaasApiKey,
      },
    });

    if (searchRes.ok) {
      const searchData = (await searchRes.json()) as {
        data?: Array<{ id: string }>;
      };
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
        console.log(`[process-payment] Cliente existente: ${customerId}`);
      }
    }

    // Se não encontrou, criar novo cliente
    if (!customerId) {
      const createCustomerRes = await fetch(
        'https://api.asaas.com/v3/customers',
        {
          method: 'POST',
          headers: {
            'access-token': asaasApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: name,
            cpfCnpj: cpf,
            email: email,
            phone: phone,
            notificationPhones: [phone],
          }),
        }
      );

      if (!createCustomerRes.ok) {
        const error = await createCustomerRes.text();
        console.error(`[process-payment] Erro ao criar cliente: ${error}`);
        return errorResponse('Erro ao criar cliente no Asaas', 500);
      }

      const customerData = (await createCustomerRes.json()) as {
        id: string;
      };
      customerId = customerData.id;
      console.log(`[process-payment] Cliente criado: ${customerId}`);
    }

    // --- STEP 2: Criar cobrança no Asaas ---
    const externalReference = `plan:${plan}:uid:${userId}`;

    const paymentPayload: Record<string, unknown> = {
      customer: customerId,
      billingType: method.toUpperCase() === 'PIX' ? 'PIX' : 'CREDIT_CARD',
      value: amount,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // Vence em 24h
      description: PLAN_LABELS[plan],
      externalReference: externalReference,
      notificationEnabled: true,
    };

    const createPaymentRes = await fetch('https://api.asaas.com/v3/payments', {
      method: 'POST',
      headers: {
        'access-token': asaasApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });

    if (!createPaymentRes.ok) {
      const error = await createPaymentRes.text();
      console.error(`[process-payment] Erro ao criar cobrança: ${error}`);
      return errorResponse('Erro ao criar pagamento', 500);
    }

    const paymentData = (await createPaymentRes.json()) as {
      id: string;
      status: string;
      pixQrCode?: string;
      pixCopiaECola?: string;
    };

    const paymentId = paymentData.id;
    console.log(
      `[process-payment] Cobrança criada: ${paymentId}, status: ${paymentData.status}`
    );

    // --- STEP 3: Armazenar transação no Supabase ---
    const { error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        asaas_payment_id: paymentId,
        plan: plan,
        amount: amount,
        method: method,
        status: 'PENDING',
        qr_code_id: paymentData.pixQrCode || null,
        pix_key: paymentData.pixCopiaECola || null,
      });

    if (insertError) {
      console.error(
        `[process-payment] Erro ao inserir transação: ${insertError.message}`
      );
      // Não falha, continua mesmo com erro de BD
    }

    // --- STEP 4: Retornar resposta ---
    const response: Record<string, unknown> = {
      success: true,
      paymentId: paymentId,
      status: paymentData.status,
      method: method,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    if (method === 'pix') {
      response.qrCode = paymentData.pixQrCode;
      response.pixCopiaECola = paymentData.pixCopiaECola;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[process-payment] Erro:', error);
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
