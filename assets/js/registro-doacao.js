document.addEventListener('DOMContentLoaded', function () {
    // --- SELETORES DE ELEMENTOS ---
    const formDoacao = document.getElementById('formDoacao');
    const selectDoador = document.getElementById('doador');
    const listaItensDiv = document.getElementById('listaItens');

    // --- ELEMENTOS DO MODAL ---
    const modalElement = document.getElementById('modalAdicionarItem');
    const modal = new bootstrap.Modal(modalElement);
    const formItem = document.getElementById('formItem');
    const btnSalvarItem = document.getElementById('btnSalvarItem');

    // --- ESTADO DA APLICAÇÃO ---
    // Array que armazena os itens em memória. É a nossa "fonte da verdade".
    let itensDaDoacao = [];

    // --- FUNÇÕES ---

    /**
     * Simula o carregamento de doadores de uma API e preenche o select.
     */
    const carregarDoadores = async () => {
        try {
            const res = await fetch('/api/doadores');
            if (!res.ok) throw new Error('Erro ao carregar doadores');
            const doadores = await res.json();
            selectDoador.innerHTML = '<option value="">Selecione um doador</option>';
            doadores.forEach(doador => {
                const option = document.createElement('option');
                option.value = doador.id;
                option.textContent = doador.nome;
                selectDoador.appendChild(option);
            });
        } catch (err) {
            console.error(err);
            selectDoador.innerHTML = '<option value="">Erro ao carregar doadores</option>';
        }
    };

    /**
     * Pega o array 'itensDaDoacao' e o desenha na tela como uma tabela.
     * Esta função é a chave para a reatividade da página.
     */
    const renderizarItens = () => {
        listaItensDiv.innerHTML = ''; // Limpa a visualização atual

        if (itensDaDoacao.length === 0) {
            listaItensDiv.innerHTML = '<p class="text-muted">Nenhum item adicionado ainda.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'table table-striped table-hover';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Validade</th>
                    <th class="text-end">Ação</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        itensDaDoacao.forEach((item, index) => {
            // Formata a data para o padrão brasileiro, se existir
            const dataFormatada = item.validade
                ? new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR')
                : 'N/A';

            const tr = document.createElement('tr');
            // Usamos data-index para saber qual item remover ao clicar no botão
            tr.innerHTML = `
                <td>${item.descricao}</td>
                <td>${item.quantidade} ${item.unidade || ''}</td>
                <td>${dataFormatada}</td>
                <td class="text-end">
                    <button type="button" class="btn btn-danger btn-sm btn-remover" data-index="${index}">
                        Excluir
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        listaItensDiv.appendChild(table);
    };

    // --- EVENT LISTENERS (OUVINTES DE EVENTOS) ---
 
    //Ouve o clique no botão "Salvar Item" dentro do modal.
     
    btnSalvarItem.addEventListener('click', () => {
        const novoItem = {
            descricao: document.getElementById('itemDescricao').value.trim(),
            quantidade: document.getElementById('itemQuantidade').value,
            unidade: document.getElementById('itemUnidade').value,
            validade: document.getElementById('itemValidade').value,
        };

        if (!novoItem.descricao || !novoItem.quantidade) {
            alert('Preencha a descrição e a quantidade!');
            return;
        }

        itensDaDoacao.push(novoItem); // Adiciona o item ao array
        formItem.reset();             // Limpa o formulário do modal
        modal.hide();                 // Fecha o modal
        renderizarItens();            // Redesenha a lista na tela
    });


    //ouve o envio do formulário principal de doação.

    formDoacao.addEventListener('submit', (event) => {
        event.preventDefault();

        if (itensDaDoacao.length === 0) {
            alert('Adicione pelo menos um item à doação!');
            return;
        }

        const dadosDoacao = {
            id_doador: selectDoador.value,
            data_doacao: document.getElementById('dataDoacao').value,
            observacoes: document.getElementById('observacoes').value,
            itens: itensDaDoacao
        };

        // Envia para a API
        fetch('/api/doacoes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosDoacao)
        })
        .then(res => {
            if (!res.ok) return res.json().then(x => { throw new Error(x.error || 'Erro'); });
            return res.json();
        })
        .then(data => {
            alert('Doação registrada com sucesso!');
            formDoacao.reset();
            itensDaDoacao = []; // Limpa o array
            renderizarItens();  // Limpa a lista da tela
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao registrar doação. Veja o console para mais detalhes.');
        });
    });

    listaItensDiv.addEventListener('click', (event) => {
        // Verifica se o elemento clicado foi um botão de remover
        if (event.target.classList.contains('btn-danger')) {
            const index = parseInt(event.target.dataset.index);
            itensDaDoacao.splice(index, 1);
            renderizarItens();
        }
    });

    // --- INICIALIZAÇÃO ---
    // Funções que rodam assim que a página é carregada.
    carregarDoadores();
    renderizarItens();
});