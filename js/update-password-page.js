/**
 * update-password-page.js
 * Gerencia a atualização de senha após clique no email
 */
(function () {
    'use strict';

    const form = document.getElementById('form-update-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('update-submit');
    const messageDiv = document.getElementById('auth-message');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const successDiv = document.getElementById('update-success');

    // Helper: mostrar erro de campo
    function showError(fieldId, message) {
        const errorEl = document.getElementById(fieldId);
        if (errorEl) {
            errorEl.textContent = message;
        }
    }

    function clearErrors() {
        const errors = document.querySelectorAll('.form-error');
        errors.forEach(el => el.textContent = '');
    }

    function showMessage(message, type = 'error') {
        messageDiv.textContent = message;
        messageDiv.className = `auth-message ${type}`;
        messageDiv.style.display = 'block';
    }

    // Verifica se o usuário tem sessão válida (vem do link de reset)
    async function checkSession() {
        try {
            const user = await window.zentAuth.getUser();
            if (!user) {
                // Sem sessão = link expirado ou inválido
                form.style.display = 'none';
                loadingState.style.display = 'none';
                errorState.style.display = 'block';
                errorMessage.textContent = 'O link de recuperação expirou. Solicite um novo link de recuperação.';
            }
        } catch (error) {
            console.error('Erro ao verificar sessão:', error);
            form.style.display = 'none';
            loadingState.style.display = 'none';
            errorState.style.display = 'block';
            errorMessage.textContent = 'Erro ao validar link. Tente novamente.';
        }
    }

    // Checa sessão ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkSession);
    } else {
        checkSession();
    }

    // Enviar formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        messageDiv.style.display = 'none';

        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // Validações
        if (!newPassword) {
            showError('error-new-password', 'Nova senha é obrigatória');
            return;
        }

        if (newPassword.length < 8) {
            showError('error-new-password', 'Senha deve ter no mínimo 8 caracteres');
            return;
        }

        if (!confirmPassword) {
            showError('error-confirm-password', 'Confirmação de senha é obrigatória');
            return;
        }

        if (newPassword !== confirmPassword) {
            showError('error-confirm-password', 'As senhas não correspondem');
            return;
        }

        // Desabilita botão e mostra loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Atualizando...';

        try {
            // Atualiza a senha
            await window.zentAuth.updatePassword(newPassword);

            // Mostra sucesso
            form.style.display = 'none';
            successDiv.style.display = 'block';

        } catch (error) {
            console.error('Erro ao atualizar senha:', error);

            // Mostra erro
            if (error.message.includes('invalid') || error.message.includes('expired')) {
                form.style.display = 'none';
                errorState.style.display = 'block';
                errorMessage.textContent = 'Link expirado. Solicite um novo link de recuperação.';
            } else {
                showMessage('Erro ao atualizar senha. Tente novamente.', 'error');
            }

            // Re-habilita botão
            submitBtn.disabled = false;
            submitBtn.textContent = 'Atualizar Senha';
        }
    });

    // Botão voltar para login (na tela de sucesso)
    const goToLoginBtn = document.getElementById('go-to-login');
    if (goToLoginBtn) {
        goToLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'auth.html';
        });
    }

    // Botão solicitar novo link (na tela de erro)
    const errorBackBtn = document.getElementById('error-back-to-reset');
    if (errorBackBtn) {
        errorBackBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'reset-password.html';
        });
    }

    // Focus nos inputs
    newPasswordInput.addEventListener('focus', function() {
        document.getElementById('error-new-password').textContent = '';
    });

    confirmPasswordInput.addEventListener('focus', function() {
        document.getElementById('error-confirm-password').textContent = '';
    });

})();
