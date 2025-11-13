// Aguarda o documento HTML ser completamente carregado
document.addEventListener('DOMContentLoaded', function () {
  const formDoador = document.getElementById('formDoador');
  if (!formDoador) {
    console.warn('cadastro-doador.js: formDoador não encontrado. Verifique id do <form> e se o script está sendo incluído após o HTML.');
    return;
  }

  const submitBtn = formDoador.querySelector('button[type="submit"]');
  const feedbackEl = document.getElementById('cadastroFeedback');

  const setFeedback = (msg, type = 'info') => {
    if (feedbackEl) feedbackEl.innerHTML = `<div class="alert alert-${type} small mb-0">${msg}</div>`;
    else console[type === 'danger' ? 'error' : 'log'](msg);
  };

  const collectFormData = (form) => {
    const data = {};
    Array.from(form.elements).forEach(el => {
      if (!el.name) return;
      if (el.disabled) return;
      if (el.type === 'checkbox') data[el.name] = el.checked;
      else if (el.type === 'radio') { if (el.checked) data[el.name] = el.value; }
      else data[el.name] = el.value;
    });
    Object.keys(data).forEach(k => { if (typeof data[k] === 'string') data[k] = data[k].trim(); });
    return data;
  };

  formDoador.addEventListener('submit', async function (e) {
    e.preventDefault();
    const payload = collectFormData(formDoador);

    if (!payload.nome) {
      setFeedback('O campo "Nome" é obrigatório.', 'danger');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    setFeedback('Enviando...', 'info');

    try {
      console.log('POST /api/doadores payload', payload);
      const res = await fetch('/api/doadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const text = await res.text();
      let body = null;
      try { body = text ? JSON.parse(text) : null; } catch { body = text; }

      console.log('Resposta /api/doadores', res.status, body);

      if (!res.ok) {
        const msg = body && body.error ? body.error : (typeof body === 'string' ? body : `Status ${res.status}`);
        throw new Error(msg);
      }

      setFeedback('Doador cadastrado com sucesso.', 'success');
      formDoador.reset();
      // opcional: ir para lista
      // window.location.href = 'doadores.html';
    } catch (err) {
      console.error('Erro ao cadastrar doador:', err);
      setFeedback('Erro ao cadastrar doador: ' + (err.message || 'Erro desconhecido'), 'danger');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});