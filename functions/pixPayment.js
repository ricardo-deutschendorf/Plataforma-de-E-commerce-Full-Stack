const crypto = require('crypto');

function isPixConfigured() {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

async function createPixPayment({ email, product }) {
  if (!isPixConfigured()) {
    const error = new Error('Configure MP_ACCESS_TOKEN para gerar cobranças Pix.');
    error.status = 503;
    throw error;
  }

  const testEmail = process.env.MP_TEST_PAYER_EMAIL;
  const amount = Number(product.price).toFixed(2);

  const response = await fetch('https://api.mercadopago.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': crypto.randomUUID()
    },
    body: JSON.stringify({
      type: 'online',
      processing_mode: 'automatic',
      external_reference: crypto.randomUUID(),
      total_amount: amount,
      payer: testEmail ? { email: testEmail, first_name: 'APRO' } : { email },
      transactions: {
        payments: [{ amount, payment_method: { id: 'pix', type: 'bank_transfer' } }]
      }
    })
  });

  const result = await response.json().catch(() => ({}));
  const payment = result.transactions?.payments?.[0];

  if (!response.ok || !payment) {
    console.error('Erro Mercado Pago:', response.status, JSON.stringify(result));
    const error = new Error('Mercado Pago recusou a cobrança Pix. Veja o terminal.');
    error.status = response.status >= 500 ? 502 : 400;
    throw error;
  }

  return {
    id: result.id,
    status: result.status,
    amount: product.price,
    product: product.name,
    qrCode: payment.payment_method?.qr_code,
    qrCodeBase64: payment.payment_method?.qr_code_base64,
    expiresAt: payment.date_of_expiration
  };
}

module.exports = { isPixConfigured, createPixPayment };