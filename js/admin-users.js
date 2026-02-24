/**
 * admin-users.js — Gerenciamento de usuários (REFATORADO)
 * CRUD de usuários e edição de planos
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
                console.log('[Admin Users] ✅ Supabase pronto');

                // Inicializa quando Supabase está pronto
                if (document.readyState === 'loading') {
                    console.log('[Admin Users] DOM ainda carregando...');
                } else {
                    console.log('[Admin Users] DOM já carregado, inicializando...');
                    await initializeUsers();
                }
            }
        }
    }, 100);

    // Timeout
    setTimeout(() => {
        if (!supabaseReady) {
            console.error('[Admin Users] ❌ Supabase não inicializou em 5s');
            document.body.innerHTML = '<div style="padding: 20px; color: red;">Erro: Supabase não carregou. Recarregue a página.</div>';
        }
    }, 5000);

    let allUsers = [];
    let currentPage = 0;
    const itemsPerPage = 10;
    let editingUserId = null;

    const PLAN_LABELS = {
        'starter': 'Starter',
        'basico': 'Básico',
        'profissional': 'Profissional',
        'premium': 'Premium',
        '': 'Sem plano'
    };

    // Inicializar usuários
    const initializeUsers = async () => {
        console.log('[Admin Users] Inicializando...');

        if (!window.adminAuth.isAuthenticated()) {
            console.log('[Admin Users] Não autenticado, redirecionando...');
            window.location.href = '../admin-login.html';
            return;
        }

        const adminSession = window.adminAuth.getSession();
        if (document.getElementById('admin-user-name')) {
            document.getElementById('admin-user-name').textContent = adminSession.name || 'Admin';
        }

        // Carrega usuários
        await loadUsers();

        // Event listeners
        const filterSearch = document.getElementById('filter-search');
        const filterPlan = document.getElementById('filter-plan');
        const prevBtn = document.getElementById('users-prev-btn');
        const nextBtn = document.getElementById('users-next-btn');

        if (filterSearch) filterSearch.addEventListener('input', filterUsers);
        if (filterPlan) filterPlan.addEventListener('change', filterUsers);
        if (prevBtn) prevBtn.addEventListener('click', previousPage);
        if (nextBtn) nextBtn.addEventListener('click', nextPage);

        console.log('[Admin Users] ✅ Inicialização completa');
    };

    // DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async function () {
            console.log('[Admin Users] DOMContentLoaded disparado');
            if (supabaseReady) {
                await initializeUsers();
            }
        });
    } else {
        console.log('[Admin Users] DOM já carregado');
        if (supabaseReady) {
            initializeUsers();
        }
    }

    async function loadUsers() {
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('user_id, email, full_name, plan, created_at');

            if (error) throw error;

            allUsers = (profiles || []).map(p => ({
                id: p.user_id,
                email: p.email || '—',
                name: p.full_name || 'Sem nome',
                plan: (p.plan || '').toLowerCase(), // Normaliza para minúsculo
                createdAt: p.created_at
            }));

            currentPage = 0;
            renderUsers();

        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar usuários');
        }
    }

    function filterUsers() {
        currentPage = 0;
        renderUsers();
    }

    function renderUsers() {
        const searchTerm = document.getElementById('filter-search').value.toLowerCase();
        const planFilter = document.getElementById('filter-plan').value;

        let filtered = allUsers.filter(user => {
            const matchesSearch = user.email.toLowerCase().includes(searchTerm) ||
                user.name.toLowerCase().includes(searchTerm);
            const matchesPlan = planFilter === '' || user.plan === planFilter;
            return matchesSearch && matchesPlan;
        });

        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        const start = currentPage * itemsPerPage;
        const pageUsers = filtered.slice(start, start + itemsPerPage);

        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = '';

        if (pageUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty">Nenhum usuário encontrado</td></tr>';
        } else {
            pageUsers.forEach(user => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${escapeHtml(user.name)}</td>
                    <td>${escapeHtml(user.email)}</td>
                    <td>
                        <span class="admin-plan-badge admin-plan-badge--${user.plan || 'noplan'}">
                            ${PLAN_LABELS[user.plan]}
                        </span>
                    </td>
                    <td>${formatDate(user.createdAt)}</td>
                    <td>
                        <button type="button" class="admin-btn admin-btn--small" onclick="openUserModal('${user.id}', '${escapeHtml(user.name)}', '${escapeHtml(user.email)}', '${user.plan}')">
                            Editar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // Pagination
        const pagination = document.getElementById('users-pagination');
        if (totalPages > 1) {
            pagination.style.display = 'flex';
            document.getElementById('users-page-info').textContent = `Página ${currentPage + 1} de ${totalPages}`;
            document.getElementById('users-prev-btn').disabled = currentPage === 0;
            document.getElementById('users-next-btn').disabled = currentPage === totalPages - 1;
        } else {
            pagination.style.display = 'none';
        }
    }

    function previousPage() {
        if (currentPage > 0) currentPage--;
        renderUsers();
    }

    function nextPage() {
        const searchTerm = document.getElementById('filter-search').value.toLowerCase();
        const planFilter = document.getElementById('filter-plan').value;
        let filtered = allUsers.filter(user => {
            const matchesSearch = user.email.toLowerCase().includes(searchTerm) ||
                user.name.toLowerCase().includes(searchTerm);
            const matchesPlan = planFilter === '' || user.plan === planFilter;
            return matchesSearch && matchesPlan;
        });
        const totalPages = Math.ceil(filtered.length / itemsPerPage);
        if (currentPage < totalPages - 1) currentPage++;
        renderUsers();
    }

    window.openUserModal = function (userId, userName, userEmail, userPlan) {
        editingUserId = userId;
        document.getElementById('edit-user-name').value = userName;
        document.getElementById('edit-user-email').value = userEmail;
        document.getElementById('edit-user-plan').value = userPlan;
        document.getElementById('user-edit-modal').style.display = 'flex';
    };

    window.closeUserModal = function () {
        document.getElementById('user-edit-modal').style.display = 'none';
        editingUserId = null;
    };

    window.saveUserChanges = async function () {
        const newPlan = document.getElementById('edit-user-plan').value;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ plan: newPlan || null })
                .eq('id', editingUserId);

            if (error) throw error;

            // Registra no audit_log
            const adminSession = window.adminAuth.getSession();
            await supabase.from('audit_log').insert({
                admin_id: adminSession.id,
                action: 'UPDATE_USER_PLAN',
                resource_type: 'user',
                resource_id: editingUserId,
                changes: { plan: newPlan },
                timestamp: new Date().toISOString()
            });

            window.closeUserModal();
            await loadUsers();

        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            alert('Erro ao salvar alterações');
        }
    };

    function formatDate(dateString) {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
