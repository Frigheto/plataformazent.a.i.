#!/bin/bash

# Setup Asaas API Key Secret no Supabase

echo "🔐 CONFIGURADOR DE SECRETS - ASAAS"
echo "===================================="
echo ""

# Verificar se supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não está instalado"
    echo ""
    echo "Para instalar, use:"
    echo "  macOS (com Homebrew): brew install supabase/tap/supabase"
    echo "  Linux/WSL: curl -fsSL https://cli.supabase.io/install.sh | bash"
    echo "  Windows (via scoop): scoop install supabase"
    echo ""
    exit 1
fi

echo "✅ Supabase CLI detectado"
echo ""

# Pedir API Key
read -p "Cole sua API Key do Asaas Sandbox: " ASAAS_KEY

if [ -z "$ASAAS_KEY" ]; then
    echo "❌ API Key não pode estar vazia"
    exit 1
fi

echo ""
echo "🔄 Configurando secrets no Supabase..."

# Configurar secret
supabase secrets set ASAAS_API_KEY_SANDBOX="$ASAAS_KEY"

if [ $? -eq 0 ]; then
    echo "✅ Secret ASAAS_API_KEY_SANDBOX configurado com sucesso"
    echo ""
    echo "🚀 Fazendo deploy das Edge Functions..."

    # Deploy
    supabase functions deploy

    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ TUDO CONFIGURADO E DEPLOYADO!"
        echo ""
        echo "Próximos passos:"
        echo "  1. Abrir: https://www.zentgrowth.com/checkout.html?plan=starter"
        echo "  2. Testar compra"
        echo ""
    else
        echo "❌ Erro ao fazer deploy"
        exit 1
    fi
else
    echo "❌ Erro ao configurar secret"
    exit 1
fi
