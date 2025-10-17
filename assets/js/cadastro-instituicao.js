
document.addEventListener('DOMContentLoaded', function() {
    const formInstituicao = document.getElementById('formInstituicao');

    formInstituicao.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(formInstituicao);
        const dadosInstituicao = {};
        formData.forEach((value, key) => {
            // Renomeando campos para coincidir com a API, se necessário
            if (key === 'razaoSocial') {
                dadosInstituicao['razao_social'] = value;
            } else {
                dadosInstituicao[key] = value;
            }
        });

        // --- SIMULAÇÃO DO ENVIO PARA A API ---
        console.log('Dados que seriam enviados para a API (/api/instituicoes):');
        console.log(JSON.stringify(dadosInstituicao, null, 2));

        alert('Instituição cadastrada com sucesso! (Simulação)\nVerifique o console (F12) para ver os dados.');

        formInstituicao.reset();
    });
});