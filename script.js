/**
 * CEI Rita Pinto de Sousa - Varjota, Amontada - CE
 * Script de Pré-Matrículas Escolares 2026 com Geração de PDF Moderno
 * Otimizado para Bio do Instagram & WhatsApp (88) 99654-5870
 */

document.addEventListener('DOMContentLoaded', () => {
  // Configurações Principais
  const WHATSAPP_PHONE = '5588996545870'; // 88 99654-5870 com código do país (55)
  const STORAGE_KEY = 'cei_rita_pinto_matriculas_2026';
  const DRAFT_KEY = 'cei_rita_pinto_draft_form';

  // Elementos do DOM
  const form = document.getElementById('preMatriculaForm');
  const btnSubmit = document.getElementById('btnSubmit');
  const successModal = document.getElementById('successModal');
  const receiptSummary = document.getElementById('receiptSummary');
  const btnModalWhats = document.getElementById('btnModalWhats');
  const btnCopiarDados = document.getElementById('btnCopiarDados');
  const btnNovaInscricao = document.getElementById('btnNovaInscricao');
  const btnBaixarPdfNovamente = document.getElementById('btnBaixarPdfNovamente');
  const btnImprimirPdf = document.getElementById('btnImprimirPdf');
  const pdfFileNameEl = document.getElementById('pdfFileName');

  const historicoModal = document.getElementById('historicoModal');
  const btnVerHistorico = document.getElementById('btnVerHistorico');
  const fecharHistorico = document.getElementById('fecharHistorico');
  const historicoList = document.getElementById('historicoList');
  const btnLimparHistorico = document.getElementById('btnLimparHistorico');
  const btnExportarCsv = document.getElementById('btnExportarCsv');

  const toast = document.getElementById('toast');

  let currentWhatsMessage = '';
  let dadosAtuais = null;

  // =========================================================================
  // MÁSCARAS DE ENTRADA (CPF & TELEFONE)
  // =========================================================================

  // Máscara de CPF: 000.000.000-00
  document.querySelectorAll('.mask-cpf').forEach((input) => {
    input.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 9) {
        v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
      } else if (v.length > 6) {
        v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
      } else if (v.length > 3) {
        v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
      }
      e.target.value = v;
    });
  });

  // Máscara de Telefone: (88) 90000-0000 ou (88) 0000-0000
  document.querySelectorAll('.mask-phone').forEach((input) => {
    input.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').substring(0, 11);
      if (v.length > 10) {
        v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (v.length > 6) {
        v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/(\d{2})(\d{0,5})/, '($1) $2');
      } else if (v.length > 0) {
        v = v.replace(/(\d{0,2})/, '($1');
      }
      e.target.value = v;
    });
  });

  // Salvar rascunho automaticamente enquanto digita
  const formInputs = form.querySelectorAll('input, select');
  formInputs.forEach((input) => {
    input.addEventListener('input', salvarRascunho);
    input.addEventListener('change', salvarRascunho);
  });

  function salvarRascunho() {
    const formData = new FormData(form);
    const draft = {};
    for (let [key, val] of formData.entries()) {
      draft[key] = val;
    }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function restaurarRascunho() {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const draft = JSON.parse(saved);

      Object.keys(draft).forEach((key) => {
        const input = form.elements[key];
        if (!input) return;
        if (input instanceof RadioNodeList) {
          input.value = draft[key];
        } else if (input.type === 'radio') {
          if (input.value === draft[key]) input.checked = true;
        } else {
          input.value = draft[key];
        }
      });
    } catch (err) {
      console.warn('Erro ao restaurar rascunho:', err);
    }
  }

  restaurarRascunho();

  // =========================================================================
  // VALIDAÇÃO & SUBMISSÃO DO FORMULÁRIO COM GERAÇÃO DE PDF
  // =========================================================================

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Limpar estados de erro prévios
    form.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));

    // Validação da Turma (Radio)
    const serieChecked = form.querySelector('input[name="serie"]:checked');
    if (!serieChecked) {
      showToast('⚠️ Por favor, escolha a Série / Turma da criança!');
      const turmaBox = form.querySelector('.turmas-grid');
      turmaBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Campos Obrigatórios
    const requiredFields = [
      { id: 'turno', label: 'Turno de preferência' },
      { id: 'nomeAluno', label: 'Nome completo da criança' },
      { id: 'dataNasc', label: 'Data de nascimento da criança' },
      { id: 'sexoAluno', label: 'Sexo da criança' },
      { id: 'cpfAluno', label: 'CPF da criança' },
      { id: 'rgCertidaoAluno', label: 'RG ou Certidão de Nascimento da criança' },
      { id: 'nomeResponsavel', label: 'Nome completo do responsável' },
      { id: 'parentesco', label: 'Grau de parentesco' },
      { id: 'cpfResponsavel', label: 'CPF do responsável' },
      { id: 'rgResponsavel', label: 'Identidade / RG do responsável' },
      { id: 'telefoneResp', label: 'WhatsApp do responsável' },
      { id: 'comunidadeBairro', label: 'Comunidade ou Bairro' },
      { id: 'ruaNumero', label: 'Rua e Número da residência' },
    ];

    let hasError = false;
    let firstErrorField = null;

    for (let field of requiredFields) {
      const el = document.getElementById(field.id);
      if (!el || !el.value.trim()) {
        el.classList.add('input-error');
        if (!hasError) {
          firstErrorField = el;
          showToast(`⚠️ Preencha o campo: ${field.label}`);
          hasError = true;
        }
      }
    }

    if (hasError && firstErrorField) {
      firstErrorField.focus();
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Feedback de carregamento no botão
    const originalBtnText = btnSubmit.innerHTML;
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `
      <i class="fa-solid fa-spinner fa-spin icon-large"></i>
      <span class="btn-text">
        <strong>GERANDO PDF OFICIAL...</strong>
        <small>Aguarde um instante enquanto preparamos seu documento</small>
      </span>
    `;

    // Obter todos os valores
    const dataNascimento = document.getElementById('dataNasc').value;
    const dataNascFormatada = formatarDataBrasileira(dataNascimento);
    const idadeAprox = calcularIdade(dataNascimento);

    const protocolNum = 'MAT2026-' + Date.now().toString().slice(-6);

    dadosMatricula = {
      id: protocolNum,
      dataEnvio: new Date().toLocaleString('pt-BR'),
      serie: serieChecked.value,
      turno: document.getElementById('turno').value,
      nomeAluno: document.getElementById('nomeAluno').value.trim(),
      dataNascimento: dataNascFormatada,
      idade: idadeAprox,
      sexo: document.getElementById('sexoAluno').value,
      cpfAluno: document.getElementById('cpfAluno').value.trim(),
      rgCertidaoAluno: document.getElementById('rgCertidaoAluno').value.trim(),
      necessidadesSaude: document.getElementById('necessidadesSaude').value.trim() || 'Nenhuma informada',
      nomeResponsavel: document.getElementById('nomeResponsavel').value.trim(),
      parentesco: document.getElementById('parentesco').value,
      cpfResponsavel: document.getElementById('cpfResponsavel').value.trim(),
      rgResponsavel: document.getElementById('rgResponsavel').value.trim(),
      telefoneResp: document.getElementById('telefoneResp').value.trim(),
      telefoneRecado: document.getElementById('telefoneRecado').value.trim() || 'Não informado',
      comunidadeBairro: document.getElementById('comunidadeBairro').value.trim(),
      cidadeUf: document.getElementById('cidadeUf').value,
      ruaNumero: document.getElementById('ruaNumero').value.trim(),
      pontoReferencia: document.getElementById('pontoReferencia').value.trim() || 'Não informado',
    };

    dadosAtuais = dadosMatricula;

    // 1. Preencher a folha do PDF Oficial
    preencherFolhaPdf(dadosMatricula);

    // 2. Gerar e baixar o PDF no celular/computador
    const nomeArquivoPdf = `Pre-Matricula-2026-${sanitizarNome(dadosMatricula.nomeAluno)}.pdf`;
    if (pdfFileNameEl) pdfFileNameEl.textContent = nomeArquivoPdf;

    try {
      await gerarEDownloadPdf(nomeArquivoPdf);
      showToast('📄 Comprovante em PDF baixado com sucesso!');
    } catch (err) {
      console.warn('Erro na geração via html2pdf:', err);
      showToast('⚠️ Use o botão "Visualizar / Imprimir PDF" para salvar o documento.');
    }

    // 3. Montar mensagem oficial para o WhatsApp
    const msgWhatsApp = montarMensagemWhatsApp(dadosMatricula, nomeArquivoPdf);
    currentWhatsMessage = msgWhatsApp;

    // 4. Salvar no histórico local
    salvarNoHistorico(dadosMatricula);

    // 5. Limpar rascunho
    localStorage.removeItem(DRAFT_KEY);

    // 6. Preparar link de envio para o WhatsApp
    const whatsUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(msgWhatsApp)}`;

    // 7. Renderizar dados no Modal
    renderizarComprovanteModal(dadosMatricula);
    btnModalWhats.href = whatsUrl;
    successModal.classList.remove('hidden');

    // Restaurar botão
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = originalBtnText;

    // Redirecionamento amigável para o WhatsApp após 1.6s
    setTimeout(() => {
      window.open(whatsUrl, '_blank');
    }, 1600);
  });

  // =========================================================================
  // PREENCHIMENTO & GERAÇÃO ROBUSTA DO DOCUMENTO PDF (SEM CORTES)
  // =========================================================================

  function preencherFolhaPdf(d) {
    document.getElementById('pdf-proto').textContent = '#' + d.id;
    document.getElementById('pdf-data-emissao').textContent = d.dataEnvio;
    document.getElementById('pdf-turma').textContent = d.serie;
    document.getElementById('pdf-turno').textContent = d.turno;

    document.getElementById('pdf-aluno-nome').textContent = d.nomeAluno;
    document.getElementById('pdf-aluno-nasc').textContent = d.dataNascimento;
    document.getElementById('pdf-aluno-idade').textContent = d.idade;
    document.getElementById('pdf-aluno-sexo').textContent = d.sexo;
    document.getElementById('pdf-aluno-cpf').textContent = d.cpfAluno;
    document.getElementById('pdf-aluno-rg').textContent = d.rgCertidaoAluno;
    document.getElementById('pdf-aluno-saude').textContent = d.necessidadesSaude;

    document.getElementById('pdf-resp-nome').textContent = d.nomeResponsavel;
    document.getElementById('pdf-resp-parentesco').textContent = d.parentesco;
    document.getElementById('pdf-resp-cpf').textContent = d.cpfResponsavel;
    document.getElementById('pdf-resp-rg').textContent = d.rgResponsavel;
    document.getElementById('pdf-resp-whats').textContent = d.telefoneResp;
    document.getElementById('pdf-resp-recado').textContent = d.telefoneRecado;

    document.getElementById('pdf-end-bairro').textContent = d.comunidadeBairro;
    document.getElementById('pdf-end-cidade').textContent = d.cidadeUf;
    document.getElementById('pdf-end-rua').textContent = d.ruaNumero;
    document.getElementById('pdf-end-ref').textContent = d.pontoReferencia;
  }

  async function gerarEDownloadPdf(nomeArquivo) {
    const wrapper = document.getElementById('pdfWrapper');
    const elemento = document.getElementById('pdf-document');

    // Salvar estilos e scroll original
    const scrollOrigX = window.scrollX || window.pageXOffset || 0;
    const scrollOrigY = window.scrollY || window.pageYOffset || 0;
    const originalBodyJustify = document.body.style.justifyContent;

    // Desativar justify-content center do body durante o print para NUNCA empurrar para coordenadas negativas
    document.body.style.justifyContent = 'flex-start';

    // Mover wrapper diretamente para o body para desvincular de qualquer layout
    document.body.appendChild(wrapper);

    // Posicionamento absoluto fixo em (0, 0)
    wrapper.style.cssText = `
      position: fixed !important;
      top: 0px !important;
      left: 0px !important;
      margin: 0px !important;
      padding: 0px !important;
      width: 780px !important;
      min-width: 780px !important;
      max-width: 780px !important;
      transform: none !important;
      align-self: flex-start !important;
      z-index: 5000 !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      background: #ffffff !important;
    `;

    window.scrollTo(0, 0);

    // Aguardar o navegador recalcular layout
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      if (typeof html2pdf !== 'undefined') {
        const opt = {
          margin: [8, 8, 8, 8], // 8mm de margem perfeitamente uniforme (evita cortes no topo, esquerda, direita e base)
          filename: nomeArquivo,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            scrollX: 0,
            scrollY: 0,
            x: 0,
            y: 0,
            width: 780,
            windowWidth: 780
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        await html2pdf().set(opt).from(elemento).save();
      } else {
        window.print();
      }
    } finally {
      // Restaurar tudo ao estado original
      wrapper.style.cssText = `
        position: fixed !important;
        left: -99999px !important;
        top: 0px !important;
        width: 780px !important;
        display: none !important;
        visibility: hidden !important;
      `;
      document.body.style.justifyContent = originalBodyJustify;
      window.scrollTo(scrollOrigX, scrollOrigY);
    }
  }

  btnBaixarPdfNovamente.addEventListener('click', async () => {
    if (!dadosAtuais) return;
    const nomeArquivoPdf = `Pre-Matricula-2026-${sanitizarNome(dadosAtuais.nomeAluno)}.pdf`;
    showToast('Baixando PDF novamente...');
    await gerarEDownloadPdf(nomeArquivoPdf);
  });

  if (btnImprimirPdf) {
    btnImprimirPdf.addEventListener('click', () => {
      window.print();
    });
  }

  // =========================================================================
  // FORMATAÇÃO DA MENSAGEM WHATSAPP
  // =========================================================================

  function montarMensagemWhatsApp(d, nomePdf) {
    return `🏫 *PRÉ-MATRÍCULA 2026*
*CEI RITA PINTO DE SOUSA*
📍 Varjota • Amontada - CE
Protocolo: #${d.id}
━━━━━━━━━━━━━━━━━━━━━━━

Olá! Acabei de gerar o *Comprovante Oficial de Pré-Matrícula em PDF* pelo site.

🎒 *Turma:* ${d.serie}
⏰ *Turno:* ${d.turno}
👶 *Aluno(a):* ${d.nomeAluno} (${d.idade})
👨‍👩‍👧 *Responsável:* ${d.nomeResponsavel} (${d.parentesco})
📞 *WhatsApp:* ${d.telefoneResp}
🏠 *Endereço:* ${d.comunidadeBairro}, ${d.ruaNumero} - Amontada/CE

📎 *Estou anexando aqui no WhatsApp o PDF oficial:*
📄 _${nomePdf}_

━━━━━━━━━━━━━━━━━━━━━━━
📅 *Data:* ${d.dataEnvio}`;
  }

  function renderizarComprovanteModal(d) {
    receiptSummary.innerHTML = `
      <div class="receipt-item">
        <span class="receipt-label">Protocolo:</span>
        <span class="receipt-val">#${d.id}</span>
      </div>
      <div class="receipt-item">
        <span class="receipt-label">Turma:</span>
        <span class="receipt-val">${d.serie} (${d.turno})</span>
      </div>
      <div class="receipt-item">
        <span class="receipt-label">Aluno(a):</span>
        <span class="receipt-val">${d.nomeAluno}</span>
      </div>
      <div class="receipt-item">
        <span class="receipt-label">CPF Aluno:</span>
        <span class="receipt-val">${d.cpfAluno}</span>
      </div>
      <div class="receipt-item">
        <span class="receipt-label">Responsável:</span>
        <span class="receipt-val">${d.nomeResponsavel} (${d.parentesco})</span>
      </div>
      <div class="receipt-item">
        <span class="receipt-label">Localidade:</span>
        <span class="receipt-val">${d.comunidadeBairro}, Amontada-CE</span>
      </div>
    `;
  }

  // =========================================================================
  // AÇÕES DO MODAL
  // =========================================================================

  btnCopiarDados.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(currentWhatsMessage);
      } else {
        const tempText = document.createElement('textarea');
        tempText.value = currentWhatsMessage;
        document.body.appendChild(tempText);
        tempText.select();
        document.execCommand('copy');
        document.body.removeChild(tempText);
      }
      showToast('📋 Resumo copiado com sucesso! Cole no WhatsApp.');
    } catch (err) {
      showToast('Erro ao copiar dados automaticamente.');
    }
  });

  btnNovaInscricao.addEventListener('click', () => {
    form.reset();
    localStorage.removeItem(DRAFT_KEY);
    successModal.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Formulário pronto para nova pré-matrícula.');
  });

  // =========================================================================
  // HISTÓRICO LOCAL & BACKUP DA SECRETARIA
  // =========================================================================

  function salvarNoHistorico(registro) {
    let lista = obterHistorico();
    lista.unshift(registro);
    if (lista.length > 50) lista = lista.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }

  function obterHistorico() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function renderizarHistorico() {
    const lista = obterHistorico();
    if (lista.length === 0) {
      historicoList.innerHTML = `
        <div style="text-align: center; padding: 24px 10px; color: #94a3b8;">
          <i class="fa-regular fa-folder" style="font-size: 2rem; margin-bottom: 8px; display: block;"></i>
          Nenhum cadastro realizado neste aparelho ainda.
        </div>
      `;
      return;
    }

    historicoList.innerHTML = lista
      .map(
        (item) => `
      <div class="historico-card">
        <div class="historico-card-top">
          <strong>${escapeHtml(item.nomeAluno)}</strong>
          <span>${item.dataEnvio}</span>
        </div>
        <div style="color: #475569; font-size: 0.78rem;">
          <div>📚 <strong>Turma:</strong> ${escapeHtml(item.serie)} - ${escapeHtml(item.turno)}</div>
          <div>👨‍👩‍👧 <strong>Resp.:</strong> ${escapeHtml(item.nomeResponsavel)} (${escapeHtml(item.telefoneResp)})</div>
          <div>📍 <strong>Endereço:</strong> ${escapeHtml(item.comunidadeBairro)}, ${escapeHtml(item.ruaNumero)}</div>
        </div>
      </div>
    `
      )
      .join('');
  }

  btnVerHistorico.addEventListener('click', () => {
    renderizarHistorico();
    historicoModal.classList.remove('hidden');
  });

  fecharHistorico.addEventListener('click', () => {
    historicoModal.classList.add('hidden');
  });

  window.addEventListener('click', (e) => {
    if (e.target === historicoModal) historicoModal.classList.add('hidden');
    if (e.target === successModal) successModal.classList.add('hidden');
  });

  btnLimparHistorico.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar todos os registros salvos neste aparelho?')) {
      localStorage.removeItem(STORAGE_KEY);
      renderizarHistorico();
      showToast('Histórico limpo com sucesso.');
    }
  });

  // Exportar registros em formato CSV compatível com Excel
  btnExportarCsv.addEventListener('click', () => {
    const lista = obterHistorico();
    if (lista.length === 0) {
      showToast('Nenhum cadastro para exportar.');
      return;
    }

    const headers = [
      'Protocolo',
      'Data Envio',
      'Turma/Série',
      'Turno',
      'Nome do Aluno',
      'Data Nasc.',
      'Idade Aprox.',
      'Sexo',
      'CPF Aluno',
      'RG/Certidão Aluno',
      'Saúde/Alergias',
      'Responsável',
      'Parentesco',
      'CPF Resp.',
      'RG Resp.',
      'WhatsApp',
      'Tel. Recado',
      'Bairro/Comunidade',
      'Rua/Nº',
      'Ponto de Ref.',
      'Cidade',
    ];

    const rows = lista.map((i) => [
      i.id,
      i.dataEnvio,
      i.serie,
      i.turno,
      i.nomeAluno,
      i.dataNascimento,
      i.idade,
      i.sexo,
      i.cpfAluno,
      i.rgCertidaoAluno,
      i.necessidadesSaude,
      i.nomeResponsavel,
      i.parentesco,
      i.cpfResponsavel,
      i.rgResponsavel,
      i.telefoneResp,
      i.telefoneRecado,
      i.comunidadeBairro,
      i.ruaNumero,
      i.pontoReferencia,
      i.cidadeUf,
    ]);

    let csvContent = '\uFEFF';
    csvContent += headers.map((h) => `"${h}"`).join(';') + '\r\n';

    rows.forEach((row) => {
      csvContent += row.map((val) => `"${(val || '').toString().replace(/"/g, '""')}"`).join(';') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pre_Matriculas_CEI_Rita_Pinto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Planilha Excel/CSV gerada com sucesso!');
  });

  // =========================================================================
  // UTILITÁRIOS (DATA, IDADE ROBUSTA, TOAST)
  // =========================================================================

  function formatarDataBrasileira(dataIso) {
    if (!dataIso) return '';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataIso;
  }

  function calcularIdade(dataIso) {
    if (!dataIso) return 'A conferir';
    const partes = dataIso.split('-');
    if (partes.length === 3) {
      const ano = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1;
      const dia = parseInt(partes[2], 10);

      if (isNaN(ano) || isNaN(mes) || isNaN(dia) || ano < 1990 || ano > 2030) {
        return 'A conferir';
      }

      const hoje = new Date();
      const nasc = new Date(ano, mes, dia);

      let anos = hoje.getFullYear() - nasc.getFullYear();
      const m = hoje.getMonth() - nasc.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        anos--;
      }

      if (anos < 0 || anos > 20 || isNaN(anos)) {
        return 'A conferir';
      }

      return anos === 1 ? '1 ano' : `${anos} anos`;
    }
    return 'A conferir';
  }

  function sanitizarNome(nome) {
    if (!nome) return 'Aluno';
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_');
  }

  function showToast(mensagem) {
    toast.textContent = mensagem;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
