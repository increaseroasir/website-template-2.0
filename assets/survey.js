/* Shared multi-step funnel engine for the locked full-screen survey pages
   (financing.html, quiz/index.html). Everything specific to a page — question
   count, field names, the summary line written into the lead message — comes
   from the markup, so a new funnel is a new HTML file and no new JS. */
(function () {
  const root = document.querySelector('[data-survey]');
  if (!root) return;

  const answers = {};
  const panels = Array.from(root.querySelectorAll('[data-survey-step]'));
  const questionSteps = panels
    .map(panel => Number(panel.getAttribute('data-survey-step')))
    .filter(value => !Number.isNaN(value));
  const totalSteps = questionSteps.length ? Math.max.apply(null, questionSteps) : 1;
  const questionCount = Math.max(totalSteps - 1, 1);

  const label = root.getAttribute('data-survey-label') || 'Survey';
  const fallbackLabel = root.getAttribute('data-survey-fallback') || label;
  const primaryField = root.getAttribute('data-survey-primary-field') || '';
  const subheadDefault = root.getAttribute('data-survey-subhead')
    || ('Answer ' + questionCount + ' quick questions. Takes under a minute.');
  const subheadLast = root.getAttribute('data-survey-subhead-last')
    || 'Last step — leave your info and we will follow up.';

  let step = 1;

  function $(selector) {
    return root.querySelector(selector);
  }

  function showStep(next) {
    step = next;
    panels.forEach(panel => {
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
      if (next === totalSteps) subhead.textContent = subheadLast;
      else if (next !== 'done') subhead.textContent = subheadDefault;
    }
  }

  /* The summary is the only place a rep sees the answers, so it is assembled in
     the order the questions were asked, using each step's own wording. */
  function summaryLine() {
    const parts = [label];
    panels.forEach(panel => {
      const field = panel.getAttribute('data-survey-field');
      if (!field) return;
      const fieldLabel = panel.getAttribute('data-survey-field-label') || field;
      parts.push(fieldLabel + ': ' + (answers[field] || 'n/a'));
    });
    return parts.join(' | ');
  }

  function syncHiddenFields() {
    const productLabel = (primaryField && answers[primaryField]) || fallbackLabel;
    const product = $('[data-survey-product]');
    const interest = $('[data-survey-product-interest]');
    const payment = $('[data-survey-payment]');
    const message = $('[data-survey-message]');
    if (product) product.value = productLabel;
    if (interest) interest.value = productLabel;
    if (payment) {
      const paymentField = payment.getAttribute('data-survey-payment') || 'payment';
      payment.value = answers[paymentField] || '';
    }
    if (message) message.value = summaryLine();
  }

  root.addEventListener('click', event => {
    const answer = event.target.closest('[data-survey-answer]');
    if (answer) {
      const field = answer.getAttribute('data-field');
      if (field) answers[field] = answer.getAttribute('data-value') || '';
      syncHiddenFields();
      if (typeof step === 'number' && step < totalSteps) showStep(step + 1);
      return;
    }
    if (event.target.closest('[data-survey-back]')) {
      if (typeof step === 'number' && step > 1) showStep(step - 1);
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
