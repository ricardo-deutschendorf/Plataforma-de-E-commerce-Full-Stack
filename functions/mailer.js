const nodemailer = require('nodemailer');

function isMailerConfigured() {
  return ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD']
    .every((key) => Boolean(process.env[key]));
}

function getTransporter() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`SMTP configuration missing: ${missing.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    family: 4,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD.replace(/\s/g, '')
    }
  });
}

async function sendVerificationEmail({ email, name, token, baseUrl }) {
  const configuredBaseUrl = baseUrl || process.env.APP_URL || 'http://localhost:3000';
  const normalizedBaseUrl = configuredBaseUrl.replace(/\/$/, '');
  const verificationUrl = `${normalizedBaseUrl}/verify-email?token=${encodeURIComponent(token)}`;
  try {
    const info = await getTransporter().sendMail({
      from: `"Pasteboard" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirme seu e-mail no Pasteboard',
      text: `Olá, ${name}! Confirme seu e-mail acessando: ${verificationUrl}`,
      html: `<p>Olá, ${name}!</p><p><a href="${verificationUrl}">Clique aqui para confirmar seu e-mail</a>.</p><p>O link expira em 30 minutos.</p>`
    });
    console.log(`Verification email accepted by SMTP for ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    if (error.responseCode === 535) {
      const authenticationError = new Error('O Gmail recusou as credenciais SMTP. Gere uma nova senha de aplicativo.');
      authenticationError.status = 503;
      throw authenticationError;
    }
    throw error;
  }
}

module.exports = { isMailerConfigured, sendVerificationEmail };
