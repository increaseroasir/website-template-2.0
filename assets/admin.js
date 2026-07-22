(function () {
  const tokenKey = 'increase_roas_admin_token';
  const app = document.querySelector('.admin-main');
  if (!app) return;

  let products = [];

  function token() {
    return sessionStorage.getItem(tokenKey) || '';
  }

  function headers() {
    return { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token() };
  }

  function asArray(value) {
    return String(value || '').split('\n').map(item => item.trim()).filter(Boolean);
  }

  function money(value) {
    return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[char]);
  }

  function renderShell() {
    app.innerHTML = `
      <div class="section-head">
        <span class="kicker">Inventory Control</span>
        <h2>Manage Live Products</h2>
        <p class="lead">Products added here publish to D1 inventory pages and carry their product tags into lead routing.</p>
      </div>
      <section class="section" data-admin-login>
        <div class="form-card">
          <h3>Admin Login</h3>
          <form class="form-grid" data-login-form>
            <input type="password" name="password" placeholder="Admin password" autocomplete="current-password" required>
            <button class="btn btn-gold" type="submit">Log In</button>
            <p class="fine-print" data-login-result></p>
          </form>
        </div>
      </section>
      <section class="section" data-admin-app hidden>
        <div class="grid grid-2">
          <div class="form-card">
            <h3 data-form-title>Add Product</h3>
            <form class="form-grid" data-product-form>
              <input name="inventory_name" placeholder="Product name" required>
              <input name="slug" placeholder="slug-auto-or-custom">
              <select name="category" required>
                <option value="hot-tub">Hot Tubs</option>
                <option value="swim-spa">Swim Spas</option>
                <option value="sauna">Saunas</option>
              </select>
              <select name="status">
                <option value="draft">Draft</option>
                <option value="available">Available</option>
                <option value="pending">Pending</option>
                <option value="sold">Sold</option>
                <option value="hidden">Hidden</option>
              </select>
              <input name="price" type="number" placeholder="Price">
              <input name="monthly_payment" type="number" placeholder="Monthly payment">
              <input name="quantity" type="number" placeholder="Quantity">
              <input name="primary_image" placeholder="Primary image URL">
              <input name="promo_label" placeholder="Badge / promo label">
              <input name="delivery_promise" placeholder="Delivery promise">
              <textarea name="quick_facts" placeholder="Quick facts, one per line"></textarea>
              <textarea name="ghl_tags" placeholder="GHL tags, one per line"></textarea>
              <input name="sort_order" type="number" placeholder="Sort order">
              <label><input name="featured" type="checkbox"> Featured</label>
              <button class="btn btn-gold" type="submit">Save Product</button>
              <button class="btn btn-outline" type="button" data-clear-form>Clear</button>
              <p class="fine-print" data-product-result></p>
            </form>
          </div>
          <div class="form-card">
            <h3>Upload Image</h3>
            <form class="form-grid" data-upload-form>
              <input type="file" name="image" accept="image/*" required>
              <button class="btn btn-gold" type="submit">Upload To R2</button>
              <input name="uploaded_url" placeholder="Uploaded URL appears here" readonly>
              <p class="fine-print" data-upload-result></p>
            </form>
          </div>
        </div>
        <div class="table-wrap" style="margin-top:24px">
          <table>
            <thead><tr><th>Product</th><th>Status</th><th>Price</th><th>Monthly</th><th>Tags</th><th>Actions</th></tr></thead>
            <tbody data-products-body><tr><td colspan="6">Loading products...</td></tr></tbody>
          </table>
        </div>
      </section>`;
  }

  function currentProductFormPayload(form) {
    return {
      inventory_name: form.inventory_name.value.trim(),
      slug: form.slug.value.trim(),
      category: form.category.value,
      status: form.status.value,
      price: Number(form.price.value || 0),
      monthly_payment: Number(form.monthly_payment.value || 0),
      quantity: Number(form.quantity.value || 0),
      primary_image: form.primary_image.value.trim(),
      gallery_images: [],
      quick_facts: asArray(form.quick_facts.value),
      ghl_tags: asArray(form.ghl_tags.value),
      promo_label: form.promo_label.value.trim(),
      delivery_promise: form.delivery_promise.value.trim(),
      sort_order: Number(form.sort_order.value || 0),
      featured: form.featured.checked
    };
  }

  async function api(path, options = {}) {
    const res = await fetch('/api/admin' + path, options);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || 'Request failed');
    return data;
  }

  async function loadProducts() {
    const data = await api('', { headers: { Authorization: 'Bearer ' + token() } });
    products = data.products || [];
    renderProducts();
  }

  function renderProducts() {
    const body = document.querySelector('[data-products-body]');
    if (!body) return;
    if (!products.length) {
      body.innerHTML = '<tr><td colspan="6">No products yet. Add the first product above.</td></tr>';
      return;
    }
    body.innerHTML = products.map(product => `
      <tr>
        <td><b>${escapeHtml(product.inventory_name)}</b><br><span>${escapeHtml(product.slug)}</span></td>
        <td><span class="status ${escapeHtml(product.status)}">${escapeHtml(product.status)}</span></td>
        <td>${money(product.price)}</td>
        <td>${product.monthly_payment ? money(product.monthly_payment) : '-'}</td>
        <td>${(product.ghl_tags || []).slice(0, 3).map(escapeHtml).join('<br>')}</td>
        <td>
          <button type="button" class="btn btn-outline" data-edit="${product.slug}">Edit</button>
          <button type="button" class="btn btn-outline" data-hide="${product.slug}">Hide</button>
          <button type="button" class="btn btn-red" data-delete="${product.slug}">Delete</button>
        </td>
      </tr>`).join('');
  }

  function fillForm(product) {
    const form = document.querySelector('[data-product-form]');
    if (!form) return;
    form.inventory_name.value = product.inventory_name || '';
    form.slug.value = product.slug || '';
    form.category.value = product.category || 'hot-tub';
    form.status.value = product.status || 'draft';
    form.price.value = product.price || '';
    form.monthly_payment.value = product.monthly_payment || '';
    form.quantity.value = product.quantity || '';
    form.primary_image.value = product.primary_image || '';
    form.promo_label.value = product.promo_label || '';
    form.delivery_promise.value = product.delivery_promise || '';
    form.quick_facts.value = (product.quick_facts || []).join('\n');
    form.ghl_tags.value = (product.ghl_tags || []).join('\n');
    form.sort_order.value = product.sort_order || '';
    form.featured.checked = Boolean(product.featured);
    document.querySelector('[data-form-title]').textContent = 'Edit Product';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function bind() {
    document.querySelector('[data-login-form]').addEventListener('submit', async event => {
      event.preventDefault();
      const result = document.querySelector('[data-login-result]');
      try {
        const data = await api('?action=login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: event.currentTarget.password.value })
        });
        sessionStorage.setItem(tokenKey, data.token);
        document.querySelector('[data-admin-login]').hidden = true;
        document.querySelector('[data-admin-app]').hidden = false;
        await loadProducts();
      } catch (error) {
        result.textContent = error.message;
      }
    });

    document.querySelector('[data-product-form]').addEventListener('submit', async event => {
      event.preventDefault();
      const result = document.querySelector('[data-product-result]');
      try {
        await api('', { method: 'POST', headers: headers(), body: JSON.stringify(currentProductFormPayload(event.currentTarget)) });
        result.textContent = 'Saved.';
        event.currentTarget.reset();
        document.querySelector('[data-form-title]').textContent = 'Add Product';
        await loadProducts();
      } catch (error) {
        result.textContent = error.message;
      }
    });

    document.querySelector('[data-upload-form]').addEventListener('submit', async event => {
      event.preventDefault();
      const result = document.querySelector('[data-upload-result]');
      const data = new FormData(event.currentTarget);
      try {
        const res = await fetch('/api/admin?action=upload', { method: 'POST', headers: { Authorization: 'Bearer ' + token() }, body: data });
        const payload = await res.json();
        if (!res.ok || !payload.ok) throw new Error(payload.error || 'Upload failed');
        event.currentTarget.uploaded_url.value = payload.url;
        const imageField = document.querySelector('[data-product-form] [name="primary_image"]');
        if (imageField && !imageField.value) imageField.value = payload.url;
        result.textContent = 'Uploaded.';
      } catch (error) {
        result.textContent = error.message;
      }
    });

    document.addEventListener('click', async event => {
      const editSlug = event.target.getAttribute('data-edit');
      const hideSlug = event.target.getAttribute('data-hide');
      const deleteSlug = event.target.getAttribute('data-delete');
      if (editSlug) fillForm(products.find(product => product.slug === editSlug));
      if (hideSlug) {
        await api('', { method: 'PATCH', headers: headers(), body: JSON.stringify({ slug: hideSlug, status: 'hidden' }) });
        await loadProducts();
      }
      if (deleteSlug && confirm('Mark this product deleted?')) {
        await api('?slug=' + encodeURIComponent(deleteSlug), { method: 'DELETE', headers: { Authorization: 'Bearer ' + token() } });
        await loadProducts();
      }
      if (event.target.matches('[data-clear-form]')) {
        document.querySelector('[data-product-form]').reset();
        document.querySelector('[data-form-title]').textContent = 'Add Product';
      }
    });
  }

  renderShell();
  bind();
  if (token()) {
    document.querySelector('[data-admin-login]').hidden = true;
    document.querySelector('[data-admin-app]').hidden = false;
    loadProducts().catch(() => sessionStorage.removeItem(tokenKey));
  }
})();
