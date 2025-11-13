document.addEventListener('DOMContentLoaded', () => {
    const filtro = document.getElementById('filtroInstituicao');
    const tbody = document.getElementById('corpoTabelaInstituicoes');
    const feedback = document.getElementById('feedback');

    const modalEl = document.getElementById('modalEditarInstituicao');
    const bsModal = modalEl ? new bootstrap.Modal(modalEl) : null;
    const formEditar = document.getElementById('formEditarInstituicao');
    const modalFeedback = document.getElementById('modalFeedback');

    const inputs = {
        id: document.getElementById('editInstituicaoId'),
        nome: document.getElementById('editNome'),
        contato: document.getElementById('editContato'),
        telefone: document.getElementById('editTelefone'),
        email: document.getElementById('editEmail'),
        endereco: document.getElementById('editEndereco'),
        obs: document.getElementById('editObs')
    };

    const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    let all = [];

    const render = list => {
      if (!tbody) return;
      tbody.innerHTML = '';
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhuma instituição encontrada.</td></tr>';
        return;
      }
      list.forEach(item => {
        const tr = document.createElement('tr');
        // mostrar exclusivamente razao_social na primeira coluna
        // e responsavel na segunda; usar fallback '—' quando ausente
        tr.innerHTML = `
        <td>${escape(item.razao_social || '—')}</td>
        <td>${escape(item.responsavel || '—')}</td>
        <td>${escape(item.contato || '—')}</td>
        <td>${escape(item.telefone || '—')}</td>
        <td>${escape(item.email || '—')}</td>
        <td>${escape(item.endereco || '—')}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${item.id}"><i class="bi bi-pencil"></i> Editar</button>
        </td>`;
        tbody.appendChild(tr);
      });
    };

    const load = async (search = '') => {
        feedback && (feedback.innerHTML = '<div class="small text-muted">Carregando...</div>');
        try {
            const url = '/api/instituicoes' + (search ? '?search=' + encodeURIComponent(search) : '');
            const res = await fetch(url);
            if (!res.ok) throw new Error(await res.text());
            all = await res.json();
            render(all);
            feedback && (feedback.innerHTML = '');
        } catch (err) {
            console.error('Erro carregar instituições', err);
            feedback && (feedback.innerHTML = `<div class="alert alert-danger small">Erro ao carregar instituições</div>`);
        }
    };

    const openEdit = data => {
        if (!formEditar || !bsModal) return;
        inputs.id.value = data.id;
        inputs.nome.value = data.nome || '';
        inputs.contato.value = data.contato || '';
        inputs.telefone.value = data.telefone || '';
        inputs.email.value = data.email || '';
        inputs.endereco.value = data.endereco || '';
        inputs.obs.value = data.observacoes || '';
        modalFeedback && (modalFeedback.innerHTML = '');
        bsModal.show();
    };

    tbody && tbody.addEventListener('click', e => {
        const btn = e.target.closest('.btn-edit');
        if (!btn) return;
        const id = btn.dataset.id;
        const data = all.find(x => String(x.id) === String(id));
        if (data) openEdit(data);
    });

    if (formEditar) {
        formEditar.addEventListener('submit', async e => {
            e.preventDefault();
            modalFeedback && (modalFeedback.innerHTML = '<div class="small text-muted">Salvando...</div>');
            const id = inputs.id.value;
            const payload = {
                nome: inputs.nome.value.trim(),
                contato: inputs.contato.value.trim(),
                telefone: inputs.telefone.value.trim(),
                email: inputs.email.value.trim(),
                endereco: inputs.endereco.value.trim(),
                observacoes: inputs.obs.value.trim()
            };
            try {
                const res = await fetch('/api/instituicoes/' + encodeURIComponent(id), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const text = await res.text();
                let json;
                try { json = text ? JSON.parse(text) : null } catch { json = text }
                if (!res.ok) throw new Error((json && json.error) ? json.error : `Status ${res.status}`);
                modalFeedback && (modalFeedback.innerHTML = '<div class="alert alert-success small mb-0">Atualizado.</div>');
                await load(filtro ? filtro.value.trim() : '');
                setTimeout(() => bsModal.hide(), 600);
            } catch (err) {
                console.error('Erro salvar instituição', err);
                modalFeedback && (modalFeedback.innerHTML = `<div class="alert alert-danger small mb-0">Erro: ${escape(err.message)}</div>`);
            }
        });
    }

    const debounce = (fn, wait = 250) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), wait); } };
    filtro && filtro.addEventListener('input', debounce(e => load(e.target.value.trim()), 250));

    // sidebar toggle compatibility
    const btnToggle = document.getElementById('btnSidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const btnClose = document.getElementById('btnSidebarClose');
    if (btnToggle) btnToggle.addEventListener('click', () => sidebar && sidebar.classList.toggle('show'));
    if (btnClose) btnClose.addEventListener('click', () => sidebar && sidebar.classList.remove('show'));

    load();
});