function validateProduct(body = {}) {
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const category = typeof body.category === 'string' ? body.category.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  const price = Number(body.price);
  const stock = Number(body.stock);

  if (!name) return { error: 'Informe o nome do produto.' };
  if (!category) return { error: 'Informe a categoria do produto.' };
  if (name.length > 100) return { error: 'O nome deve ter no máximo 100 caracteres.' };
  if (category.length > 80) return { error: 'A categoria deve ter no máximo 80 caracteres.' };
  if (!Number.isFinite(price) || price <= 0) return { error: 'Informe um preço válido.' };
  if (!Number.isInteger(stock) || stock < 0) return { error: 'Informe um estoque válido.' };

  return {
    value: {
      name,
      description,
      category,
      imageUrl,
      price: Number(price.toFixed(2)),
      stock
    }
  };
}

module.exports = { validateProduct };
