(function () {
  window.DealerGhlModal = {
    open: function (productName) {
      var panel = document.querySelector('[data-lead-panel]');
      if (!panel) return;
      var field = panel.querySelector('[name="product_interest"], [name="product_name"]');
      if (field) field.value = productName || '';
      panel.hidden = false;
    },
    close: function () {
      var panel = document.querySelector('[data-lead-panel]');
      if (panel) panel.hidden = true;
    }
  };
})();
