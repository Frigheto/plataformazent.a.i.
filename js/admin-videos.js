/**
 * admin-videos.js — Gerenciamento de vídeos (REFATORADO)
 * CRUD de tutoriais
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
                console.log('[Admin Videos] ✅ Supabase pronto');

                // Inicializa quando Supabase está pronto
                if (document.readyState === 'loading') {
                    console.log('[Admin Videos] DOM ainda carregando...');
                } else {
                    console.log('[Admin Videos] DOM já carregado, inicializando...');
                    await initializeVideos();
                }
            }
        }
    }, 100);

    // Timeout
    setTimeout(() => {
        if (!supabaseReady) {
            console.error('[Admin Videos] ❌ Supabase não inicializou em 5s');
            document.body.innerHTML = '<div style="padding: 20px; color: red;">Erro: Supabase não carregou. Recarregue a página.</div>';
        }
    }, 5000);

    let allVideos = [];
    let editingVideoId = null;

    const PLAN_LABELS = {
        'starter': 'Starter',
        'basico': 'Básico',
        'profissional': 'Profissional',
        'premium': 'Premium'
    };

    // Inicializar vídeos
    const initializeVideos = async () => {
        console.log('[Admin Videos] Inicializando...');

        if (!window.adminAuth.isAuthenticated()) {
            console.log('[Admin Videos] Não autenticado, redirecionando...');
            window.location.href = '../admin-login.html';
            return;
        }

        const adminSession = window.adminAuth.getSession();
        if (document.getElementById('admin-user-name')) {
            document.getElementById('admin-user-name').textContent = adminSession.name || 'Admin';
        }

        // Carrega vídeos
        await loadVideos();

        console.log('[Admin Videos] ✅ Inicialização completa');
    };

    // DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async function () {
            console.log('[Admin Videos] DOMContentLoaded disparado');
            if (supabaseReady) {
                await initializeVideos();
            }
        });
    } else {
        console.log('[Admin Videos] DOM já carregado');
        if (supabaseReady) {
            initializeVideos();
        }
    }

    async function loadVideos() {
        try {
            const { data: videos, error } = await supabase
                .from('videos')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            allVideos = videos || [];
            renderVideos();

        } catch (error) {
            console.error('Erro ao carregar vídeos:', error);
            alert('Erro ao carregar vídeos');
        }
    }

    function renderVideos() {
        const tbody = document.getElementById('videos-tbody');
        tbody.innerHTML = '';

        if (allVideos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="admin-table-empty">Nenhum vídeo cadastrado</td></tr>';
        } else {
            allVideos.forEach(video => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${video.episode}</td>
                    <td>${escapeHtml(video.title)}</td>
                    <td>${video.duration || '—'}</td>
                    <td>
                        <span class="admin-plan-badge admin-plan-badge--${video.min_plan}">
                            ${PLAN_LABELS[video.min_plan] || '—'}
                        </span>
                    </td>
                    <td>
                        <button type="button" class="admin-btn admin-btn--small" onclick="editVideo('${video.id}')">
                            Editar
                        </button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    }

    window.openVideoModal = function () {
        editingVideoId = null;
        document.getElementById('video-modal-title').textContent = 'Novo vídeo';
        document.getElementById('delete-video-btn').style.display = 'none';
        document.getElementById('edit-video-episode').value = '';
        document.getElementById('edit-video-title').value = '';
        document.getElementById('edit-video-description').value = '';
        document.getElementById('edit-video-duration').value = '';
        document.getElementById('edit-video-url').value = '';
        document.getElementById('edit-video-plan').value = 'starter';
        document.getElementById('video-modal').style.display = 'flex';
    };

    window.editVideo = function (videoId) {
        const video = allVideos.find(v => v.id === videoId);
        if (!video) return;

        editingVideoId = videoId;
        document.getElementById('video-modal-title').textContent = 'Editar vídeo';
        document.getElementById('delete-video-btn').style.display = 'block';
        document.getElementById('edit-video-episode').value = video.episode;
        document.getElementById('edit-video-title').value = video.title;
        document.getElementById('edit-video-description').value = video.description || '';
        document.getElementById('edit-video-duration').value = video.duration || '';
        document.getElementById('edit-video-url').value = video.video_url || '';
        document.getElementById('edit-video-plan').value = video.min_plan || 'starter';
        document.getElementById('video-modal').style.display = 'flex';
    };

    window.closeVideoModal = function () {
        document.getElementById('video-modal').style.display = 'none';
        editingVideoId = null;
    };

    window.saveVideo = async function () {
        const episode = parseInt(document.getElementById('edit-video-episode').value);
        const title = document.getElementById('edit-video-title').value.trim();
        const description = document.getElementById('edit-video-description').value.trim();
        const duration = document.getElementById('edit-video-duration').value.trim();
        const videoUrl = document.getElementById('edit-video-url').value.trim();
        const minPlan = document.getElementById('edit-video-plan').value;

        if (!episode || !title || !videoUrl) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const adminSession = window.adminAuth.getSession();

            if (editingVideoId) {
                // Atualiza vídeo existente
                const { error } = await supabase
                    .from('videos')
                    .update({
                        episode,
                        title,
                        description,
                        duration,
                        video_url: videoUrl,
                        min_plan: minPlan
                    })
                    .eq('id', editingVideoId);

                if (error) throw error;

                // Registra no audit_log
                await supabase.from('audit_log').insert({
                    admin_id: adminSession.id,
                    action: 'UPDATE_VIDEO',
                    resource_type: 'video',
                    resource_id: editingVideoId,
                    changes: { title, min_plan: minPlan },
                    timestamp: new Date().toISOString()
                });

            } else {
                // Cria novo vídeo
                const { error } = await supabase
                    .from('videos')
                    .insert({
                        episode,
                        title,
                        description,
                        duration,
                        video_url: videoUrl,
                        min_plan: minPlan,
                        order_index: (allVideos.length + 1) * 10
                    });

                if (error) throw error;

                // Registra no audit_log
                await supabase.from('audit_log').insert({
                    admin_id: adminSession.id,
                    action: 'CREATE_VIDEO',
                    resource_type: 'video',
                    changes: { title, min_plan: minPlan },
                    timestamp: new Date().toISOString()
                });
            }

            window.closeVideoModal();
            await loadVideos();

        } catch (error) {
            console.error('Erro ao salvar vídeo:', error);
            alert('Erro ao salvar vídeo: ' + error.message);
        }
    };

    window.deleteVideo = async function () {
        if (!confirm('Tem certeza que deseja deletar este vídeo?')) return;

        try {
            const adminSession = window.adminAuth.getSession();

            const { error } = await supabase
                .from('videos')
                .delete()
                .eq('id', editingVideoId);

            if (error) throw error;

            // Registra no audit_log
            await supabase.from('audit_log').insert({
                admin_id: adminSession.id,
                action: 'DELETE_VIDEO',
                resource_type: 'video',
                resource_id: editingVideoId,
                timestamp: new Date().toISOString()
            });

            window.closeVideoModal();
            await loadVideos();

        } catch (error) {
            console.error('Erro ao deletar vídeo:', error);
            alert('Erro ao deletar vídeo');
        }
    };

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();
