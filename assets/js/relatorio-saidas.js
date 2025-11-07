document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('start') || '';
    const end = params.get('end') || '';

    document.getElementById('periodText').textContent =
        start || end ? `Período: ${start || 'início'} — ${end || 'fim'}` : 'Período: Todos os registros';

    const thead = document.getElementById('resultThead');
    const tbody = document.getElementById('resultTbody');
    const exportBtn = document.getElementById('btnExportCsvPage');

    const columns = [
        { key: 'data_saida', label: 'Data Saída' },
        { key: 'instituicao', label: 'Instituição' },
        { key: 'descricao', label: 'Descrição' },
        { key: 'unidade', label: 'Unidade' },
        { key: 'total_quantidade', label: 'Quantidade' }
    ];

    thead.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '</tr>';

    (async () => {
        try {
            const url = new URL('/api/relatorios/saidas', window.location.origin);
            if (start) url.searchParams.set('start', start);
            if (end) url.searchParams.set('end', end);
            const res = await fetch(url.toString());
            if (!res.ok) {
                tbody.innerHTML = `<tr><td colspan="${columns.length}">Erro: ${await res.text()}</td></tr>`;
                return;
            }
            const rows = await res.json();
            if (!rows || rows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns.length}" class="text-center">Nenhum registro encontrado.</td></tr>`;
                return;
            }
            rows.forEach(r => {
                const tr = document.createElement('tr');
                columns.forEach(c => {
                    let v = r[c.key];
                    if (c.key === 'data_saida' && v) v = new Date(v).toLocaleDateString('pt-BR');
                    tr.innerHTML += `<td>${v ?? ''}</td>`;
                });
                tbody.appendChild(tr);
            });
            if (exportBtn) {
                exportBtn.addEventListener('click', () => {
                    const cols = columns.map(c => c.label);
                    const keys = columns.map(c => c.key);
                    const csvHeader = cols.join(',');
                    const csvBody = rows.map(row => keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
                    const csv = csvHeader + '\r\n' + csvBody;
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `relatorio_saidas_${(new Date()).toISOString().slice(0, 10)}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                });
            }
        } catch (err) {
            console.error('Erro fetch saídas:', err);
            tbody.innerHTML = `<tr><td colspan="${columns.length}">Erro ao buscar dados.</td></tr>`;
        }
    })();
});