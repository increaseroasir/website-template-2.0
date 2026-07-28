(function () {
  function cfg(path, fallback) {
    var cur = window.CLIENT_CONFIG || {};
    path.split('.').forEach(function (part) { cur = cur && cur[part]; });
    return cur || fallback || '';
  }
  function fieldId(prefix, name) { return prefix + name; }
  function honeypot(prefix) {
    var id = fieldId(prefix, 'website_url');
    return '<div class="inventory-gate-form-honeypot" aria-hidden="true"><label for="' + id + '">Website</label><input type="text" id="' + id + '" name="website_url" tabindex="-1" autocomplete="off"></div>';
  }
  function financingField(prefix, required) {
    var id = fieldId(prefix, 'financing_interest');
    return '<label for="' + id + '">Would you like to apply for financing?</label><select id="' + id + '" name="financing_interest"' + (required !== false ? ' required' : '') + '><option value="">Select one...</option><option value="yes">Yes - send financing options</option><option value="maybe">Maybe - I would like more info</option><option value="no">No - not right now</option></select>';
  }
  function hiddenProductFields(prefix) {
    return ['product_name','product_slug','product_id','product_category','product_page_url','product_image_url','inventory_status','available_quantity','inventory_status_tag','lead_source','campaign','model_interest_tag','form_intent'].map(function (name) {
      return '<input type="hidden" name="' + name + '" id="' + fieldId(prefix, name) + '" value="">';
    }).join('');
  }
  function contactFields(prefix, showMessage) {
    var html = '<label for="' + fieldId(prefix, 'full_name') + '">Full name</label><input type="text" id="' + fieldId(prefix, 'full_name') + '" name="full_name" autocomplete="name" required placeholder="Full name"><label for="' + fieldId(prefix, 'email') + '">Email</label><input type="email" id="' + fieldId(prefix, 'email') + '" name="email" autocomplete="email" required placeholder="you@email.com"><label for="' + fieldId(prefix, 'phone') + '">Phone</label><input type="tel" id="' + fieldId(prefix, 'phone') + '" name="phone" autocomplete="tel" required placeholder="Phone number">';
    if (showMessage) html += '<label for="' + fieldId(prefix, 'message') + '">How can we help?</label><textarea id="' + fieldId(prefix, 'message') + '" name="message" rows="4" placeholder="Tell us what you are looking for"></textarea>';
    return html;
  }
  function render(container) {
    var source = container.getAttribute('data-lead-source') || 'website-form';
    var submitLabel = container.getAttribute('data-submit-label') || 'Send Request';
    var success = container.getAttribute('data-lead-success') || 'thank-you';
    var prefix = container.getAttribute('data-field-prefix') || (source.replace(/[^a-z0-9]+/gi, '-') + '-');
    var disclaimer = container.getAttribute('data-disclaimer') || cfg('client.leadDisclaimer', 'By submitting, I consent to receive calls, texts, and emails from this dealer. Consent is not required to purchase.');
    /* No visible security checker (TVD-025): customer-facing forms never gate on
       a captcha. Spam control = honeypot + server-side dedupe/fail-open tagging. */
    container.innerHTML = '<p class="inventory-gate-form-error dealer-lead-error" hidden></p><form class="form-grid" data-lead-form data-lead-source="' + source + '" data-lead-success="' + success + '" novalidate>' + honeypot(prefix) + hiddenProductFields(prefix) + (container.getAttribute('data-show-financing') === 'true' ? financingField(prefix, container.getAttribute('data-financing-required') !== 'false') : '') + contactFields(prefix, container.getAttribute('data-show-message') === 'true') + '<button class="btn btn-gold" type="submit">' + submitLabel + '</button><p class="fine-print">' + disclaimer + '</p><p class="fine-print" data-template-result></p></form>';
    container.classList.add('is-ready');
  }
  window.DealerNativeForm = { render: render, renderAll: function () { document.querySelectorAll('[data-native-form]').forEach(render); if (window.DealerLeadForm && typeof window.DealerLeadForm.bindAll === 'function') window.DealerLeadForm.bindAll(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.DealerNativeForm.renderAll); else window.DealerNativeForm.renderAll();
})();
