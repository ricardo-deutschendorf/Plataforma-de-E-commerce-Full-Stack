const form = document.querySelector('#authForm');
const error = document.querySelector('#authError');
const nameField = document.querySelector('#name');
const isRegister = Boolean(nameField);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  error.textContent = '';
  error.className = 'form-error';

  const email = document.querySelector('#email').value.trim();
  const password = document.querySelector('#password').value;

  if (isRegister) {
    const name = nameField.value.trim();
    if (name.length < 2) {
      error.textContent = 'Informe seu nome completo.';
      nameField.focus();
      return;
    }
    if (password.length < 8) {
      error.textContent = 'A senha deve ter pelo menos 8 caracteres.';
      document.querySelector('#password').focus();
      return;
    }
  }

  const body = {
    email,
    password
  };
  if (isRegister) {
    body.name = nameField.value;
  }

  const response = await fetch(`/api/auth/${isRegister ? 'register' : 'login'}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await response.json();
  if (!response.ok) {
    error.textContent = result.error || 'Não foi possível concluir a operação.';
    return;
  }
  if (isRegister) {
    error.className = 'form-success';
    error.textContent = result.message;
    form.reset();
    return;
  }
  window.location.href = '/';
});
