function validateCredentials(body = {}, options = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const isRegister = options.mode === 'register';

  if (!email) return { error: 'Informe seu e-mail.' };
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Informe um e-mail válido.' };
  }
  if (!password) return { error: 'Informe sua senha.' };
  if (password.length < 8) return { error: 'A senha deve ter pelo menos 8 caracteres.' };
  if (password.length > 72) return { error: 'A senha deve ter no máximo 72 caracteres.' };

  if (isRegister) {
    if (!name) return { error: 'Informe seu nome completo.' };
    if (name.length < 2) return { error: 'O nome deve ter pelo menos 2 caracteres.' };
    if (name.length > 80) return { error: 'O nome deve ter no máximo 80 caracteres.' };
  }

  return { value: { name, email, password } };
}

module.exports = { validateCredentials };
