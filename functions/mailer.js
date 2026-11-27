const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

function isMailerConfigured() {
  return ["BREVO_API_KEY", "SMTP_FROM"].every((key) =>
    Boolean(process.env[key]),
  );
}

const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[c],
  );

async function sendVerificationEmail({ email, name, token, baseUrl }) {
  const url = (
    baseUrl ||
    process.env.APP_URL ||
    "'https://ecommercetest.onrender.com'"
  ).replace(/\/$/, "");
  const verificationUrl = `${url}/verify-email?token=${encodeURIComponent(token)}`;
  const response = await fetch(BREVO_URL, {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(10000),
    body: JSON.stringify({
      sender: { name: "Pasteboard", email: process.env.SMTP_FROM },
      to: [{ email }],
      subject: "Confirme seu e-mail no Pasteboard",
      textContent: `Olá, ${name}! Confirme seu e-mail acessando: ${verificationUrl}`,

      htmlContent: `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
    <h2>Confirme seu e-mail</h2>

    <p>Olá, ${escapeHtml(name)}!</p>

    <p>
      Sua conta foi criada. Clique no botão abaixo para confirmar seu endereço
      de e-mail:
    </p>

    <p style="margin: 28px 0;">
      <a
        href="${verificationUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          color: #ffffff;
          background-color: #6c5ce7;
          text-decoration: none;
          border-radius: 6px;
        "
      >
        Confirmar meu e-mail
      </a>
    </p>

    <p>Este link expira em 30 minutos.</p>

    <p style="color: #666666; font-size: 13px;">
      Se você não criou essa conta, ignore este e-mail.
    </p>
  </div>
`,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      `Brevo ${response.status}: ${result.message || "falha no envio"}`,
    );
  }
  console.log(`E-mail de verificação aceito pelo Brevo: ${result.messageId}`);
  return result;
}

module.exports = { isMailerConfigured, sendVerificationEmail };
