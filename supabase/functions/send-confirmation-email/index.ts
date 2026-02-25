import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  to: string
  planName: string
  amount: number
  planFeatures?: string[]
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const payload: EmailRequest = await req.json()
    console.log('[email] Enviando para:', payload.to)

    if (!payload.to || !payload.planName || !payload.amount) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 })
    }

    const emailHtml = generateEmailHTML(payload)

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'noreply@zent.ai',
        to: payload.to,
        subject: `✅ Pagamento Confirmado - Plano ${payload.planName}`,
        html: emailHtml
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('[email] Erro:', result)
      return new Response(JSON.stringify({ error: 'Failed to send' }), { status: 500 })
    }

    console.log('[email] ✅ Enviado:', result.id)
    return new Response(JSON.stringify({ success: true }), { status: 200 })

  } catch (error) {
    console.error('[email] ❌ Erro:', error)
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 })
  }
})

function generateEmailHTML(data: EmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; }
          .content { padding: 30px 20px; }
          .plan { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
            <p>Sua assinatura foi ativada</p>
          </div>
          <div class="content">
            <h2>Bem-vindo ao Plano ${data.planName}</h2>
            <p>Seu pagamento foi confirmado com sucesso!</p>
            <div class="plan">
              <h3>${data.planName}</h3>
              <p><strong>Valor:</strong> R$ ${(data.amount / 100).toFixed(2)}/mês</p>
            </div>
            <a href="https://zent.ai/members.html" class="button">Acessar Minha Conta</a>
            <p>Obrigado por escolher o ZENT A.I.!</p>
          </div>
        </div>
      </body>
    </html>
  `
}
