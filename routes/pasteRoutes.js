const express = require('express');
const crypto = require('crypto');
const pasteModel = require('../models/pasteModel');
const { validatePaste } = require('../functions/pasteValidation');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await pasteModel.findAll());
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const paste = await pasteModel.findById(req.params.id);
    if (!paste) return res.status(404).json({ error: 'Paste not found.' });
    res.json(paste);
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const parsed = validatePaste(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const now = new Date().toISOString();
    const paste = await pasteModel.create({
      id: crypto.randomUUID(),
      ...parsed.value,
      createdAt: now,
      updatedAt: now
    });
    res.status(201).json(paste);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const parsed = validatePaste(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const paste = await pasteModel.update(req.params.id, parsed.value);
    if (!paste) return res.status(404).json({ error: 'Paste not found.' });
    res.json(paste);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await pasteModel.remove(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Paste not found.' });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
