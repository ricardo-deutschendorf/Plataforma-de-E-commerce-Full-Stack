const express = require('express');
const userModel = require('../models/userModel');
const { verifyPassword } = require('../functions/password');
const { validateCredentials } = require('../functions/authValidation');
const { createEmailVerificationToken } = require('../functions/emailVerification');
const { isMailerConfigured, sendVerificationEmail } = require('../functions/mailer');
const crypto = require('crypto');

const router = express.Router();

router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

router.post('/register', async (req, res, next) => {
  try {
    const parsed = validateCredentials(req.body, { mode: 'register' });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    if (!parsed.value.name) return res.status(400).json({ error: 'Informe seu nome.' });
    if (!isMailerConfigured()) {
      return res.status(503).json({ error: 'O envio de e-mails ainda não está configurado no servidor.' });
    }
    const existingUser = await userModel.findByEmail(parsed.value.email);
    if (existingUser && existingUser.emailVerifiedAt) {
      return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const user = existingUser || await userModel.create(parsed.value);
    const verification = createEmailVerificationToken();
    await userModel.setEmailVerification(user.id, verification.tokenHash, verification.expiresAt);
    await sendVerificationEmail({
      email: user.email,
      name: user.name,
      token: verification.token,
      baseUrl: process.env.APP_URL
    });
    res.status(existingUser ? 200 : 201).json({
      message: existingUser
        ? 'O e-mail de confirmação foi reenviado.'
        : 'Conta criada. Verifique seu e-mail para liberar o login.'
    });
  } catch (error) {
    console.error('Verification email failed:', error.message);
    res.status(error.status || 500).json({
      error: error.status === 503
        ? error.message
        : 'Não foi possível enviar o e-mail de confirmação.'
    });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const parsed = validateCredentials(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const user = await userModel.findByEmail(parsed.value.email);
    if (!user || !verifyPassword(parsed.value.password, user.password)) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }
    if (!user.emailVerifiedAt) {
      return res.status(403).json({ error: 'Confirme seu e-mail antes de entrar.' });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.json({ user: req.session.user });
  } catch (error) {
    next(error);
  }
});

router.get('/verify-email', async (req, res, next) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userModel.verifyEmail(tokenHash);
    if (!user) return res.status(400).json({ error: 'Link inválido ou expirado.' });
    res.json({ message: 'Seu e-mail foi confirmado. Você já pode entrar.' });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

module.exports = router;
