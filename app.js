const grid = document.querySelector('#productGrid');
const empty = document.querySelector('#emptyProducts');
const search = document.querySelector('#productSearch');
const category = document.querySelector('#categoryFilter');
const productDialog = document.querySelector('#productDialog');
const productForm = document.querySelector('#productForm');
const productError = document.querySelector('#productError');
let products = [];
let currentUser = null;

const fields = {
  id: document.querySelector('#productId'),
  name: document.querySelector('#productName'),
  category: document.querySelector('#productCategory'),
  price: document.querySelector('#productPrice'),
  stock: document.querySelector('#productStock'),
  image: document.querySelector('#productImage'),
  description: document.querySelector('#productDescription')
};

const money = (value) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const escapeHtml = (value = '') => value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));

function renderProducts() {
  const query = search.value.trim().toLowerCase();
  const selectedCategory = category.value;
  const visible = products.filter((product) =>
    (!selectedCategory || product.category === selectedCategory) &&
    `${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query)
  );
  empty.hidden = visible.length > 0;
  grid.innerHTML = visible.map((product) => `
    <article class="product-card">
      <div class="product-image">${product.imageUrl ? `<img src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}">` : '<span>SEM IMAGEM</span>'}</div>
      <div class="product-info"><span class="product-category">${escapeHtml(product.category)}</span><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.description || 'Produto disponível na loja.')}</p>
      <div class="product-bottom"><strong>${money(product.price)}</strong><span>${product.stock} em estoque</span></div>
      <div class="product-actions"><button class="button button-primary" data-action="buy" data-id="${product.id}" ${product.stock < 1 ? 'disabled' : ''}>Comprar via Pix</button>${currentUser ? `<button class="text-button" data-action="edit" data-id="${product.id}">Editar</button><button class="text-button danger" data-action="delete" data-id="${product.id}">Excluir</button>` : ''}</div></div>
    </article>`).join('');
}

function updateCategories() {
  const current = category.value;
  category.innerHTML = '<option value="">Todas as categorias</option>' + [...new Set(products.map((product) => product.category))].sort().map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
  category.value = current;
}

async function loadProducts() {
  const response = await fetch('/api/products');
  if (response.status === 401) return window.location.assign('/login');
  products = await response.json();
  updateCategories();
  renderProducts();
}

function openProduct(product) {
  fields.id.value = product?.id || '';
  fields.name.value = product?.name || '';
  fields.category.value = product?.category || '';
  fields.price.value = product?.price || '';
  fields.stock.value = product?.stock ?? '';
  fields.image.value = '';
  fields.description.value = product?.description || '';
  productError.textContent = '';
  document.querySelector('#productDialogTitle').textContent = product ? 'Editar produto' : 'Novo produto';
  productDialog.showModal();
}

async function buyProduct(product) {
  if (!currentUser) return window.location.assign('/login');
  const dialog = document.querySelector('#pixDialog');
  document.querySelector('#pixTitle').textContent = product.name;
  document.querySelector('#pixError').textContent = '';
  document.querySelector('#pixQrCode').hidden = true;
  document.querySelector('#pixCode').value = '';
  document.querySelector('#pixStatus').textContent = 'Gerando cobrança...';
  dialog.showModal();
  const response = await fetch('/api/payments/pix', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: product.id }) });
  const result = await response.json();
  if (!response.ok) {
    document.querySelector('#pixStatus').textContent = '';
    document.querySelector('#pixError').textContent = result.error || 'Não foi possível gerar o Pix.';
    return;
  }
  document.querySelector('#pixQrCode').src = `data:image/png;base64,${result.qrCodeBase64}`;
  document.querySelector('#pixQrCode').hidden = false;
  document.querySelector('#pixCode').value = result.qrCode;
  document.querySelector('#pixStatus').textContent = `Status: ${result.status}`;
}

productForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = fields.id.value;
  const payload = new FormData();
  payload.append('name', fields.name.value.trim());
  payload.append('category', fields.category.value.trim());
  payload.append('price', fields.price.value);
  payload.append('stock', fields.stock.value);
  payload.append('description', fields.description.value.trim());
  if (fields.image.files[0]) payload.append('image', fields.image.files[0]);
  if (!fields.name.value.trim()) {
    productError.textContent = 'Informe o nome do produto.';
    fields.name.focus();
    return;
  }
  const response = await fetch(id ? `/api/products/${id}` : '/api/products', {
    method: id ? 'PUT' : 'POST',
    body: payload
  });
  const result = await response.json();
  if (!response.ok) { productError.textContent = result.error; return; }
  productDialog.close();
  await loadProducts();
});

grid.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const product = products.find((item) => item.id === button.dataset.id);
  if (button.dataset.action === 'buy') await buyProduct(product);
  if (button.dataset.action === 'edit') openProduct(product);
  if (button.dataset.action === 'delete' && confirm(`Excluir "${product.name}"?`)) {
    await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
    await loadProducts();
  }
});

document.querySelector('#newProductButton')?.addEventListener('click', () => openProduct());
document.querySelector('#closeProductDialog').addEventListener('click', () => productDialog.close());
document.querySelector('#cancelProductDialog').addEventListener('click', () => productDialog.close());
document.querySelector('#logoutButton')?.addEventListener('click', async () => {
  const response = await fetch('/api/auth/logout', { method: 'POST' });
  if (!response.ok) return;
  window.location.assign('/login');
});
search.addEventListener('input', renderProducts);
category.addEventListener('change', renderProducts);
fetch('/api/auth/me').then((response) => response.json()).then(({ user }) => {
  currentUser = user;
  document.querySelector('#userName').textContent = user ? user.name : '';
  if (!user) {
    document.querySelector('#loginButton').hidden = false;
    document.querySelector('#logoutButton').hidden = true;
    document.querySelector('#newProductButton').hidden = true;
  } else {
    document.querySelector('#loginButton').hidden = true;
    document.querySelector('#logoutButton').hidden = false;
    document.querySelector('#newProductButton').hidden = false;
  }
  return loadProducts();
});
