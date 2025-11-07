document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('start') || '';
    const end = params.get('end') || '';
    const periodText = document.getElementById('periodText');
    if (periodText) periodText.textContent = start || end ? `Período: ${start || 'início'} — ${end || 'fim'}` : 'Período: Todos os registros';

    const container = document.getElementById('resultContainer');
    const exportBtn = document.getElementById('btnExportCsvPage');

    const fetchData = async () => {
        const url = new URL('/api/relatorios/prestacao_detalhada', window.location.origin);
        if (start) url.searchParams.set('start', start);
        if (end) url.searchParams.set('end', end);
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(await res.text());
        return res.json();
    };

    const groupBySaida = (rows) => {
        const map = new Map();
        rows.forEach(r => {
            const sid = r.id_saida;
            if (!map.has(sid)) {
                map.set(sid, {
                    id_saida: sid,
                    data_saida: r.data_saida,
                    observacoes: r.observacoes,
                    instituicao_id: r.instituicao_id,
                    instituicao: r.instituicao,
                    itens: []
                });
            }
            map.get(sid).itens.push({
                item_id: r.item_id,
                descricao: r.descricao,
                quantidade: r.quantidade,
                unidade: r.unidade,
                validade: r.validade
            });
        });
        return Array.from(map.values());
    };

    const render = (saidas) => {
        if (!container) return;
        container.innerHTML = '';
        if (!saidas || saidas.length === 0) {
            container.innerHTML = '<div class="alert alert-info">Nenhuma distribuição encontrada no período.</div>';
            return;
        }

        saidas.forEach(s => {
            const card = document.createElement('div');
            card.className = 'card mb-3 shadow-sm';
            const hdrDate = s.data_saida ? new Date(s.data_saida).toLocaleDateString('pt-BR') : '';
            card.innerHTML = `
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div>
              <h5 class="card-title mb-1">${s.instituicao ?? 'Instituição desconhecida'}</h5>
              <div class="text-muted">Data: ${hdrDate}${s.instituicao_id ? ` — ID: ${s.instituicao_id}` : ''}</div>
              <div class="text-muted small">Observações: ${s.observacoes ?? '—'}</div>
            </div>
            <div class="text-end">
              <span class="badge bg-secondary">Saída #${s.id_saida}</span>
            </div>
          </div>
          <div class="table-responsive mt-3">
            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light"><tr><th>Descrição</th><th>Quantidade</th><th>Unidade</th><th>Validade</th></tr></thead>
              <tbody>
                ${s.itens.map(it => `<tr>
                  <td>${escapeHtml(it.descricao)}</td>
                  <td>${it.quantidade}</td>
                  <td>${it.unidade ?? ''}</td>
                  <td>${it.validade ? new Date(it.validade).toLocaleDateString('pt-BR') : ''}</td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
            container.appendChild(card);
        });
    };

    const escapeHtml = (str) => String(str ?? '').replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));

    const toCsv = (saidas) => {
        // flatten rows: saída, data, instituicao, item descricao, quantidade, unidade, validade
        const header = ['saida_id', 'data_saida', 'instituicao', 'descricao', 'quantidade', 'unidade', 'validade'];
        const lines = [header.join(',')];
        saidas.forEach(s => {
            s.itens.forEach(it => {
                const row = [
                    s.id_saida,
                    s.data_saida ?? '',
                    s.instituicao ?? '',
                    (it.descricao ?? '').replace(/"/g, '""'),
                    it.quantidade ?? '',
                    it.unidade ?? '',
                    it.validade ?? ''
                ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
                lines.push(row);
            });
        });
        return lines.join('\r\n');
    };

    fetchData().then(rows => {
        const grouped = groupBySaida(rows || []);
        render(grouped);
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (!grouped || grouped.length === 0) return alert('Nenhum registro para exportar.');
                const csv = toCsv(grouped);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const fname = `prestacao_detalhada_${(new Date()).toISOString().slice(0, 10)}.csv`;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fname;
                document.body.appendChild(link);
                link.click();
                link.remove();
            });
        }
    }).catch(err => {
        console.error('Erro buscar prestação detalhada:', err);
        if (container) container.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados: ${err.message}</div>`;
    });
});