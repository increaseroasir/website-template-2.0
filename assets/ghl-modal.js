(function () {
  function panel() {
    return document.querySelector('[data-lead-panel]');
  }

  function setProductLine(productName) {
    var line = document.getElementById('ghl-product-line');
    if (!line) return;
    if (productName) {
      line.hidden = false;
      line.textContent = productName;
    } else {
      line.hidden = true;
      line.textContent = '';
    }
  }

  function open(productName) {
    var el = panel();
    if (!el) return;
    var field = el.querySelector('[name="product_interest"], [name="product_name"]');
    if (field) field.value = productName || '';
    setProductLine(productName || '');
    el.hidden = false;
    el.setAttribute('aria-hidden', 'false');
    el.classList.add('open');
    var focusable = el.querySelector('input,select,textarea,button');
    if (focusable) focusable.focus();
  }

  function close() {
    var el = panel();
    if (!el) return;
    el.hidden = true;
    el.setAttribute('aria-hidden', 'true');
    el.classList.remove('open');
  }

  function bindClose() {
    var el = panel();
    if (!el || el.dataset.ghlBound === '1') return;
    el.dataset.ghlBound = '1';
    var closeBtn = el.querySelector('#ghl-close, [data-close-lead], .ghl-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', close);
    el.addEventListener('click', function (event) {
      if (event.target === el) close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !el.hidden) close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindClose);
  } else {
    bindClose();
  }

  window.DealerGhlModal = { open: open, close: close };
})();
