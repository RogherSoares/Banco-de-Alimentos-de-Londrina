document.addEventListener('DOMContentLoaded', () => {
    const entradaBtn = document.querySelector('#btnGerarEntradas');
    const entradaInicio = document.querySelector('#entradaInicio');
    const entradaFim = document.querySelector('#entradaFim');

    const posicaoBtn = document.querySelector('#btnVerPosicao');
    const exportEntradasBtn = document.querySelector('#btnExportEntradas');

    const saidaInicio = document.querySelector('#saidaInicio');
    const saidaFim = document.querySelector('#saidaFim');
    const btnGerarSaidas = document.querySelector('#btnGerarSaidas') || null;
    const btnExportSaidas = document.querySelector('#btnExportSaidas') || null;

    const instInicio = document.querySelector('#instInicio');
    const instFim = document.querySelector('#instFim');
    const btnGerarPrest = document.querySelector('#btnGerarPrestacao') || null;
    const btnExportPrest = document.querySelector('#btnExportPrestacao') || null;

    // abre nova página com relatório (gera URL com query params)
    if (entradaBtn) {
        entradaBtn.addEventListener('click', () => {
            const start = entradaInicio?.value || '';
            const end = entradaFim?.value || '';
            const url = new URL('relatorio-entradas.html', window.location.origin);
            if (start) url.searchParams.set('start', start);
            if (end) url.searchParams.set('end', end);
            window.open(url.toString(), '_blank');
        });
    }

    // abrir página de saídas
    if (btnGerarSaidas) {
        btnGerarSaidas.addEventListener('click', () => {
            const url = new URL('relatorio-saidas.html', window.location.origin);
            if (saidaInicio?.value) url.searchParams.set('start', saidaInicio.value);
            if (saidaFim?.value) url.searchParams.set('end', saidaFim.value);
            window.open(url.toString(), '_blank');
        });
    }

    // abrir página de prestação de contas
    if (btnGerarPrest) {
        btnGerarPrest.addEventListener('click', () => {
            const url = new URL('relatorio-prestacao.html', window.location.origin);
            if (instInicio?.value) url.searchParams.set('start', instInicio.value);
            if (instFim?.value) url.searchParams.set('end', instFim.value);
            window.open(url.toString(), '_blank');
        });
    }

    // exporta CSV diretamente da página de relatórios (fallback se quiser baixar sem abrir nova aba)
    const toCsv = (rows, columns) => {
        const escape = (v) => {
            if (v === null || v === undefined) return '';
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
        };
        const header = columns.map(c => escape(c)).join(',');
        const body = rows.map(r => columns.map(col => escape(r[col] ?? '')).join(',')).join('\r\n');
        return header + '\r\n' + body;
    };

    const fetchEntradasForCsv = async (start, end) => {
        const url = new URL('/api/relatorios/entradas', window.location.origin);
        if (start) url.searchParams.set('start', start);
        if (end) url.searchParams.set('end', end);
        const res = await fetch(url.toString());
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`${res.status} - ${text}`);
        }
        return res.json();
    };

    if (exportEntradasBtn) {
        exportEntradasBtn.addEventListener('click', async () => {
            try {
                exportEntradasBtn.disabled = true;
                const start = entradaInicio?.value || '';
                const end = entradaFim?.value || '';
                const data = await fetchEntradasForCsv(start, end);
                if (!data || data.length === 0) {
                    alert('Nenhum registro encontrado para exportar.');
                    return;
                }
                // ajustar colunas conforme API
                const columns = ['data_doacao', 'parceiro', 'descricao', 'unidade', 'total_quantidade'];
                const csvRows = data.map(r => ({
                    data_doacao: r.data_doacao,
                    parceiro: r.parceiro,
                    descricao: r.descricao,
                    unidade: r.unidade,
                    total_quantidade: r.total_quantidade
                }));
                const csv = toCsv(csvRows, columns);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const fname = `relatorio_entradas_${(new Date()).toISOString().slice(0, 10)}.csv`;
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fname;
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (err) {
                console.error('Erro exportar CSV:', err);
                alert('Erro ao exportar CSV: ' + (err.message || err));
            } finally {
                exportEntradasBtn.disabled = false;
            }
        });
    }

    // export CSV direto (saídas)
    if (btnExportSaidas) {
        btnExportSaidas.addEventListener('click', async () => {
            try {
                btnExportSaidas.disabled = true;
                const start = saidaInicio?.value || '';
                const end = saidaFim?.value || '';
                const url = new URL('/api/relatorios/saidas', window.location.origin);
                if (start) url.searchParams.set('start', start);
                if (end) url.searchParams.set('end', end);
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                if (!data || data.length === 0) return alert('Nenhum registro para exportar.');
                const cols = ['data_saida', 'instituicao', 'descricao', 'unidade', 'total_quantidade'];
                const csv = toCsv(data, cols);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `relatorio_saidas_${(new Date()).toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (err) {
                console.error('Erro exportar saídas CSV:', err);
                alert('Erro ao exportar CSV: ' + (err.message || err));
            } finally { btnExportSaidas.disabled = false; }
        });
    }

    // export CSV direto (prestação)
    if (btnExportPrest) {
        btnExportPrest.addEventListener('click', async () => {
            try {
                btnExportPrest.disabled = true;
                const start = instInicio?.value || '';
                const end = instFim?.value || '';
                const url = new URL('/api/relatorios/prestacao_instituicoes', window.location.origin);
                if (start) url.searchParams.set('start', start);
                if (end) url.searchParams.set('end', end);
                const res = await fetch(url.toString());
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                if (!data || data.length === 0) return alert('Nenhum registro para exportar.');
                const cols = ['instituicao', 'descricao', 'unidade', 'total_quantidade'];
                const csv = toCsv(data, cols);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `prestacao_instituicoes_${(new Date()).toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(link);
                link.click();
                link.remove();
            } catch (err) {
                console.error('Erro exportar prestação CSV:', err);
                alert('Erro ao exportar CSV: ' + (err.message || err));
            } finally { btnExportPrest.disabled = false; }
        });
    }

    // manter comportamento de ver posição de estoque (se já implementado)
    if (posicaoBtn) {
        posicaoBtn.addEventListener('click', () => {
            window.open('estoque.html', '_blank');
        });
    }
});