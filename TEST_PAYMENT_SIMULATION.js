/**
 * TEST_PAYMENT_SIMULATION.js
 *
 * Teste automatizado para simular uma compra PIX completa
 *
 * INSTRUÇÕES:
 * 1. Abrir DevTools (F12)
 * 2. Colar este código no console
 * 3. Executar: runPaymentTest()
 *
 * NOTA: Você precisa estar logado no checkout.html?plan=starter
 */

async function runPaymentTest() {
  console.log('🧪 INICIANDO TESTE DE PAGAMENTO PIX...\n');

  try {
    // ===== STEP 1: Validar página =====
    console.log('📋 STEP 1: Validando página...');
    const form = document.getElementById('checkout-form');
    if (!form) throw new Error('Formulário não encontrado!');
    console.log('✅ Formulário encontrado\n');

    // ===== STEP 2: Preencher dados =====
    console.log('📝 STEP 2: Preenchendo formulário...');
    const testData = {
      name: 'Test User QA',
      cpf: '11144477735',
      email: 'test@zentgrowth.com',
      phone: '11999999999'
    };

    document.getElementById('co-name').value = testData.name;
    document.getElementById('co-name').dispatchEvent(new Event('input'));
    console.log(`  ✓ Nome: ${testData.name}`);

    document.getElementById('co-cpf').value = testData.cpf;
    document.getElementById('co-cpf').dispatchEvent(new Event('input'));
    console.log(`  ✓ CPF: ${testData.cpf}`);

    document.getElementById('co-email').value = testData.email;
    document.getElementById('co-email').dispatchEvent(new Event('input'));
    console.log(`  ✓ Email: ${testData.email}`);

    document.getElementById('co-phone').value = testData.phone;
    document.getElementById('co-phone').dispatchEvent(new Event('input'));
    console.log(`  ✓ Telefone: ${testData.phone}\n`);

    // ===== STEP 3: Selecionar PIX =====
    console.log('💳 STEP 3: Selecionando PIX...');
    const pixRadio = document.querySelector('input[name="payment-method"][value="pix"]');
    if (!pixRadio) throw new Error('Radio button PIX não encontrado!');
    pixRadio.click();
    console.log('✅ PIX selecionado\n');

    // ===== STEP 4: Enviar pagamento =====
    console.log('🚀 STEP 4: Enviando requisição de pagamento...');
    const submitBtn = document.getElementById('co-pix-submit');
    if (!submitBtn) throw new Error('Botão submit não encontrado!');

    // Aguardar um pouco para garantir que tudo foi populado
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('📤 Clicando em "Gerar QR Code"...');
    submitBtn.click();

    // ===== STEP 5: Aguardar QR Code =====
    console.log('⏳ STEP 5: Aguardando geração do QR Code...');
    let qrCodeGenerated = false;
    let waitTime = 0;
    const maxWait = 15000; // 15 segundos

    while (!qrCodeGenerated && waitTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 500));
      waitTime += 500;

      const qrContainer = document.getElementById('qr-code-container');
      const pixCopyCode = document.getElementById('pix-copy-code');

      if (qrContainer && qrContainer.innerHTML && pixCopyCode && pixCopyCode.textContent) {
        qrCodeGenerated = true;
        console.log(`✅ QR Code gerado em ${waitTime}ms!\n`);
      }
    }

    if (!qrCodeGenerated) {
      throw new Error(`QR Code não foi gerado após ${maxWait}ms`);
    }

    // ===== STEP 6: Validar QR Code =====
    console.log('🔍 STEP 6: Validando dados do QR Code...');
    const pixCode = document.getElementById('pix-copy-code').textContent;
    if (!pixCode || pixCode.length < 10) {
      throw new Error('Código PIX inválido ou vazio!');
    }

    console.log(`✅ Código PIX gerado:`);
    console.log(`   ${pixCode}\n`);

    // ===== STEP 7: Validar confirmação =====
    console.log('✨ STEP 7: Validando UI de confirmação...');
    const confirmation = document.getElementById('pix-confirmation');
    if (!confirmation || confirmation.style.display === 'none') {
      throw new Error('Tela de confirmação não apareceu!');
    }
    console.log('✅ Tela de confirmação visível\n');

    // ===== RESULTADO FINAL =====
    console.log('════════════════════════════════════════════');
    console.log('✅ TESTE PASSOU!');
    console.log('════════════════════════════════════════════\n');
    console.log('📊 RESULTADOS:');
    console.log(`  ✓ Formulário preenchido corretamente`);
    console.log(`  ✓ PIX selecionado`);
    console.log(`  ✓ Edge Function retornou sucesso`);
    console.log(`  ✓ QR Code gerado`);
    console.log(`  ✓ Código PIX válido (${pixCode.length} caracteres)`);
    console.log(`  ✓ UI de confirmação exibida\n`);

    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('  1. Copiar o código PIX acima');
    console.log('  2. Pagar no Asaas Sandbox (simular)');
    console.log('  3. Aguardar confirmação (máx 10 minutos)');
    console.log('  4. Verificar redirecionamento para members.html\n');

    return {
      success: true,
      pixCode: pixCode,
      message: 'Pagamento PIX iniciado com sucesso!'
    };

  } catch (error) {
    console.error('❌ TESTE FALHOU!\n');
    console.error('🔴 Erro:', error.message);
    console.error('\n📋 Checklist de debug:');
    console.error('  - [ ] Você está logado?');
    console.error('  - [ ] A URL tem ?plan=starter (ou outro plano)?');
    console.error('  - [ ] O formulário está visível?');
    console.error('  - [ ] As Edge Functions foram deploiadas?');
    console.error('  - [ ] A página não está em https://www.zentgrowth.com?');
    console.error('\nCopie o erro acima e compartilhe comigo.\n');

    return {
      success: false,
      error: error.message
    };
  }
}

// Executar teste automaticamente
console.log('%c🧪 TESTE DE PAGAMENTO PIX - CHECKOUT VALIDATOR', 'color: #4CAF50; font-size: 16px; font-weight: bold');
console.log('%cPor: Quinn (QA Agent)', 'color: #666; font-size: 12px');
console.log('\n');
console.log('Para iniciar o teste, execute: runPaymentTest()');
console.log('');
