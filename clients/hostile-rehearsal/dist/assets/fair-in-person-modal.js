(function () {
  window.DealerVisitModal = {
    showConfirmed: function () {
      var target = document.querySelector('[data-visit-confirmed]');
      if (target) target.hidden = false;
    }
  };
})();
