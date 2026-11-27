require('dotenv').config();

const dns = require('dns');
const express = require('express');
const path = require('path');
const session = require('express-session');
const pasteRoutes = require('./routes/pasteRoutes');
const authRoutes = require('./routes/authRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const productRoutes = require('./routes/productRoutes');
const { requireAuth } = require('./public/middleware/requireAuth');

dns.setDefaultResultOrder('ipv4first');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));
app.use('/seeders', (req, res) => {
  res.status(404).end();
});
app.use('/middleware', (req, res) => {
  res.status(404).end();
});
app.use(express.static(path.join(__dirname, 'public')));
app.get('/app.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.js'));
});
app.get('/auth.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'auth.js'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});
app.get('/verify-email', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'verify-email.html'));
});
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});
app.use('/api/pastes', requireAuth, pasteRoutes);
app.use('/api/payments', requireAuth, paymentRoutes);
app.use('/api/products', productRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(error.status || 500).json({
    error: error.status ? error.message : 'Something went wrong on the server.'
  });
});

module.exports = app;
