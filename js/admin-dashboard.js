/**
 * admin-dashboard.js — Lógica do dashboard administrativo (REFATORADO)
 * Carrega métricas e estatísticas
 * CREDENCIAIS: Carregadas de window.ZENT_CONFIG (definido em config.js)
 */

(function () {
    'use strict';

    // Aguarda Supabase carregar
    let supabase = null;
    let supabaseReady = false;

    const waitForSupabase = setInterval(async () => {
        if (window.ZENT_CONFIG && window.ZENT_CONFIG.getSupabaseClient) {
            supabase = window.ZENT_CONFIG.getSupabaseClient();
            if (supabase) {
                supabaseReady = true;
                clearInterval(waitForSupabase);
                console.log('[Admin Dashboard] ✅ Supabase pronto');

                // Inicializa dashboard quando Supabase está pronto
                // Se DOM ainda não carregou, será chamado no DOMContentLoaded
                // Se DOM já carregou, chama direto
                if (document.readyState === 'loading') {
                    console.log('[Admin Dashboard] DOM ainda carregando...');
                } else {
                    console.log('[Admin Dashboard] DOM já carregado, inicializando...');
                    await initializeDashboard();
                }
            }
        }
    }, 100);

    // Timeout
    setTimeout(() => {
        if (!supabaseReady) {
            console.error('[Admin Dashboard] ❌ Supabase não inicializou em 5s');
            document.body.innerHTML = '<div style="padding: 20px; color: red;">Erro: Supabase não carregou. Recarregue a página.</div>';
        }
    }, 5000);

    const PLAN_PRICES = {
        'starter': 197,
        'basico': 397,
        'profissional': 697,
        'premium': 997
    };

    // Inicializar dashboard quando Supabase estiver pronto
    const initializeDashboard = async () => {
        console.log('[Admin Dashboard] Inicializando dashboard...');

        // Aguarda admin-auth.js estar pronto
        let retries = 0;
        while (!window.adminAuth && retries < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
            retries++;
        }

        // Verifica autenticação
        if (!window.adminAuth || !window.adminAuth.isAuthenticated()) {
            console.log('[Admin Dashboard] Não autenticado, redirecionando para login');
            window.location.href = '../admin-login.html';
            return;
        }

        // Mostra nome do admin
        const adminSession = window.adminAuth.getSession();
        if (document.getElementById('admin-user-name')) {
            document.getElementById('admin-user-name').textContent = adminSession.name || 'Admin';
        }

        // Carrega dados do dashboard
        await loadDashboardData();
    };

    // Chamar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async function () {
            console.log('[Admin Dashboard] DOMContentLoaded disparado');

            // Se Supabase já está pronto, inicializa logo
            if (supabaseReady) {
                console.log('[Admin Dashboard] Supabase já pronto, inicializando...');
                await initializeDashboard();
            }
        });
    } else {
        // Se DOM já está pronto (rare case)
        console.log('[Admin Dashboard] DOM já carregado na inicialização');
        if (supabaseReady) {
            initializeDashboard();
        }
    }

    async function loadDashboardData() {
        try {
            console.log('[Admin Dashboard] Iniciando carregamento de dados...');

            // Busca todos os perfis de usuários
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('user_id, plan');

            if (error) {
                console.error('[Admin Dashboard] Erro na query profiles:', error);
                console.error('[Admin Dashboard] Status:', error.status);
                console.error('[Admin Dashboard] Code:', error.code);
                console.error('[Admin Dashboard] Message:', error.message);
                throw error;
            }

            if (!profiles) {
                console.warn('[Admin Dashboard] Nenhum perfil retornado (profiles é null)');
                profiles = [];
            }

            console.log('[Admin Dashboard] Perfis carregados:', profiles.length);

            // Calcula métricas
            const metrics = {
                totalUsers: profiles.length,
                byPlan: {
                    starter: 0,
                    basico: 0,
                    profissional: 0,
                    premium: 0,
                    noPlan: 0
                }
            };

            profiles.forEach(profile => {
                // Normaliza plano para minúsculo (Premium → premium)
                const plan = (profile.plan || '').toLowerCase().trim();
                if (!plan || plan === '') {
                    metrics.byPlan.noPlan++;
                } else {
                    metrics.byPlan[plan]++;
                }
            });

            // Calcula receita
            const revenue =
                (metrics.byPlan.starter * PLAN_PRICES['starter']) +
                (metrics.byPlan.basico * PLAN_PRICES['basico']) +
                (metrics.byPlan.profissional * PLAN_PRICES['profissional']) +
                (metrics.byPlan.premium * PLAN_PRICES['premium']);

            const activeSubs = Object.values(metrics.byPlan).reduce((a, b) => a + b, 0) - metrics.byPlan.noPlan;

            // Renderiza métricas
            document.getElementById('metric-total-users').textContent = metrics.totalUsers;
            document.getElementById('metric-active-subs').textContent = activeSubs;
            document.getElementById('metric-no-plan').textContent = metrics.byPlan.noPlan;
            document.getElementById('metric-revenue').textContent = 'R$ ' + revenue.toLocaleString('pt-BR');

            // Renderiza breakdown por plano
            const totalWithPlan = activeSubs || 1; // Evita divisão por 0
            const plans = ['starter', 'basico', 'profissional', 'premium'];

            plans.forEach(plan => {
                const count = metrics.byPlan[plan];
                const percentage = (count / totalWithPlan) * 100 || 0;

                document.getElementById(`plan-${plan}-count`).textContent = count;
                document.getElementById(`plan-${plan}-fill`).style.width = percentage + '%';
            });

            console.log('[Admin Dashboard] Dashboard carregado com sucesso');

        } catch (error) {
            console.error('[Admin Dashboard] ERRO CRÍTICO:', error);
            console.error('[Admin Dashboard] Stack:', error.stack);

            // Mostra mensagem de erro na página
            document.getElementById('metric-total-users').textContent = 'ERRO';
            document.getElementById('metric-active-subs').textContent = 'ERRO';
            document.getElementById('metric-no-plan').textContent = 'ERRO';
            document.getElementById('metric-revenue').textContent = 'ERRO';

            alert('❌ Erro ao carregar dashboard:\n\n' + (error.message || 'Erro desconhecido') + '\n\nAbra o console (F12) para mais detalhes.');
        }
    }
})();
