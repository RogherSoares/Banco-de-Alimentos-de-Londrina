document.addEventListener('DOMContentLoaded', () => {
  const filtro = document.getElementById('filtroDoador');
  const tbody = document.getElementById('corpoTabelaDoadores');
  const feedback = document.getElementById('feedback');

  // modal / form edição
  const modalEl = document.getElementById('modalEditarDoador');
  const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;
  const formEditar = document.getElementById('formEditarDoador');
  const modalFeedback = document.getElementById('modalFeedback');

  const inputs = {
    id: document.getElementById('editDoadorId'),
    nome: document.getElementById('editNome'),
    telefone: document.getElementById('editTelefone'),
    email: document.getElementById('editEmail'),
    endereco: document.getElementById('editEndereco'),
    obs: document.getElementById('editObs')
  };

  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let all = [];

  const render = list => {
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!list || list.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum doador encontrado.</td></tr>';
      return;
    }
    list.forEach(d => {
      const tr = document.createElement('tr');
      const endereco = d.endereco ?? d['endereço'] ?? '—';
      tr.innerHTML = `
        <td>${escape(d.nome)}</td>
        <td>${escape(d.telefone)}</td>
        <td>${escape(d.email)}</td>
        <td>${escape(endereco)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${d.id}"><i class="bi bi-pencil"></i> Editar</button>
        </td>`;
      tbody.appendChild(tr);
    });
  };

  const load = async (search = '') => {
    if (!tbody) return;
    feedback && (feedback.innerHTML = '<div class="small text-muted">Carregando...</div>');
    try {
      const url = '/api/doadores' + (search ? '?search=' + encodeURIComponent(search) : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error(await res.text());
      all = await res.json();
      render(all);
      feedback && (feedback.innerHTML = '');
    } catch (err) {
      console.error('Erro carregar doadores', err);
      feedback && (feedback.innerHTML = `<div class="alert alert-danger small">Erro ao carregar doadores</div>`);
    }
  };

  const openEdit = d => {
    if (!formEditar || !bsModal) return;
    inputs.id.value = d.id;
    inputs.nome.value = d.nome ?? '';
    inputs.telefone.value = d.telefone ?? '';
    inputs.email.value = d.email ?? '';
    inputs.endereco.value = d.endereco ?? '';
    inputs.obs.value = d.observacoes ?? d.obs ?? '';
    modalFeedback && (modalFeedback.innerHTML = '');
    bsModal.show();
  };

  // Delegação para botão editar
  tbody && tbody.addEventListener('click', e => {
    const btn = e.target.closest('.btn-edit');
    if (!btn) return;
    const id = btn.dataset.id;
    const d = all.find(x => String(x.id) === String(id));
    if (d) openEdit(d);
  });

  // Submit edição (PUT)
  if (formEditar) {
    formEditar.addEventListener('submit', async e => {
      e.preventDefault();
      modalFeedback && (modalFeedback.innerHTML = '<div class="small text-muted">Salvando...</div>');
      const id = inputs.id.value;
      const payload = {
        nome: inputs.nome.value.trim(),
        telefone: inputs.telefone.value.trim(),
        email: inputs.email.value.trim(),
        endereco: inputs.endereco.value.trim(),
        observacoes: inputs.obs.value.trim()
      };
      try {
        const res = await fetch('/api/doadores/' + encodeURIComponent(id), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let json;
        try { json = text ? JSON.parse(text) : null; } catch { json = text; }
        if (!res.ok) throw new Error((json && json.error) ? json.error : `Status ${res.status}`);
        modalFeedback && (modalFeedback.innerHTML = `<div class="alert alert-success small mb-0">Atualizado.</div>`);
        await load(filtro ? filtro.value.trim() : '');
        setTimeout(() => bsModal.hide(), 600);
      } catch (err) {
        console.error('Erro atualizar doador', err);
        modalFeedback && (modalFeedback.innerHTML = `<div class="alert alert-danger small mb-0">Erro ao salvar: ${escape(err.message)}</div>`);
      }
    });
  }

  // Debounce util
  const debounce = (fn, wait = 200) => {
    let t = null;
    return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), wait); };
  };

  filtro && filtro.addEventListener('input', debounce(e => load(e.target.value.trim()), 250));

  // sidebar toggle (se existir)
  const btnToggle = document.getElementById('btnSidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const btnClose = document.getElementById('btnSidebarClose');
  if (btnToggle) btnToggle.addEventListener('click', () => sidebar && sidebar.classList.toggle('show'));
  if (btnClose) btnClose.addEventListener('click', () => sidebar && sidebar.classList.remove('show'));

  // Initial load
  load();
});