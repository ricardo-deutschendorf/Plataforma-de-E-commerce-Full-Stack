const productModel = require('../../models/productModel');

async function seed() {
  const products = await productModel.findAll();
  if (products.length > 0) {
    console.log('Product seed skipped: products already exist.');
    return;
  }

  await productModel.create({
    name: 'Item de teste',
    description: 'Produto de teste para validar o fluxo de compra via Pix.',
    category: 'Teste',
    imageUrl: '',
    price: 0.01,
    stock: 99
  });
  console.log('Product seed complete.');
}

if (require.main === module) {
  seed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { seed };
