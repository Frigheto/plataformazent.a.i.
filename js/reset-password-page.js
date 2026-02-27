/**
 * reset-password-page.js
 * Gerencia o formulário de recuperação de senha
 */
(function () {
    'use strict';

    const form = document.getElementById('form-reset-password');
    const emailInput = document.getElementById('reset-email');
    const submitBtn = document.getElementById('reset-submit');
    const messageDiv = document.getElementById('auth-message');
    const successDiv = document.getElementById('reset-success');
    const successEmail = document.getElementById('reset-sent-email');
    const backToLoginBtns = document.querySelectorAll('#back-to-login, #reset-back-to-login');

    // Validação de e-mail
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

    // Enviar formulário
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        messageDiv.style.display = 'none';

        const email = emailInput.value.trim();

        // Validação básica
        if (!email) {
            showError('reset-error-email', 'E-mail é obrigatório');
            return;
        }

        if (!email.includes('@')) {
            showError('reset-error-email', 'Digite um e-mail válido');
            return;
        }

        // Desabilita botão
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            // Chama função de reset do Supabase
            await window.zentAuth.resetPasswordForEmail(email);

            // Mostra sucesso
            form.style.display = 'none';
            successDiv.style.display = 'block';
            if (successEmail) {
                successEmail.textContent = email;
            }

        } catch (error) {
            console.error('Erro ao resetar senha:', error);

            // Mostra mensagem de erro amigável
            if (error.message.includes('not found') || error.message.includes('invalid')) {
                showMessage('E-mail não encontrado em nossa base de dados.', 'error');
            } else {
                showMessage('Erro ao enviar link de recuperação. Tente novamente.', 'error');
            }

            // Re-habilita botão
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enviar link de recuperação';
        }
    });

    // Voltar para login
    backToLoginBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'auth.html';
        });
    });

    // Focus nos inputs
    emailInput.addEventListener('focus', function() {
        document.getElementById('reset-error-email').textContent = '';
    });

})();
