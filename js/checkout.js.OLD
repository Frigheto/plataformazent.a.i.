/**
 * checkout.js — ZENT A.I.
 * Lógica da página de checkout: lê o plano da URL, exibe resumo, valida e redireciona para Asaas.
 *
 * URL esperada: checkout.html?plan=profissional
 *
 * CONFIGURAÇÃO:
 *   Cole as URLs dos Links de Pagamento Asaas nos campos link_prod de cada plano abaixo.
 *   Para testes, use link_sandbox (precisa criar no painel sandbox.asaas.com).
 */
(function () {
    'use strict';

    // ----------------------------------------------------------------
    // ATIVE O SANDBOX PARA TESTES (mude para false em produção)
    // ----------------------------------------------------------------
    var ASAAS_SANDBOX = false;

    // ----------------------------------------------------------------
    // DADOS E LINKS DE PAGAMENTO POR PLANO
    // ----------------------------------------------------------------
    var PLANS = {
        'starter': {
            label: 'Starter',
            price: 'R$ 197',
            note: '+ Integração mensal de R$ 77',
            features: [
                'Chat conectado na plataforma',
                'CRM + Google Agenda',
                'Dashboard de controle',
                'Até 500 leads',
                '1 usuário'
            ],
            link_prod: 'https://www.asaas.com/c/sw8og2cuwugzybkp',
            link_sandbox: ''
        },
        'basico': {
            label: 'Básico',
            price: 'R$ 397',
            note: '',
            features: [
                'IA de atendimento',
                'Chat conectado na plataforma',
                'CRM + Google Agenda',
                'Gerenciamento de redes sociais',
                'Até 1.000 leads',
                '3 usuários'
            ],
            link_prod: 'https://www.asaas.com/c/4hcwgn3e8hpxyu7y',
            link_sandbox: ''
        },
        'profissional': {
            label: 'Profissional',
            price: 'R$ 697',
            note: '',
            features: [
                'Agente SDR + marketing',
                'CRM automatizado',
                'Google Agenda integrada',
                'Disparo de mensagens',
                'Planejador de redes sociais',
                'Até 5.000 leads',
                '5 usuários'
            ],
            link_prod: 'https://www.asaas.com/c/atpju4yvhbfr0pgw',
            link_sandbox: ''
        },
        'premium': {
            label: 'Premium',
            price: 'R$ 997',
            note: '',
            features: [
                'Agente de IA completo',
                'CRM automatizado',
                'Google Agenda integrada',
                'Disparo de mensagens',
                'Leads ilimitados',
                '10 usuários',
                'Suporte VIP (1h de call)'
            ],
            link_prod: 'https://www.asaas.com/c/nzahbmfohreaghyk',
            link_sandbox: ''
        }
    };

    // ----------------------------------------------------------------
    // Utilitários de validação e máscara
    // ----------------------------------------------------------------
    function validateCPF(raw) {
        var cpf = raw.replace(/\D/g, '');
        if (cpf.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        var sum, remainder, i;

        sum = 0;
        for (i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf[9])) return false;

        sum = 0;
        for (i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cpf[10]);
    }

    function maskCPF(value) {
        var v = value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
        if (v.length > 3) return v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
        return v;
    }

    function maskPhone(value) {
        var v = value.replace(/\D/g, '').slice(0, 11);
        if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
        return v;
    }

    function setError(fieldId, errorId, message) {
        var field = document.getElementById(fieldId);
        var errorEl = document.getElementById(errorId);
        if (field) field.classList.toggle('is-invalid', !!message);
        if (errorEl) errorEl.textContent = message || '';
    }

    function validateForm(name, cpf, email, phone) {
        var valid = true;

        if (!name || name.trim().length < 3) {
            setError('co-name', 'co-error-name', 'Informe seu nome completo.');
            valid = false;
        } else {
            setError('co-name', 'co-error-name', '');
        }

        if (!validateCPF(cpf)) {
            setError('co-cpf', 'co-error-cpf', 'CPF inválido. Verifique e tente novamente.');
            valid = false;
        } else {
            setError('co-cpf', 'co-error-cpf', '');
        }

        var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!emailOk) {
            setError('co-email', 'co-error-email', 'Informe um e-mail válido.');
            valid = false;
        } else {
            setError('co-email', 'co-error-email', '');
        }

        var digits = phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 11) {
            setError('co-phone', 'co-error-phone', 'Informe um WhatsApp válido com DDD.');
            valid = false;
        } else {
            setError('co-phone', 'co-error-phone', '');
        }

        return valid;
    }

    // ----------------------------------------------------------------
    // Renderiza resumo do plano na coluna esquerda
    // ----------------------------------------------------------------
    var SVG_CHECK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    function renderPlanSummary(plan) {
        var data = PLANS[plan];

        var nameEl = document.getElementById('plan-name');
        var priceEl = document.getElementById('plan-price');
        var noteEl = document.getElementById('plan-note');
        var featuresEl = document.getElementById('plan-features');

        if (nameEl) nameEl.textContent = data.label;
        if (priceEl) priceEl.textContent = data.price;

        if (noteEl) {
            if (data.note) {
                noteEl.textContent = data.note;
                noteEl.style.display = 'block';
            } else {
                noteEl.style.display = 'none';
            }
        }

        if (featuresEl) {
            featuresEl.innerHTML = data.features.map(function (f) {
                return '<li>' + SVG_CHECK + '<span>' + f + '</span></li>';
            }).join('');
        }

        // Atualiza <title>
        document.title = 'Assinar ' + data.label + ' — ZENT A.I.';
    }

    // ----------------------------------------------------------------
    // Inicialização
    // ----------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function () {

        // Lê plano da URL
        var params = new URLSearchParams(window.location.search);
        var planKey = (params.get('plan') || '').toLowerCase();

        // Guarda referência do usuário logado para usar no externalReference do Asaas
        var currentUser = null;

        // Guard de autenticação: exige login antes de mostrar o checkout
        if (window.zentAuth) {
            window.zentAuth.requireAuth(window.location.href).then(function (user) {
                if (!user) return; // requireAuth já redirecionou para auth.html

                currentUser = user;

                // Exibe info do usuário logado
                var userInfoEl = document.getElementById('checkout-user-info');
                var userEmailEl = document.getElementById('checkout-user-email');
                if (userInfoEl && userEmailEl) {
                    userEmailEl.textContent = user.email;
                    userInfoEl.style.display = 'flex';
                }
            });
        }

        var form = document.getElementById('checkout-form');
        var fallbackEl = document.getElementById('checkout-fallback');
        var invalidEl = document.getElementById('checkout-invalid');

        // Plano inválido
        if (!PLANS[planKey]) {
            if (form) form.style.display = 'none';
            if (invalidEl) invalidEl.style.display = 'block';
            return;
        }

        renderPlanSummary(planKey);

        // Máscara CPF
        var cpfInput = document.getElementById('co-cpf');
        if (cpfInput) {
            cpfInput.addEventListener('input', function () {
                this.value = maskCPF(this.value);
            });
        }

        // Máscara telefone
        var phoneInput = document.getElementById('co-phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                this.value = maskPhone(this.value);
            });
        }

        // Submit
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();

                var name = (document.getElementById('co-name') || {}).value || '';
                var cpf = (document.getElementById('co-cpf') || {}).value || '';
                var email = (document.getElementById('co-email') || {}).value || '';
                var phone = (document.getElementById('co-phone') || {}).value || '';

                if (!validateForm(name, cpf, email, phone)) return;

                var planData = PLANS[planKey];
                var link = ASAAS_SANDBOX ? planData.link_sandbox : planData.link_prod;

                // Adiciona externalReference para o webhook identificar usuário e plano
                if (link && currentUser && currentUser.id) {
                    var ref = 'plan:' + planKey + ':uid:' + currentUser.id;
                    link += (link.indexOf('?') !== -1 ? '&' : '?') + 'externalReference=' + encodeURIComponent(ref);
                }

                // Feedback visual
                var submitBtn = document.getElementById('co-submit');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Redirecionando...';
                }

                if (link) {
                    // Link configurado: abre checkout Asaas
                    window.open(link, '_blank', 'noopener,noreferrer');

                    // Mensagem de confirmação após abrir a aba
                    setTimeout(function () {
                        form.style.display = 'none';
                        if (fallbackEl) {
                            fallbackEl.style.display = 'block';
                            fallbackEl.innerHTML = '<strong>Redirecionando para o pagamento!</strong><br>Uma nova aba foi aberta com o checkout seguro do Asaas.';
                        }
                    }, 600);
                } else {
                    // Link não configurado: mostra mensagem de contato
                    setTimeout(function () {
                        form.style.display = 'none';
                        if (fallbackEl) fallbackEl.style.display = 'block';
                    }, 400);
                }
            });
        }
    });

})();
