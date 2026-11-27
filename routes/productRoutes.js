const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const productModel = require('../models/productModel');
const { validateProduct } = require('../functions/productValidation');
const { requireAuth } = require('../public/middleware/requireAuth');

const router = express.Router();
const uploadDirectory = path.join(__dirname, '..', 'public', 'uploads', 'products');
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      fs.mkdir(uploadDirectory, { recursive: true }, (error) => callback(error, uploadDirectory));
    },
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`);
    }
  }),
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(extension)
      || !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return callback(new Error('Envie uma imagem JPG, PNG ou WEBP.'));
    }
    callback(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});
const uploadImage = (req, res, next) => upload.single('image')(req, res, (error) => {
  if (error) {
    error.status = 400;
    return next(error);
  }
  next();
});

async function requireProductOwner(req, res, next) {
  try {
    const product = await productModel.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    if (product.ownerId !== req.session.user.id) {
      return res.status(403).json({ error: 'Somente quem criou o produto pode editá-lo ou excluí-lo.' });
    }
    next();
  } catch (error) {
    next(error);
  }
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await productModel.findAll());
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, uploadImage, async (req, res, next) => {
  try {
    const parsed = validateProduct({
      ...req.body,
      imageUrl: req.file ? `/uploads/products/${req.file.filename}` : ''
    });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    res.status(201).json(await productModel.create({
      ...parsed.value,
      ownerId: req.session.user.id
    }));
  } catch (error) {
    next(error);
  }
});

router.put('/:id', requireAuth, requireProductOwner, uploadImage, async (req, res, next) => {
  try {
    const currentProduct = await productModel.findById(req.params.id);
    if (!currentProduct) return res.status(404).json({ error: 'Produto não encontrado.' });
    const parsed = validateProduct({
      ...req.body,
      imageUrl: req.file ? `/uploads/products/${req.file.filename}` : currentProduct.imageUrl
    });
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const product = await productModel.update(req.params.id, parsed.value, req.session.user.id);
    if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(product);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireProductOwner, async (req, res, next) => {
  try {
    if (!await productModel.remove(req.params.id, req.session.user.id)) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;