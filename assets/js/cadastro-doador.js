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

        // --- SIMULAÇÃO DO ENVIO PARA A API ---
        console.log('Dados que seriam enviados para a API (/api/doadores):');
        console.log(JSON.stringify(dadosDoador, null, 2));

        // Feedback para o usuário
        alert('Doador cadastrado com sucesso! (Simulação)\nVerifique o console (F12) para ver os dados.');

        // Limpa o formulário após o envio
        formDoador.reset();
    });
});