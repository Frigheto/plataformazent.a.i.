/**
 * checkout-new.js — Novo checkout com integração API Asaas
 * Suporta PIX e Cartão de Crédito via Edge Functions
 */

(function () {
  'use strict';

  // CONFIGURAÇÃO SUPABASE
  const SUPABASE_URL = 'https://tohqjcsrgfvlotnkcmqy.supabase.co';

  // Dados dos planos
  const PLANS = {
    starter: {
      label: 'Starter',
      price: 'R$ 197',
      features: [
        'Chat conectado na plataforma',
        'CRM + Google Agenda',
        'Dashboard de controle',
        'Até 500 leads',
        '1 usuário'
      ]
    },
    basico: {
      label: 'Básico',
      price: 'R$ 397',
      features: [
        'IA de atendimento',
        'Chat conectado na plataforma',
        'CRM + Google Agenda',
        'Gerenciamento de redes sociais',
        'Até 1.000 leads',
        '3 usuários'
      ]
    },
    profissional: {
      label: 'Profissional',
      price: 'R$ 697',
      features: [
        'Agente SDR + marketing',
        'CRM automatizado',
        'Google Agenda integrada',
        'Disparo de mensagens',
        'Planejador de redes sociais',
        'Até 5.000 leads',
        '5 usuários'
      ]
    },
    premium: {
      label: 'Premium',
      price: 'R$ 997',
      features: [
        'Agente de IA completo',
        'CRM automatizado',
        'Google Agenda integrada',
        'Disparo de mensagens',
        'Leads ilimitados',
        '10 usuários',
        'Suporte VIP (1h de call)'
      ]
    }
  };

  // Estado global
  let currentUser = null;
  let currentPlan = null;
  let currentPaymentId = null;
  let pixPollingInterval = null;

  // Inicialização
  document.addEventListener('DOMContentLoaded', function () {
    initializeCheckout();
  });

  function initializeCheckout() {
    // Guard de autenticação
    if (window.zentAuth) {
      window.zentAuth.requireAuth(window.location.href).then(function (user) {
        if (!user) return;

        currentUser = user;

        // Mostrar info do usuário
        const userInfoEl = document.getElementById('checkout-user-info');
        const userEmailEl = document.getElementById('checkout-user-email');
        if (userInfoEl && userEmailEl) {
          userEmailEl.textContent = user.email;
          userInfoEl.style.display = 'flex';
        }
      });
    }

    // Ler plano da URL
    const params = new URLSearchParams(window.location.search);
    const planKey = (params.get('plan') || '').toLowerCase();

    // Validar plano
    if (!PLANS[planKey]) {
      const invalidEl = document.getElementById('checkout-invalid');
      const form = document.getElementById('checkout-form');
      if (form) form.style.display = 'none';
      if (invalidEl) invalidEl.style.display = 'block';
      return;
    }

    currentPlan = planKey;
    renderPlanSummary(planKey);

    // Setup event listeners
    setupPaymentMethodSelector();
    setupInputMasks();
    setupFormSubmit();
  }

  function renderPlanSummary(plan) {
    const data = PLANS[plan];
    const SVG_CHECK = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';

    const nameEl = document.getElementById('plan-name');
    const priceEl = document.getElementById('plan-price');
    const featuresEl = document.getElementById('plan-features');

    if (nameEl) nameEl.textContent = data.label;
    if (priceEl) priceEl.textContent = data.price;

    if (featuresEl) {
      featuresEl.innerHTML = data.features.map(f => `<li>${SVG_CHECK}<span>${f}</span></li>`).join('');
    }

    document.title = `Assinar ${data.label} — ZENT A.I.`;
  }

  function setupPaymentMethodSelector() {
    const methodOptions = document.querySelectorAll('.method-option');
    const pixContainer = document.getElementById('pix-container');
    const cardContainer = document.getElementById('card-container');

    methodOptions.forEach(option => {
      option.addEventListener('click', function () {
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;

        methodOptions.forEach(opt => opt.classList.remove('active'));
        this.classList.add('active');

        const method = radio.value;
        if (method === 'pix') {
          pixContainer.classList.add('active');
          cardContainer.classList.remove('active');
        } else {
          pixContainer.classList.remove('active');
          cardContainer.classList.add('active');
        }
      });
    });

    // Click no input também
    document.querySelectorAll('input[name="payment-method"]').forEach(input => {
      input.addEventListener('change', function () {
        const label = this.closest('.method-option');
        label.click();
      });
    });
  }

  function setupInputMasks() {
    // Máscara CPF
    const cpfInput = document.getElementById('co-cpf');
    if (cpfInput) {
      cpfInput.addEventListener('input', function () {
        this.value = maskCPF(this.value);
      });
    }

    // Máscara Telefone
    const phoneInput = document.getElementById('co-phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function () {
        this.value = maskPhone(this.value);
      });
    }

    // Máscara Cartão
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
      cardNumberInput.addEventListener('input', function () {
        this.value = maskCardNumber(this.value);
      });
    }

    // Máscara Expiração
    const cardExpiryInput = document.getElementById('card-expiry');
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener('input', function () {
        this.value = maskExpiry(this.value);
      });
    }
  }

  function setupFormSubmit() {
    const pixSubmitBtn = document.getElementById('co-pix-submit');
    const cardSubmitBtn = document.getElementById('co-card-submit');

    if (pixSubmitBtn) {
      pixSubmitBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (!validateCheckoutForm()) return;

        pixSubmitBtn.disabled = true;
        pixSubmitBtn.textContent = 'Gerando QR Code...';

        try {
          await submitPixPayment();
        } catch (error) {
          console.error('Erro:', error);
          alert('Erro ao processar pagamento PIX');
          pixSubmitBtn.disabled = false;
          pixSubmitBtn.textContent = 'Gerar QR Code';
        }
      });
    }

    if (cardSubmitBtn) {
      cardSubmitBtn.addEventListener('click', async function (e) {
        e.preventDefault();
        if (!validateCheckoutForm() || !validateCardForm()) return;

        cardSubmitBtn.disabled = true;
        cardSubmitBtn.textContent = 'Processando...';

        try {
          await submitCardPayment();
        } catch (error) {
          console.error('Erro:', error);
          alert('Erro ao processar pagamento');
          cardSubmitBtn.disabled = false;
          cardSubmitBtn.textContent = 'Pagar com cartão';
        }
      });
    }
  }

  function validateCheckoutForm() {
    const name = document.getElementById('co-name').value.trim();
    const cpf = document.getElementById('co-cpf').value.replace(/\D/g, '');
    const email = document.getElementById('co-email').value.trim();
    const phone = document.getElementById('co-phone').value.replace(/\D/g, '');

    let valid = true;

    if (!name || name.length < 3) {
      setError('co-name', 'co-error-name', 'Nome completo obrigatório');
      valid = false;
    } else {
      setError('co-name', 'co-error-name', '');
    }

    if (!validateCPF(cpf)) {
      setError('co-cpf', 'co-error-cpf', 'CPF inválido');
      valid = false;
    } else {
      setError('co-cpf', 'co-error-cpf', '');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('co-email', 'co-error-email', 'E-mail inválido');
      valid = false;
    } else {
      setError('co-email', 'co-error-email', '');
    }

    if (phone.length < 10 || phone.length > 11) {
      setError('co-phone', 'co-error-phone', 'WhatsApp inválido');
      valid = false;
    } else {
      setError('co-phone', 'co-error-phone', '');
    }

    return valid;
  }

  function validateCardForm() {
    const holder = document.getElementById('card-holder').value.trim();
    const number = document.getElementById('card-number').value.replace(/\D/g, '');
    const expiry = document.getElementById('card-expiry').value;
    const cvv = document.getElementById('card-cvv').value.replace(/\D/g, '');

    let valid = true;

    if (!holder || holder.length < 3) {
      setError('card-holder', 'card-error-holder', 'Nome do titular obrigatório');
      valid = false;
    } else {
      setError('card-holder', 'card-error-holder', '');
    }

    if (number.length !== 16) {
      setError('card-number', 'card-error-number', 'Cartão inválido');
      valid = false;
    } else {
      setError('card-number', 'card-error-number', '');
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError('card-expiry', 'card-error-expiry', 'Formato: MM/YY');
      valid = false;
    } else {
      setError('card-expiry', 'card-error-expiry', '');
    }

    if (cvv.length < 3 || cvv.length > 4) {
      setError('card-cvv', 'card-error-cvv', 'CVV inválido');
      valid = false;
    } else {
      setError('card-cvv', 'card-error-cvv', '');
    }

    return valid;
  }

  async function submitPixPayment() {
    const name = document.getElementById('co-name').value.trim();
    const cpf = document.getElementById('co-cpf').value.replace(/\D/g, '');
    const email = document.getElementById('co-email').value.trim();
    const phone = document.getElementById('co-phone').value.replace(/\D/g, '');

    console.log('[checkout] Iniciando POST para process-payment...');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        plan: currentPlan,
        cpf,
        email,
        phone,
        name,
        method: 'pix'
      })
    });

    if (!response.ok) {
      let errorMsg = `HTTP ${response.status}`;
      try {
        const errorBody = await response.text();
        console.error('[checkout] Erro da API:', errorBody);
        errorMsg += ` - ${errorBody}`;
      } catch (e) {
        console.error('[checkout] Erro ao ler resposta:', e);
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    currentPaymentId = result.paymentId;

    // Exibir QR Code
    displayPixConfirmation(result.qrCode, result.pixCopiaECola);

    // Começar polling
    startPixPolling();
  }

  async function submitCardPayment() {
    // Por enquanto, mostrar mensagem indicando que processaremos o cartão
    // Em produção, você precisará integrar com tokenização do Asaas
    alert('Pagamento por cartão será processado aqui');
  }

  function displayPixConfirmation(qrCode, pixKey) {
    const form = document.getElementById('checkout-form');
    const confirmation = document.getElementById('pix-confirmation');
    const qrContainer = document.getElementById('qr-code-container');
    const pixCopyCode = document.getElementById('pix-copy-code');

    if (form) form.style.display = 'none';
    if (confirmation) confirmation.style.display = 'block';

    if (qrContainer && qrCode) {
      qrContainer.innerHTML = '';
      new QRCode(qrContainer, {
        text: qrCode,
        width: 256,
        height: 256,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    }

    if (pixCopyCode) {
      pixCopyCode.textContent = pixKey;
    }
  }

  function startPixPolling() {
    if (pixPollingInterval) clearInterval(pixPollingInterval);

    pixPollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/confirm-pix-payment?paymentId=${currentPaymentId}&userId=${currentUser.id}`);
        const result = await response.json();

        if (result.status === 'CONFIRMED') {
          clearInterval(pixPollingInterval);
          showPaymentSuccess();
          setTimeout(() => {
            window.location.href = 'members.html';
          }, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll a cada 2 segundos
  }

  function showPaymentSuccess() {
    const confirmation = document.getElementById('pix-confirmation');
    const success = document.getElementById('checkout-success');

    if (confirmation) confirmation.style.display = 'none';
    if (success) success.style.display = 'block';
  }

  // Utilitários
  function maskCPF(value) {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
    if (v.length > 3) return v.replace(/(\d{3})(\d{3})/, '$1.$2');
    return v;
  }

  function maskPhone(value) {
    const v = value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    return v;
  }

  function maskCardNumber(value) {
    const v = value.replace(/\D/g, '').slice(0, 16);
    return v.replace(/(\d{4})(?=\d)/g, '$1 ');
  }

  function maskExpiry(value) {
    const v = value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) return v.slice(0, 2) + '/' + v.slice(2);
    return v;
  }

  function validateCPF(cpf) {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf[10]);
  }

  function setError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    if (field) field.classList.toggle('is-invalid', !!message);
    if (errorEl) errorEl.textContent = message || '';
  }

  // Função global para copiar PIX
  window.copiarPixCode = function () {
    const pixCode = document.getElementById('pix-copy-code').textContent;
    navigator.clipboard.writeText(pixCode).then(() => {
      alert('Código PIX copiado!');
    });
  };

})();
