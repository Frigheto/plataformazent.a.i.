/**
 * members-page.js — ZENT A.I.
 * Lógica da área de membros: auth guard, perfil do usuário, conta, senha.
 * Depende de js/auth.js (window.zentAuth).
 *
 * CORREÇÃO: switchTab e applyPlanGating não conflitam mais.
 *   - switchTab gerencia APENAS as seções de conteúdo [data-page] (nunca toca no #m-no-plan)
 *   - applyPlanGating gerencia EXCLUSIVAMENTE o upsell (#m-no-plan) e visibilidade de .m-plan-content
 *   - applyPlanGating é chamada após cada switchTab para garantir consistência
 */
(function () {
    'use strict';

    var PLAN_LABELS = {
        'starter': 'Plano Starter',
        'basico': 'Plano Básico',
        'profissional': 'Plano Profissional',
        'premium': 'Plano Premium'
    };

    var PLAN_LEVEL = {
        'starter': 1,
        'basico': 2,
        'profissional': 3,
        'premium': 4
    };

    var PLAN_DISPLAY = {
        'starter': 'Starter',
        'basico': 'Básico',
        'profissional': 'Profissional',
        'premium': 'Premium'
    };

    // Plano atual do usuário — preenchido após carregar o perfil
    var _currentUserPlan = null;

    // ----------------------------------------------------------------
    // Plan gating: mostra/oculta conteúdo conforme o plano do usuário
    // Gerencia EXCLUSIVAMENTE o #m-no-plan (upsell) e .m-plan-content.
    // NÃO toca em elementos [data-page] — isso é responsabilidade de switchTab.
    // ----------------------------------------------------------------
    function applyPlanGating(plan) {
        // Se chamado sem argumento, usa o plano já armazenado
        if (plan !== undefined) _currentUserPlan = plan;

        var userLevel = PLAN_LEVEL[_currentUserPlan] || 0;
        var noPlanEl = document.getElementById('m-no-plan');
        var planContents = document.querySelectorAll('.m-plan-content');
        var mainEl = document.querySelector('.m-main');

        // Define atributo de plano atual no .m-main para CSS (bloqueio de seções)
        if (mainEl) mainEl.setAttribute('data-current-plan', _currentUserPlan || 'none');

        if (userLevel === 0) {
            // Sem plano: exibe tela de upsell, oculta todo o conteúdo de plano
            if (noPlanEl) noPlanEl.style.display = 'block';
            planContents.forEach(function (el) { el.style.display = 'none'; });
            return;
        }

        // Com plano: oculta upsell, exibe conteúdo de plano
        if (noPlanEl) noPlanEl.style.display = 'none';
        planContents.forEach(function (el) { el.style.display = ''; });

        // Aplica plan gating nas SEÇÕES DE FERRAMENTAS
        document.querySelectorAll('.m-tool-section[data-min-plan]').forEach(function (section) {
            var minPlan = section.getAttribute('data-min-plan');
            var minLevel = PLAN_LEVEL[minPlan] || 0;

            if (userLevel < minLevel) {
                section.classList.add('m-tool-locked');
            } else {
                section.classList.remove('m-tool-locked');
            }
        });

        // Bloqueia vídeos fora do nível do usuário
        document.querySelectorAll('.m-video-card[data-min-plan]').forEach(function (card) {
            var minPlan = card.getAttribute('data-min-plan');
            var minLevel = PLAN_LEVEL[minPlan] || 0;

            if (userLevel < minLevel) {
                card.classList.add('m-video-locked');
                // Insere badge de bloqueio se ainda não existir
                if (!card.querySelector('.m-video-lock-msg')) {
                    var thumb = card.querySelector('.m-video-thumb');
                    if (thumb) {
                        var overlay = document.createElement('div');
                        overlay.className = 'm-video-lock-overlay';
                        overlay.innerHTML =
                            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
                        thumb.appendChild(overlay);
                    }
                    var info = card.querySelector('.m-video-info');
                    if (info) {
                        var msg = document.createElement('p');
                        msg.className = 'm-video-lock-msg';
                        msg.textContent = 'Disponível no Plano ' + (PLAN_DISPLAY[minPlan] || minPlan);
                        info.appendChild(msg);
                    }
                }
            }
        });
    }

    // ----------------------------------------------------------------
    // Header: scroll effect
    // ----------------------------------------------------------------
    var header = document.getElementById('m-header');
    if (header) {
        window.addEventListener('scroll', function () {
            header.classList.toggle('scrolled', window.scrollY > 20);
        });
    }

    // ----------------------------------------------------------------
    // Tab switching — sub-páginas
    // IMPORTANTE: só gerencia seções [data-page] que NÃO sejam o upsell (#m-no-plan).
    // O upsell é controlado exclusivamente por applyPlanGating.
    // ----------------------------------------------------------------
    function switchTab(tab) {
        var navLinks = document.querySelectorAll('.m-nav-link[data-tab]');

        // Atualiza estado ativo dos links de nav
        navLinks.forEach(function (link) {
            link.classList.toggle('active', link.dataset.tab === tab);
        });

        // Mostra/oculta seções conforme data-page
        // EXCETO o #m-no-plan, que é gerenciado por applyPlanGating
        document.querySelectorAll('[data-page]').forEach(function (section) {
            // Pula o elemento de upsell — ele tem sua própria lógica
            if (section.id === 'm-no-plan') return;

            var pages = section.getAttribute('data-page').split(' ');
            var visible = pages.indexOf(tab) !== -1;
            section.style.display = visible ? '' : 'none';
        });

        // Marca a aba ativa no <main> para regras CSS
        var main = document.querySelector('.m-main');
        if (main) main.setAttribute('data-active-tab', tab);

        // Re-aplica o gating de plano após a troca de aba
        // para garantir que o upsell e .m-plan-content estejam corretos
        applyPlanGating();

        // Volta ao topo suavemente
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Inicializa tab a partir do hash da URL ou padrão "inicio"
    function initTabs() {
        var hash = (window.location.hash || '').replace('#', '');
        var tabMap = { inicio: 'inicio', suporte: 'suporte', ajuda: 'tutoriais', tutoriais: 'tutoriais', conta: 'conta' };
        var tab = tabMap[hash] || 'inicio';
        switchTab(tab);
    }

    // Clique nos nav links
    document.querySelectorAll('[data-tab]').forEach(function (el) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });

    // Botões inline que disparam troca de aba (ex: "Ver tutoriais" no hero)
    document.querySelectorAll('[data-tab-btn]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            switchTab(this.dataset.tabBtn);
        });
    });

    // Inicializa tabs ao carregar
    // Nota: applyPlanGating ainda não tem o plano aqui, mas será chamada
    // novamente após o perfil ser carregado no DOMContentLoaded.
    initTabs();

    // ----------------------------------------------------------------
    // DOMContentLoaded — auth guard + populate UI
    // ----------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {

        // Guard: redireciona para auth.html se não logado
        window.zentAuth.requireAuth('members.html').then(function (user) {
            if (!user) return;

            // Avatar: inicial do nome
            var displayName = (user.user_metadata && user.user_metadata.full_name)
                ? user.user_metadata.full_name
                : user.email;
            var firstName = displayName.split(' ')[0];

            var avatarEl = document.getElementById('m-user-avatar');
            var nameEl = document.getElementById('m-user-name');
            if (avatarEl) avatarEl.textContent = firstName.charAt(0).toUpperCase();
            if (nameEl) nameEl.textContent = firstName;

            // Hero badge: plano + gating
            window.zentAuth.getProfile().then(function (profile) {
                var plan = (profile && profile.plan) || '';
                var heroBadge = document.getElementById('m-hero-badge');
                if (heroBadge) heroBadge.textContent = PLAN_LABELS[plan] || 'Membro ZENT A.I.';

                // Aplica restrição de conteúdo baseada no plano
                // Isso define _currentUserPlan e garante que o upsell seja exibido/ocultado corretamente
                applyPlanGating(plan);

                // Conta: dados
                var accName = document.getElementById('acc-name');
                var accEmail = document.getElementById('acc-email');
                var accPlan = document.getElementById('acc-plan-name');
                var accSince = document.getElementById('acc-member-since');

                if (accName) accName.value = (profile && profile.full_name) || displayName;
                if (accEmail) accEmail.value = user.email;
                if (accPlan) accPlan.textContent = PLAN_LABELS[plan] || 'Starter';
                if (accSince) accSince.textContent = profile && profile.created_at
                    ? new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    : '—';
            });

            // ------ Salvar dados pessoais ------
            var saveBtn = document.getElementById('acc-save-btn');
            var saveMsg = document.getElementById('acc-save-msg');
            if (saveBtn) {
                saveBtn.addEventListener('click', function () {
                    var newName = (document.getElementById('acc-name') || {}).value || '';
                    if (!newName.trim()) return;
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Salvando...';

                    // Atualiza metadados no Supabase Auth
                    window.zentAuth.getSession().then(function (session) {
                        if (!session) return;
                        var sb = window._zentSupabaseClient;
                        if (!sb) { saveBtn.disabled = false; saveBtn.textContent = 'Salvar alterações'; return; }
                        sb.auth.updateUser({ data: { full_name: newName.trim() } }).then(function (res) {
                            saveBtn.disabled = false;
                            saveBtn.textContent = 'Salvar alterações';
                            if (res.error) {
                                if (saveMsg) { saveMsg.textContent = 'Erro ao salvar.'; saveMsg.style.color = '#f87171'; }
                            } else {
                                if (saveMsg) { saveMsg.textContent = 'Salvo!'; saveMsg.style.color = '#4ade80'; }
                                setTimeout(function () { if (saveMsg) saveMsg.textContent = ''; }, 3000);
                            }
                        });
                    });
                });
            }

            // ------ Atualizar senha ------
            var passBtn = document.getElementById('acc-pass-btn');
            var passMsg = document.getElementById('acc-pass-msg');
            if (passBtn) {
                passBtn.addEventListener('click', function () {
                    var np = (document.getElementById('acc-new-pass') || {}).value || '';
                    var cp = (document.getElementById('acc-confirm-pass') || {}).value || '';
                    if (passMsg) { passMsg.textContent = ''; }

                    if (np.length < 8) {
                        if (passMsg) { passMsg.textContent = 'Mínimo 8 caracteres.'; passMsg.style.color = '#f87171'; }
                        return;
                    }
                    if (np !== cp) {
                        if (passMsg) { passMsg.textContent = 'As senhas não coincidem.'; passMsg.style.color = '#f87171'; }
                        return;
                    }

                    passBtn.disabled = true;
                    passBtn.textContent = 'Atualizando...';

                    var sb = window._zentSupabaseClient;
                    if (!sb) { passBtn.disabled = false; passBtn.textContent = 'Atualizar senha'; return; }

                    sb.auth.updateUser({ password: np }).then(function (res) {
                        passBtn.disabled = false;
                        passBtn.textContent = 'Atualizar senha';
                        if (res.error) {
                            if (passMsg) { passMsg.textContent = 'Erro: ' + res.error.message; passMsg.style.color = '#f87171'; }
                        } else {
                            if (passMsg) { passMsg.textContent = 'Senha atualizada!'; passMsg.style.color = '#4ade80'; }
                            document.getElementById('acc-new-pass').value = '';
                            document.getElementById('acc-confirm-pass').value = '';
                            setTimeout(function () { if (passMsg) passMsg.textContent = ''; }, 3000);
                        }
                    });
                });
            }

        });

        // ------ Logout ------
        var logoutBtn = document.getElementById('m-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function () {
                window.zentAuth.signOut();
            });
        }

        // ------ Tool Sections Accordion ------
        var toolHeaders = document.querySelectorAll('.m-tool-header');
        toolHeaders.forEach(function (header) {
            header.addEventListener('click', function () {
                var section = header.closest('.m-tool-section');
                if (section) {
                    section.classList.toggle('collapsed');
                }
            });
        });

    });

})();
