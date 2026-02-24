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

    console.log("Webhook Asaas Recebido:", body);

    const event = body.event;
    const payment = body.payment;

    if (event !== "PAYMENT_CONFIRMED" || payment.status !== "CONFIRMED") {
      console.log("Webhook Asaas Ignorando evento:", event);
      return new Response(
        JSON.stringify({ message: "Event ignored", event }),
        { status: 200 }
      );
    }

    const externalRef = payment.externalReference;
    if (!externalRef || !externalRef.includes("plan:")) {
      console.warn("Webhook Asaas externalReference invalido:", externalRef);
      return new Response(
        JSON.stringify({ error: "Invalid externalReference" }),
        { status: 400 }
      );
    }

    const parts = externalRef.split(":");
    if (parts.length < 4) {
      console.warn("Webhook Asaas externalReference malformatted:", externalRef);
      return new Response(
        JSON.stringify({ error: "Invalid externalReference format" }),
        { status: 400 }
      );
    }

    const plan = parts[1];
    const userId = parts.slice(3).join(":");

    console.log("Webhook Asaas Plan:", plan, "User ID:", userId);

    const validPlans = ["starter", "basico", "profissional", "premium"];
    if (!validPlans.includes(plan)) {
      console.warn("Webhook Asaas Plan invalido:", plan);
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
      console.error("Webhook Asaas Erro ao atualizar plano:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update plan", details: error }),
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.warn("Webhook Asaas Usuario nao encontrado:", userId);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    console.log("Webhook Asaas Plano atualizado com sucesso:", {
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
    console.error("Webhook Asaas Erro geral:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
});
