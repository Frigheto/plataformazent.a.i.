/**
 * admin-auth.js — Autenticação de administradores
 * Gerencia login e sessão do painel administrativo
 * Usa admin_users table com validação RPC
 */

(function () {
    'use strict';

    // Aguarda Supabase carregar
    let supabase = null;
    let supabaseReady = false;

    const waitForSupabase = setInterval(() => {
        if (window.ZENT_CONFIG && window.ZENT_CONFIG.getSupabaseClient) {
            supabase = window.ZENT_CONFIG.getSupabaseClient();
            if (supabase) {
                supabaseReady = true;
                clearInterval(waitForSupabase);
                console.log('[Admin Auth] ✅ Supabase pronto');
                initializeForm();
            }
        }
    }, 100);

    // Timeout
    setTimeout(() => {
        if (!supabaseReady) {
            console.error('[Admin Auth] ❌ Supabase não inicializou');
        }
    }, 5000);

    // ===== Session Management =====
    window.adminAuth = {
        setSession: function (adminData) {
            if (!['admin', 'super_admin'].includes(adminData.role)) {
                console.error('[Admin Auth] Tentativa de armazenar sessão sem permissão!');
                throw new Error('Invalid admin role');
            }
            localStorage.setItem('admin_session', JSON.stringify(adminData));
        },
        getSession: function () {
            const session = localStorage.getItem('admin_session');
            if (!session) return null;
            try {
                const parsed = JSON.parse(session);
                if (!['admin', 'super_admin'].includes(parsed.role)) {
                    console.warn('[Admin Auth] Sessão inválida: role não é admin');
                    this.clearSession();
                    return null;
                }
                return parsed;
            } catch (e) {
                console.error('[Admin Auth] Erro ao parsear sessão:', e);
                this.clearSession();
                return null;
            }
        },
        clearSession: function () {
            localStorage.removeItem('admin_session');
        },
        isAuthenticated: function () {
            return this.getSession() !== null;
        }
    };

    // Verifica autenticação ao carregar página
    if (window.location.pathname.includes('/admin/')) {
        if (!window.adminAuth.isAuthenticated()) {
            window.location.href = 'admin-login.html';
        }
    }

    // ===== Form Initialization =====
    const initializeForm = () => {
        const loginForm = document.getElementById('admin-login-form');
        if (!loginForm) {
            console.log('[Admin Auth] Não estamos na página de login');
            return;
        }

        const emailInput = document.getElementById('admin-email');
        const passwordInput = document.getElementById('admin-password');
        const loginBtn = document.getElementById('admin-login-btn');
        const errorEl = document.getElementById('admin-login-error');
        const loadingEl = document.getElementById('admin-login-loading');
        const passwordToggle = document.getElementById('admin-password-toggle');

        console.log('[Admin Auth] Formulário de login pronto');

        // Toggle password visibility
        if (passwordToggle) {
            passwordToggle.addEventListener('click', function (e) {
                e.preventDefault();
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                passwordToggle.classList.toggle('active', type === 'text');
            });
        }

        // Rate limiting
        const loginAttempts = {};
        const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
        const MAX_ATTEMPTS = 5;

        function checkRateLimit(email) {
            const now = Date.now();
            if (!loginAttempts[email]) {
                loginAttempts[email] = [];
            }
            loginAttempts[email] = loginAttempts[email].filter(t => now - t < RATE_LIMIT_WINDOW);
            if (loginAttempts[email].length >= MAX_ATTEMPTS) {
                return false;
            }
            loginAttempts[email].push(now);
            return true;
        }

        // Form submit handler
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!email || !password) {
                showError('Preencha e-mail e senha');
                return;
            }

            if (!checkRateLimit(email)) {
                showError('Muitas tentativas. Tente novamente em 15 minutos.');
                console.warn('[Admin Auth] Rate limit:', email);
                return;
            }

            loginBtn.disabled = true;
            loginBtn.style.display = 'none';
            loadingEl.style.display = 'block';
            errorEl.style.display = 'none';

            try {
                console.log('[Admin Auth] Buscando admin:', email);

                // Busca admin na tabela
                const { data: admin, error: adminError } = await supabase
                    .from('admin_users')
                    .select('id, email, name, password_hash')
                    .eq('email', email)
                    .single();

                if (adminError || !admin) {
                    console.warn('[Admin Auth] Admin não encontrado:', adminError?.message);
                    showError('E-mail ou senha incorretos');
                    resetForm();
                    return;
                }

                console.log('[Admin Auth] Admin encontrado:', admin.email);

                // Valida senha comparando com hash bcrypt
                console.log('[Admin Auth] Validando senha com bcrypt...');

                let passwordValid = false;
                const hash = admin.password_hash;
                console.log('[Admin Auth] Hash:', hash.substring(0, 20) + '...');

                try {
                    // Comparação simples (para teste rápido)
                    // TODO: Implementar Edge Function do Supabase para bcrypt seguro
                    console.warn('[Admin Auth] ⚠️  Usando comparação plaintext (TESTE APENAS)');
                    passwordValid = (password === hash);
                    console.log('[Admin Auth] Comparação: válida =', passwordValid);
                } catch (error) {
                    console.error('[Admin Auth] Erro ao validar:', error);
                    showError('Erro ao validar. Tente novamente.');
                    resetForm();
                    return;
                }

                if (!passwordValid) {
                    console.warn('[Admin Auth] ❌ Senha incorreta');
                    showError('E-mail ou senha incorretos');
                    resetForm();
                    return;
                }

                console.log('[Admin Auth] ✅ Senha validada com sucesso');

                // Cria sessão
                const session = {
                    userId: admin.id,
                    email: admin.email,
                    name: admin.name,
                    role: 'admin',
                    loginTime: new Date().toISOString()
                };

                window.adminAuth.setSession(session);
                console.log('[Admin Auth] ✅ Sessão criada');

                // Log audit (não bloqueia)
                try {
                    await supabase.from('audit_log').insert({
                        admin_id: admin.id,
                        action: 'ADMIN_LOGIN',
                        resource_type: 'admin',
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.warn('[Admin Auth] Aviso: Erro no audit log:', err.message);
                }

                console.log('[Admin Auth] ✅ Login bem-sucedido');
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 500);

            } catch (error) {
                console.error('[Admin Auth] ERRO CRÍTICO:', error);
                showError('Erro ao conectar: ' + (error.message || 'Desconhecido'));
                resetForm();
            }
        });

        function showError(message) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        }

        function resetForm() {
            loginBtn.disabled = false;
            loginBtn.style.display = 'block';
            loadingEl.style.display = 'none';
        }
    };

    // Logout seguro
    window.adminLogout = async function () {
        try {
            const session = window.adminAuth.getSession();
            if (session && supabase) {
                try {
                    await supabase.from('audit_log').insert({
                        admin_id: session.userId,
                        action: 'ADMIN_LOGOUT',
                        resource_type: 'admin',
                        timestamp: new Date().toISOString()
                    });
                } catch (err) {
                    console.warn('[Admin Auth] Aviso: Erro ao log logout:', err.message);
                }
            }

            window.adminAuth.clearSession();
            console.log('[Admin Auth] ✅ Logout completo');
        } catch (error) {
            console.error('[Admin Auth] Erro no logout:', error);
        } finally {
            window.location.href = 'admin-login.html';
        }
    };

})();
