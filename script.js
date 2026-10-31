/**
 * CEI Rita Pinto de Sousa - Varjota, Amontada - CE
 * Script de Pré-Matrículas Escolares 2026
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

  const historicoModal = document.getElementById('historicoModal');
  const btnVerHistorico = document.getElementById('btnVerHistorico');
  const fecharHistorico = document.getElementById('fecharHistorico');
  const historicoList = document.getElementById('historicoList');
  const btnLimparHistorico = document.getElementById('btnLimparHistorico');
  const btnExportarCsv = document.getElementById('btnExportarCsv');

  const toast = document.getElementById('toast');

  let currentWhatsMessage = '';

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
  // VALIDAÇÃO & SUBMISSÃO DO FORMULÁRIO
  // =========================================================================

  form.addEventListener('submit', (e) => {
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

    // Obter todos os valores
    const dataNascimento = document.getElementById('dataNasc').value;
    const dataNascFormatada = formatarDataBrasileira(dataNascimento);
    const idadeAprox = calcularIdade(dataNascimento);

    const dadosMatricula = {
      id: 'MAT-' + Date.now().toString().slice(-6),
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

    // Montar mensagem limpa e organizada para o WhatsApp da escola
    const msgWhatsApp = montarMensagemWhatsApp(dadosMatricula);
    currentWhatsMessage = msgWhatsApp;

    // Salvar no histórico local
    salvarNoHistorico(dadosMatricula);

    // Limpar rascunho
    localStorage.removeItem(DRAFT_KEY);

    // Preparar link de envio
    const whatsUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(msgWhatsApp)}`;

    // Exibir Modal de Confirmação com Comprovante
    renderizarComprovanteModal(dadosMatricula);
    btnModalWhats.href = whatsUrl;
    successModal.classList.remove('hidden');

    // Tentar redirecionar automaticamente para o WhatsApp
    setTimeout(() => {
      window.location.href = whatsUrl;
    }, 600);
  });

  // =========================================================================
  // FORMATAÇÃO DA MENSAGEM WHATSAPP
  // =========================================================================

  function montarMensagemWhatsApp(d) {
    return `🏫 *PRÉ-MATRÍCULA 2026*
*CEI RITA PINTO DE SOUSA*
📍 Varjota • Amontada - CE
Protocolo: #${d.id}
━━━━━━━━━━━━━━━━━━━━━━━

🎒 *TURMA / SÉRIE:* ${d.serie}
⏰ *TURNO:* ${d.turno}

👶 *DADOS DO ALUNO(A):*
• *Nome:* ${d.nomeAluno}
• *Nascimento:* ${d.dataNascimento} (${d.idade})
• *Sexo:* ${d.sexo}
• *CPF do Aluno:* ${d.cpfAluno}
• *RG / Certidão:* ${d.rgCertidaoAluno}
• *Saúde / Cuidados:* ${d.necessidadesSaude}

👨‍👩‍👧 *DADOS DO RESPONSÁVEL:*
• *Responsável:* ${d.nomeResponsavel}
• *Parentesco:* ${d.parentesco}
• *CPF:* ${d.cpfResponsavel}
• *RG:* ${d.rgResponsavel}
• *WhatsApp:* ${d.telefoneResp}
• *Telefone Recado:* ${d.telefoneRecado}

🏠 *ENDEREÇO RESIDENCIAL:*
• *Comunidade/Bairro:* ${d.comunidadeBairro}
• *Rua / Nº:* ${d.ruaNumero}
• *Ponto de Ref.:* ${d.pontoReferencia}
• *Município:* ${d.cidadeUf}
━━━━━━━━━━━━━━━━━━━━━━━
📅 *Enviado via Link da Bio em:* ${d.dataEnvio}`;
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
        <span class="receipt-label">WhatsApp Contato:</span>
        <span class="receipt-val">${d.telefoneResp}</span>
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
        // Fallback para navegadores antigos
        const tempText = document.createElement('textarea');
        tempText.value = currentWhatsMessage;
        document.body.appendChild(tempText);
        tempText.select();
        document.execCommand('copy');
        document.body.removeChild(tempText);
      }
      showToast('📋 Mensagem copiada com sucesso! Cole no WhatsApp.');
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
    // Limita aos últimos 50 cadastros neste aparelho
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

  // Fechar ao clicar fora do card
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

    let csvContent = '\uFEFF'; // BOM para o Excel abrir com acentuação correta em UTF-8
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
  // UTILITÁRIOS (DATA, IDADE, TOAST)
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
    if (!dataIso) return '';
    const hoje = new Date();
    const nasc = new Date(dataIso);
    let anos = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      anos--;
    }
    return anos > 0 ? `${anos} anos` : `${anos} ano`;
  }

  function showToast(mensagem) {
    toast.textContent = mensagem;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3800);
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

