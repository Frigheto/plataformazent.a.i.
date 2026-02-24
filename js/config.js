/**
 * config.js — Configuração centralizada (sem import.meta)
 * Funciona com scripts globais carregados via <script> tags
 */

(function () {
    'use strict';

    console.log('[Config] Inicializando...');

    // Aguarda Supabase CDN carregar
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos (50 * 100ms)

    const waitForSupabase = setInterval(() => {
        attempts++;

        if (window.supabase && typeof window.supabase.createClient === 'function') {
            clearInterval(waitForSupabase);
            initializeConfig();
            return;
        }

        if (attempts >= maxAttempts) {
            clearInterval(waitForSupabase);
            console.error('[Config] ❌ Supabase CDN não carregou em 5 segundos');
        }
    }, 100);

    function initializeConfig() {
        const SUPABASE_URL = 'https://tohqjcsrgfvlotnkcmqy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvaHFqY3NyZ2Z2bG90bmtjbXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjY0MjAsImV4cCI6MjA4NzA0MjQyMH0.VinUY79mbTCxulHb6BoXnMPq4Dz1kMYJrgjpOP6aCz4';

        try {
            // Cria cliente Supabase
            window._zentSupabaseClient = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_ANON_KEY
            );

            console.log('[Config] ✅ Supabase inicializado');
            console.log('[Config] URL:', SUPABASE_URL);

            // Expõe globalmente
            window.ZENT_CONFIG = {
                supabase: {
                    url: SUPABASE_URL,
                    anonKey: SUPABASE_ANON_KEY
                },
                getSupabaseClient: function () {
                    return window._zentSupabaseClient;
                },
                apiBase: SUPABASE_URL
            };

            console.log('[Config] ✅ ZENT_CONFIG pronto');

        } catch (error) {
            console.error('[Config] ❌ Erro:', error.message);
        }
    }

})();
