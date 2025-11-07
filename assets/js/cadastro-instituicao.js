document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formInstituicao'); 
    if (!form) return;
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = (document.getElementById('responsavel')?.value || '').trim();
        const razao_social = document.getElementById('razaoSocial')?.value || '';
        const cnpj = document.getElementById('cnpj')?.value || '';
        const telefone = document.getElementById('telefone')?.value || '';
        const endereco = document.getElementById('endereco')?.value || '';

        if (!nome) {
            alert('Informe o nome da instituição.');
            return;
        }

        const payload = { nome, razao_social, cnpj, telefone, endereco };
        console.log('cadastrar-instituicao payload:', payload);

        try {
            if (submitBtn) submitBtn.disabled = true;

            const res = await fetch('/api/instituicoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // tenta interpretar resposta como JSON, se não for, usa texto para debug
            const text = await res.text();
            let body;
            try { body = JSON.parse(text); } catch { body = text; }

            if (!res.ok) {
                console.error('cadastro-instituicao: resposta de erro:', res.status, body);
                throw new Error((body && body.error) || `Status ${res.status} - ${JSON.stringify(body)}`);
            }

            console.log('cadastro-instituicao success response:', body);
            alert('Instituição cadastrada. ID: ' + (body.id ?? 'desconhecido'));
            form.reset();
        } catch (err) {
            console.error('cadastro-instituicao error:', err);
            alert('Erro ao cadastrar instituição: ' + (err.message || err));
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
});