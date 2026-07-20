(function () {
  function productForPage() {
    var slug = document.body.getAttribute('data-product-slug') || '{{PRODUCT_SLUG}}';
    if (window.ActiveInventoryProductBySlug && window.ActiveInventoryProductBySlug[slug]) return window.ActiveInventoryProductBySlug[slug];
    return null;
  }
  function statusConfig(product) {
    var map = window.ActiveInventoryAvailabilityStatus || {};
    return map[(product && product.inventoryStatus) || 'available'] || map.available || {};
  }
  function setHidden(form, name, value) {
    var field = form.querySelector('[name="' + name + '"]');
    if (!field) { field = document.createElement('input'); field.type = 'hidden'; field.name = name; form.appendChild(field); }
    field.value = value || '';
  }
  function hydrateProductForms() {
    var product = productForPage();
    var availability = statusConfig(product);
    document.querySelectorAll('[data-active-inventory-product-form], .ai-lead-form').forEach(function (form) {
      var pageUrl = (product && product.productPageUrl) || location.href.split('#')[0];
      form.setAttribute('data-lead-success', 'inline');
      setHidden(form, 'product_name', (product && (product.fullProductName || product.inventoryName)) || '{{PRODUCT_NAME}}');
      setHidden(form, 'product_slug', (product && product.slug) || document.body.getAttribute('data-product-slug') || '{{PRODUCT_SLUG}}');
      setHidden(form, 'product_id', (product && product.productId) || (product && product.slug) || '{{PRODUCT_ID}}');
      setHidden(form, 'product_category', (product && product.category) || '{{PRODUCT_CATEGORY}}');
      setHidden(form, 'product_page_url', pageUrl);
      setHidden(form, 'product_image_url', (product && product.primaryImage) || '{{PRODUCT_PRIMARY_IMAGE}}');
      setHidden(form, 'lead_source', (product && product.leadSource) || '{{LEAD_SOURCE}}');
      setHidden(form, 'campaign', (product && product.campaign) || '{{CAMPAIGN_NAME}}');
      setHidden(form, 'model_interest_tag', (product && product.ghlTag) || ('Model Interest - ' + ((product && (product.fullProductName || product.inventoryName)) || '{{PRODUCT_NAME}}')));
      setHidden(form, 'inventory_status', (product && product.inventoryStatus) || '{{PRODUCT_STATUS}}');
      setHidden(form, 'available_quantity', String((product && product.availableQuantity) || '{{AVAILABLE_QUANTITY}}'));
      setHidden(form, 'inventory_status_tag', availability.inventoryStatusTag || '{{INVENTORY_STATUS_TAG}}');
      setHidden(form, 'form_intent', availability.formIntent || '{{FORM_INTENT}}');
      setHidden(form, 'timestamp', new Date().toISOString());
      var submit = form.querySelector('[type="submit"]');
      if (submit && availability.formButton) submit.textContent = availability.formButton;
    });
    if (window.DealerLeadForm && typeof window.DealerLeadForm.bindAll === 'function') window.DealerLeadForm.bindAll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hydrateProductForms); else hydrateProductForms();
})();
