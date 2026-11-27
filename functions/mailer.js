const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function isMailerConfigured() {
  return ['BREVO_API_KEY', 'SMTP_FROM'].every((key) => Boolean(process.env[key]));
}

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));

async function sendVerificationEmail({ email, name, token, baseUrl }) {
  const url = (baseUrl || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const verificationUrl = `${url}/verify-email?token=${encodeURIComponent(token)}`;

  const response = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      sender: { name: 'Pasteboard', email: process.env.SMTP_FROM },
      to: [{ email }],
      subject: 'Confirme seu e-mail no Pasteboard',
      textContent: `Olá, ${name}! Confirme seu e-mail acessando: ${verificationUrl}`,
      htmlContent: `<p>Olá, ${escapeHtml(name)}!</p><p><a href="${verificationUrl}">Clique aqui para confirmar seu e-mail</a>.</p><p>O link expira em 30 minutos.</p>`
    })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Brevo ${response.status}: ${result.message || 'falha no envio'}`);
  }
  console.log(`E-mail de verificação aceito pelo Brevo: ${result.messageId}`);
  return result;
}

module.exports = { isMailerConfigured, sendVerificationEmail };