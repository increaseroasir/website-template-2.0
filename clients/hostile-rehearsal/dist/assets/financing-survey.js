(function () {
  const root = document.querySelector('[data-financing-survey]');
  if (!root) return;

  const answers = { product: '', payment: '', timeline: '' };
  let step = 1;
  const totalSteps = 4;

  function $(selector) {
    return root.querySelector(selector);
  }

  function showStep(next) {
    step = next;
    root.querySelectorAll('[data-survey-step]').forEach(panel => {
      panel.hidden = panel.getAttribute('data-survey-step') !== String(next);
    });
    const progress = $('[data-survey-progress]');
    if (progress) {
      const ratio = next === 'done' ? 1 : Math.min(next, totalSteps) / totalSteps;
      progress.style.width = Math.round(ratio * 100) + '%';
    }
    const subhead = $('[data-survey-subhead]');
    if (subhead) {
      subhead.hidden = next === 'done';
      if (next === 4) subhead.textContent = 'Last step — leave your info and we will follow up.';
      else if (next !== 'done') subhead.textContent = 'Answer 3 quick questions. Takes under a minute.';
    }
  }

  function syncHiddenFields() {
    const product = $('[data-survey-product]');
    const interest = $('[data-survey-product-interest]');
    const payment = $('[data-survey-payment]');
    const message = $('[data-survey-message]');
    const productLabel = answers.product || 'Financing Request';
    if (product) product.value = productLabel;
    if (interest) interest.value = productLabel;
    if (payment) payment.value = answers.payment || '';
    if (message) {
      message.value = [
        'Financing survey',
        'Product: ' + (answers.product || 'n/a'),
        'Target payment: ' + (answers.payment || 'n/a'),
        'Timeline: ' + (answers.timeline || 'n/a')
      ].join(' | ');
    }
  }

  root.addEventListener('click', event => {
    const answer = event.target.closest('[data-survey-answer]');
    if (answer) {
      const field = answer.getAttribute('data-field');
      const value = answer.getAttribute('data-value') || '';
      if (field) answers[field] = value;
      syncHiddenFields();
      if (step === 1) showStep(2);
      else if (step === 2) showStep(3);
      else if (step === 3) showStep(4);
      return;
    }
    if (event.target.closest('[data-survey-back]')) {
      if (step === 2) showStep(1);
      else if (step === 3) showStep(2);
      else if (step === 4) showStep(3);
    }
  });

  const form = root.querySelector('[data-template-form]');
  if (form) {
    const result = form.querySelector('[data-template-result]');
    const observer = new MutationObserver(() => {
      const text = (result && result.textContent || '').trim();
      if (!text) return;
      if (/thank you|received|already have/i.test(text)) showStep('done');
    });
    if (result) observer.observe(result, { childList: true, characterData: true, subtree: true });
    form.addEventListener('submit', () => syncHiddenFields(), true);
  }

  showStep(1);
  syncHiddenFields();
  if (window.DealerLeadForm && typeof window.DealerLeadForm.bindAll === 'function') {
    window.DealerLeadForm.bindAll();
  }
})();
