/**
 * auth.js — ZENT A.I.
 * Utilitários de autenticação com Supabase.
 * Expõe window.zentAuth para uso em qualquer página.
 *
 * Dependência: cdn.jsdelivr.net/npm/@supabase/supabase-js@2 (carregado antes deste script)
 *
 * CONFIGURAÇÃO:
 *   Substitua os valores abaixo pelas suas credenciais do painel Supabase.
 *   Settings → API → Project URL e anon/public key.
 */
(function () {
    'use strict';

    // ----------------------------------------------------------------
    // CREDENCIAIS SUPABASE — substitua com seus valores reais
    // ----------------------------------------------------------------
    var SUPABASE_URL      = 'https://tohqjcsrgfvlotnkcmqy.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvaHFqY3NyZ2Z2bG90bmtjbXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjY0MjAsImV4cCI6MjA4NzA0MjQyMH0.VinUY79mbTCxulHb6BoXnMPq4Dz1kMYJrgjpOP6aCz4';

    // ----------------------------------------------------------------
    // Inicializa o cliente Supabase (disponível via CDN)
    // ----------------------------------------------------------------
    var supabase = window.supabase
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

    if (!supabase) {
        console.error('[auth.js] Supabase CDN não carregado. Inclua o script antes de auth.js.');
    }

    // ----------------------------------------------------------------
    // getSession — retorna sessão ativa ou null
    // ----------------------------------------------------------------
    async function getSession() {
        if (!supabase) return null;
        var result = await supabase.auth.getSession();
        return result.data && result.data.session ? result.data.session : null;
    }

    // ----------------------------------------------------------------
    // getUser — retorna usuário logado ou null
    // ----------------------------------------------------------------
    async function getUser() {
        var session = await getSession();
        return session ? session.user : null;
    }

    // ----------------------------------------------------------------
    // signUp — cadastro com e-mail e senha
    // ----------------------------------------------------------------
    async function signUp(email, password, name) {
        if (!supabase) throw new Error('Supabase não inicializado');
        var result = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: name }
            }
        });
        if (result.error) throw result.error;

        // Tenta criar registro em profiles (sem chave service role, apenas tenta)
        if (result.data && result.data.user && result.data.user.id) {
            try {
                console.log('[Auth] Tentando criar perfil para:', result.data.user.id);

                // Aguarda um pouco para o usuário ser criado no auth
                await new Promise(resolve => setTimeout(resolve, 500));

                const insertResult = await supabase
                    .from('profiles')
                    .insert({
                        id: result.data.user.id,
                        email: email,
                        full_name: name || '',
                        plan: null
                    });

                if (insertResult.error) {
                    console.warn('[Auth] Aviso ao criar perfil:', insertResult.error);
                } else {
                    console.log('[Auth] Perfil criado com sucesso');
                }
            } catch (profileError) {
                console.error('[Auth] Erro ao criar perfil:', profileError);
            }
        }

        return result.data;
    }

    // ----------------------------------------------------------------
    // signIn — login com e-mail e senha
    // ----------------------------------------------------------------
    async function signIn(email, password) {
        if (!supabase) throw new Error('Supabase não inicializado');
        var result = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        if (result.error) throw result.error;
        return result.data;
    }

    // ----------------------------------------------------------------
    // getProfile — busca perfil completo da tabela public.profiles
    // ----------------------------------------------------------------
    async function getProfile() {
        if (!supabase) return null;
        var user = await getUser();
        if (!user) return null;
        var result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        return result.data || null;
    }

    // ----------------------------------------------------------------
    // signOut — encerra sessão e redireciona para index
    // ----------------------------------------------------------------
    async function signOut() {
        if (!supabase) return;
        await supabase.auth.signOut();
        window.location.href = 'index.html';
    }

    // ----------------------------------------------------------------
    // signInWithGoogle — login/signup com Google OAuth
    // ----------------------------------------------------------------
    async function signInWithGoogle() {
        if (!supabase) throw new Error('Supabase não inicializado');
        var result = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/members.html'
            }
        });
        if (result.error) throw result.error;
    }

    // ----------------------------------------------------------------
    // requireAuth — redireciona para auth.html se não logado
    // Retorna o usuário se logado.
    // ----------------------------------------------------------------
    async function requireAuth(redirectAfterLogin) {
        var session = await getSession();
        if (!session) {
            var target = redirectAfterLogin || window.location.href;
            window.location.href = 'auth.html?redirect=' + encodeURIComponent(target);
            return null;
        }
        return session.user;
    }

    // ----------------------------------------------------------------
    // updateHeaderUI — atualiza botão "Entrar" no cabeçalho
    // Chame esta função em qualquer página que carregue auth.js.
    // ----------------------------------------------------------------
    async function updateHeaderUI() {
        var session = await getSession();
        var loginBtn = document.getElementById('header-login-btn');
        var planBtn = document.getElementById('header-plan-btn');
        var userMenuWrapper = document.getElementById('user-menu-wrapper');
        var userMenuName = document.getElementById('user-menu-name');
        if (!loginBtn) return;

        if (session && session.user) {
            var name = (session.user.user_metadata && session.user.user_metadata.full_name)
                ? session.user.user_metadata.full_name.split(' ')[0]
                : session.user.email;

            // Mostra o menu do usuário
            if (userMenuWrapper) {
                userMenuWrapper.style.display = 'block';
            }
            if (userMenuName) {
                userMenuName.textContent = name;
            }

            // Esconde o botão "Entrar"
            loginBtn.style.display = 'none';

            // Esconde o botão "Ver Planos" quando logado
            if (planBtn) {
                planBtn.style.display = 'none';
            }
        } else {
            // Esconde o menu do usuário
            if (userMenuWrapper) {
                userMenuWrapper.style.display = 'none';
            }

            // Mostra o botão "Entrar"
            loginBtn.style.display = 'flex';
            loginBtn.textContent = 'Entrar';
            loginBtn.href = 'auth.html';
            loginBtn.title = 'Fazer login ou criar conta';

            // Mostra o botão "Ver Planos" quando deslogado
            if (planBtn) {
                planBtn.style.display = 'inline-block';
            }
        }
    }

    // ----------------------------------------------------------------
    // Ouve mudanças de sessão (login/logout em outra aba, etc.)
    // ----------------------------------------------------------------
    if (supabase) {
        supabase.auth.onAuthStateChange(function (event) {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
                updateHeaderUI();
            }
        });
    }

    // ----------------------------------------------------------------
    // User Menu Dropdown — Abrir/Fechar
    // ----------------------------------------------------------------
    function setupUserMenu() {
        var userMenuBtn = document.getElementById('header-user-btn');
        var userMenuDropdown = document.getElementById('user-menu-dropdown');
        var logoutBtn = document.getElementById('header-logout-btn');

        if (!userMenuBtn || !userMenuDropdown) return;

        // Alterna o dropdown ao clicar no botão
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userMenuDropdown.classList.toggle('active');
        });

        // Fecha o dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.remove('active');
            }
        });

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                if (supabase) {
                    await supabase.auth.signOut();
                    window.location.href = 'index.html';
                }
            });
        }
    }

    // ----------------------------------------------------------------
    // Roda updateHeaderUI assim que o DOM estiver pronto
    // ----------------------------------------------------------------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateHeaderUI();
            setupUserMenu();
        });
    } else {
        updateHeaderUI();
        setupUserMenu();
    }

    // ----------------------------------------------------------------
    // Expõe o cliente Supabase para uso direto por outros scripts
    // ----------------------------------------------------------------
    window._zentSupabaseClient = supabase;

    // ----------------------------------------------------------------
    // API pública
    // ----------------------------------------------------------------
    window.zentAuth = {
        getSession:           getSession,
        getUser:              getUser,
        getProfile:           getProfile,
        signUp:               signUp,
        signIn:               signIn,
        signOut:              signOut,
        signInWithGoogle:     signInWithGoogle,
        requireAuth:          requireAuth,
        updateHeaderUI:       updateHeaderUI
    };

})();
