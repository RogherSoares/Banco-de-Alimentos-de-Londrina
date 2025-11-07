// Aguarda o documento HTML ser completamente carregado
document.addEventListener('DOMContentLoaded', function() {
    
    // Seleciona o formulário pelo ID
    const formDoador = document.getElementById('formDoador');

    // Adiciona um "ouvinte" para o evento de submissão do formulário
    formDoador.addEventListener('submit', function(event) {
        // Previne o comportamento padrão do navegador (que é recarregar a página)
        event.preventDefault();

        // Cria um objeto FormData para capturar todos os campos do formulário
        const formData = new FormData(formDoador);

        // Converte os dados do formulário para um objeto simples (chave: valor)
        const dadosDoador = {};
        formData.forEach((value, key) => {
            dadosDoador[key] = value;
        });

        // Envia para a API backend
        fetch('/api/doadores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosDoador)
        })
        .then(res => {
            if (!res.ok) throw new Error('Erro ao cadastrar doador');
            return res.json();
        })
        .then(data => {
            alert('Doador cadastrado com sucesso!');
            formDoador.reset();
        })
        .catch(err => {
            console.error(err);
            alert('Erro ao cadastrar doador. Veja o console para mais detalhes.');
        });
    });
});