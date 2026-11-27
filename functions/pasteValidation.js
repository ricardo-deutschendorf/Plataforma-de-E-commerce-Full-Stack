function validatePaste(body = {}) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const content = typeof body.content === 'string' ? body.content : '';
  const language = typeof body.language === 'string' ? body.language.trim() : 'text';

  if (!title) return { error: 'A title is required.' };
  if (!content.trim()) return { error: 'Paste content is required.' };
  if (title.length > 120) return { error: 'Title must be 120 characters or fewer.' };
  if (content.length > 1000000) return { error: 'Content must be 1 MB or smaller.' };

  return { value: { title, content, language: language || 'text' } };
}

module.exports = { validatePaste };
