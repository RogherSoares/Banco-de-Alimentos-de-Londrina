document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('corpoTabelaEstoque');
    if (!tbody) return;

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
        // zerar horas para contagem de dias completa
        dt.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);
        const diff = Math.ceil((dt - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

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
        <td>${item.descricao}</td>
        <td>${qtd}</td>
        <td>${item.unidade || 'un'}</td>
        <td>${proxVencText}</td>
        <td><button class="btn btn-sm btn-outline-primary btn-ver-lotes" data-descricao="${escapeHtml(item.descricao)}">Ver Lotes</button></td>
      `;
            tbody.appendChild(tr);
        });
    };

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));

    const load = async () => {
        try {
            const res = await fetch('/api/estoque');
            if (!res.ok) {
                const text = await res.text();
                console.error('Erro ao carregar estoque:', res.status, text);
                render([]);
                return;
            }
            const data = await res.json();
            render(data);
        } catch (err) {
            console.error('Erro fetch /api/estoque:', err);
            render([]);
        }
    };

    // delegação para Ver Lotes (pode abrir modal ou redirecionar para página de lote)
    tbody.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ver-lotes');
        if (!btn) return;
        const descricao = btn.dataset.descricao;
        // ação simples: alert (substitua por modal ou rota real)
        alert('Ver lotes para: ' + descricao);
    });

    load();
});