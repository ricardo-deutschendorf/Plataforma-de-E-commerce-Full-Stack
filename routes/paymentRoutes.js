const express = require('express');
const productModel = require('../models/productModel');
const { createPixPayment } = require('../functions/pixPayment');

const router = express.Router();

router.post('/pix', async (req, res, next) => {
  try {
    const product = await productModel.findById(req.body.productId);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    if (product.stock < 1) return res.status(409).json({ error: 'Produto sem estoque.' });
    res.status(201).json(await createPixPayment({ email: req.session.user.email, product }));
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    next(error);
  }
});

module.exports = router;
