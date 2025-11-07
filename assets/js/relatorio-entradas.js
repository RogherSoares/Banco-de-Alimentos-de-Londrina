// busca params da URL, chama API /api/relatorios/entradas, renderiza tabela e permite export CSV
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get('start') || '';
    const end = params.get('end') || '';

    const periodText = document.getElementById('periodText');
    if (periodText) {
        periodText.textContent = start || end ? `Período: ${start || 'início'} — ${end || 'fim'}` : 'Período: Todos os registros';
    }

    const thead = document.getElementById('resultThead');
    const tbody = document.getElementById('resultTbody');
    const exportBtn = document.getElementById('btnExportCsvPage');

    const columns = [
        { key: 'data_doacao', label: 'Data Doação' },
        { key: 'parceiro', label: 'Parceiro' },
        { key: 'descricao', label: 'Descrição' },
        { key: 'unidade', label: 'Unidade' },
        { key: 'total_quantidade', label: 'Total Quantidade' }
    ];

    const renderHeader = () => {
        thead.innerHTML = '<tr>' + columns.map(c => `<th>${c.label}</th>`).join('') + '</tr>';
    };

    const renderRows = (rows) => {
        tbody.innerHTML = '';
        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + columns.length + '" class="text-center">Nenhum registro encontrado.</td></tr>';
            return;
        }
        rows.forEach(r => {
            const tr = document.createElement('tr');
            columns.forEach(c => {
                let v = r[c.key];
                if (c.key === 'data_doacao' && v) {
                    v = new Date(v).toLocaleDateString('pt-BR');
                }
                tr.innerHTML += `<td>${v ?? ''}</td>`;
            });
            tbody.appendChild(tr);
        });
    };

    const fetchData = async () => {
        try {
            const url = new URL('/api/relatorios/entradas', window.location.origin);
            if (start) url.searchParams.set('start', start);
            if (end) url.searchParams.set('end', end);
            const res = await fetch(url.toString());
            if (!res.ok) {
                const t = await res.text();
                throw new Error(`${res.status} - ${t}`);
            }
            return res.json();
        } catch (err) {
            console.error('Erro buscar entradas:', err);
            return null;
        }
    };

    const toCsv = (rows, cols) => {
        const escape = (v) => {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
        };
        const header = cols.map(c => escape(c.label)).join(',');
        const body = rows.map(r => cols.map(c => {
            let v = r[c.key];
            if (c.key === 'data_doacao' && v) v = new Date(v).toLocaleDateString('pt-BR');
            return escape(v);
        }).join(',')).join('\r\n');
        return header + '\r\n' + body;
    };

    const doExport = (rows) => {
        if (!rows || rows.length === 0) {
            alert('Nenhum registro para exportar.');
            return;
        }
        const csv = toCsv(rows, columns);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const fname = `relatorio_entradas_${(new Date()).toISOString().slice(0, 10)}.csv`;
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fname;
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // inicializa
    renderHeader();
    fetchData().then(rows => {
        if (!rows) return;
        renderRows(rows);
        if (exportBtn) {
            exportBtn.addEventListener('click', () => doExport(rows));
        }
    });
});