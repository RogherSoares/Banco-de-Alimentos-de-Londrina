document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('corpoTabelaEstoque');
  if (!tbody) return;

  const inputDescricao = document.getElementById('filtroItem'); // existente no HTML
  const selectVenc = document.getElementById('filtroValidade'); // existente no HTML
  // botão de filtro na página
  const btnFiltrar = document.querySelector('.card .btn.btn-primary');

  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleDateString('pt-BR');
  };

  const daysUntil = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    const now = new Date();
    dt.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    return Math.ceil((dt - now) / (1000*60*60*24));
  };

  const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));

  const render = (items) => {
    tbody.innerHTML = '';
    if (!items || items.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nenhum item no estoque.</td></tr>';
      return;
    }

    items.forEach(item => {
      const tr = document.createElement('tr');
      const qtd = Number(item.quantidade_total) || 0;
      const validade = item.proximo_vencimento ? item.proximo_vencimento.split('T')[0] : null;
      const dias = daysUntil(validade);

      if (dias !== null) {
        if (dias < 0) tr.classList.add('table-danger');
        else if (dias <= 7) tr.classList.add('table-warning');
      }

      const proxVencText = validade ? `${formatDate(validade)}${dias !== null ? (dias < 0 ? ' (Vencido)' : dias === 0 ? ' (Vence hoje)' : ` (Vence em ${dias} dias)`) : ''}` : '—';

      tr.innerHTML = `
        <td>${escapeHtml(item.descricao)}</td>
        <td>${qtd}</td>
        <td>${escapeHtml(item.unidade || 'un')}</td>
        <td>${proxVencText}</td>
        <td><button class="btn btn-sm btn-outline-primary btn-ver-lotes" data-descricao="${escapeHtml(item.descricao)}">Ver Lotes</button></td>
      `;
      tbody.appendChild(tr);
    });
  };

  // monta query param 'venc' de acordo com o select de validade
  const mapVencimento = (val) => {
    if (!val) return null;
    switch(val) {
      case 'vencido': return 'expired';
      case 'vence_hoje': return '0';
      case 'vence_7d': return '7';
      case 'vence_30d': return '30';
      default: return null;
    }
  };

  // busca do backend aplicando filtros
  const load = async () => {
    try {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
      const params = new URLSearchParams();
      const desc = (inputDescricao?.value || '').trim();
      const venc = mapVencimento(selectVenc?.value || '');

      if (desc) params.set('descricao', desc);
      if (venc) params.set('venc', venc);

      const url = '/api/estoque' + (params.toString() ? ('?' + params.toString()) : '');
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        console.error('Erro ao carregar /api/estoque:', res.status, text);
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Erro ao carregar estoque</td></tr>`;
        return;
      }
      const data = await res.json();
      render(data);
    } catch (err) {
      console.error('Erro fetch /api/estoque:', err);
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar estoque</td></tr>';
    }
  };

  // debounce
  const debounce = (fn, wait = 200) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const debouncedLoad = debounce(load, 200);

  // eventos: pesquisa por texto (input) e seleção de validade (change) e botão filtrar
  inputDescricao?.addEventListener('input', debouncedLoad);
  selectVenc?.addEventListener('change', load);
  if (btnFiltrar) btnFiltrar.addEventListener('click', (e) => { e.preventDefault(); load(); });

  // delegação para ver lotes (pode abrir modal ou redirecionar)
  tbody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-ver-lotes');
    if (!btn) return;
    const descricao = btn.dataset.descricao;
    // solicita lotes ao backend e exibe (aqui uso alert; você pode abrir modal)
    fetch('/api/estoque/lotes?descricao=' + encodeURIComponent(descricao))
      .then(r => r.ok ? r.json() : r.text().then(t=>{throw new Error(t)}))
      .then(rows => {
        if (!rows || !rows.length) return alert('Nenhum lote encontrado para: ' + descricao);
        const list = rows.map(r => `${r.descricao} — ${r.quantidade} ${r.unidade||''} — validade: ${r.validade ? new Date(r.validade).toLocaleDateString() : '—'}`).join('\n');
        alert('Lotes:\n' + list);
      })
      .catch(err => {
        console.error('Erro ao buscar lotes:', err);
        alert('Erro ao buscar lotes.');
      });
  });

  // carregamento inicial
  load();
});