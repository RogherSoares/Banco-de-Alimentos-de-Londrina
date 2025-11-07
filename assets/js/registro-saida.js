document.addEventListener('DOMContentLoaded', () => {
    const instituicaoSelect = document.getElementById('instituicaoSelect');
    const itensContainer = document.getElementById('itensContainer');
    const btnAddItem = document.getElementById('btnAddItem');
    const form = document.getElementById('formSaida');
    const feedback = document.getElementById('feedback');
    const dataSaida = document.getElementById('dataSaida');

    // set today as default
    if (dataSaida && !dataSaida.value) dataSaida.valueAsDate = new Date();

    const createItemRow = (data = {}) => {
        const id = 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        const div = document.createElement('div');
        div.className = 'row g-2 align-items-end mb-2 item-row';
        div.dataset.rowId = id;
        div.innerHTML = `
      <div class="col-md-5">
        <label class="form-label">Descrição</label>
        <input type="text" class="form-control descricao" value="${(data.descricao || '')}" required>
      </div>
      <div class="col-md-2">
        <label class="form-label">Quantidade</label>
        <input type="number" min="0.01" step="0.01" class="form-control quantidade" value="${(data.quantidade || '')} " required>
      </div>
      <div class="col-md-2">
        <label class="form-label">Unidade</label>
        <input type="text" class="form-control unidade" value="${(data.unidade || 'un')}">
      </div>
      <div class="col-md-2">
        <button type="button" class="btn btn-outline-secondary btn-ver-estoque w-100">Ver Estoque</button>
      </div>
      <div class="col-md-1">
        <button type="button" class="btn btn-outline-danger btn-remove" title="Remover">&times;</button>
      </div>
    `;
        // handlers
        div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
        div.querySelector('.btn-ver-estoque').addEventListener('click', async () => {
            const desc = div.querySelector('.descricao').value.trim();
            if (!desc) return alert('Informe a descrição para ver lotes.');
            try {
                const url = new URL('/api/estoque/lotes', window.location.origin);
                url.searchParams.set('descricao', desc);
                const res = await fetch(url.toString());
                if (!res.ok) {
                    const t = await res.text();
                    return alert('Erro ao carregar lotes: ' + t);
                }
                const rows = await res.json();
                if (!rows.length) return alert('Nenhum lote em estoque para: ' + desc);
                // show simple list
                const list = rows.map(r => `${r.descricao} — ${r.quantidade} ${r.unidade ?? ''} — validade: ${r.validade ? new Date(r.validade).toLocaleDateString() : '—'}`).join('\n');
                alert('Lotes:\n' + list);
            } catch (err) {
                console.error('Erro ver estoque:', err);
                alert('Erro ao buscar lotes.');
            }
        });
        itensContainer.appendChild(div);
        return div;
    };

    // load institutions
    const loadInstituicoes = async () => {
        try {
            const res = await fetch('/api/instituicoes');
            if (!res.ok) throw new Error(await res.text());
            const list = await res.json();
            instituicaoSelect.innerHTML = `<option value="">Selecione...</option>` +
                list.map(i => `<option value="${i.id}">${escapeHtml(i.nome)}</option>`).join('');
        } catch (err) {
            console.error('Erro carregar instituicoes:', err);
            instituicaoSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
        }
    };

    btnAddItem.addEventListener('click', () => createItemRow());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.innerHTML = '';
        const id_instituicao = instituicaoSelect.value || null;
        const data_saida = document.getElementById('dataSaida').value || null;
        const observacoes = document.getElementById('obsSaida').value || null;

        const itens = Array.from(itensContainer.querySelectorAll('.item-row')).map(row => {
            return {
                descricao: row.querySelector('.descricao').value.trim(),
                quantidade: Number(row.querySelector('.quantidade').value),
                unidade: row.querySelector('.unidade').value.trim() || null
            };
        }).filter(it => it.descricao && it.quantidade > 0);

        if (!itens.length) {
            return alert('Adicione pelo menos um item com quantidade válida.');
        }

        try {
            const btn = document.getElementById('btnSubmitSaida');
            if (btn) btn.disabled = true;
            const res = await fetch('/api/saidas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_instituicao: id_instituicao ? Number(id_instituicao) : null, data_saida, observacoes, itens })
            });
            const text = await res.text();
            let body;
            try { body = JSON.parse(text); } catch { body = text; }
            if (!res.ok) throw new Error((body && body.error) || text || `Status ${res.status}`);
            feedback.innerHTML = `<div class="alert alert-success">Saída registrada (ID: ${body.id_saida ?? body.id_saida ?? body.id ?? body.id_saida}).</div>`;
            // reset form
            itensContainer.innerHTML = '';
            createItemRow(); // add empty row
            form.reset();
            loadInstituicoes();
        } catch (err) {
            console.error('Erro registrar saída:', err);
            feedback.innerHTML = `<div class="alert alert-danger">Erro: ${err.message || err}</div>`;
        } finally {
            const btn = document.getElementById('btnSubmitSaida');
            if (btn) btn.disabled = false;
        }
    });

    // init
    loadInstituicoes();
    createItemRow();
});

// helper
function escapeHtml(s) { return String(s || '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }