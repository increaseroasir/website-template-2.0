(function () {
  var body = document.body;
  var cfg = window.CLIENT_CONFIG || {};
  var prefix = (cfg.client && cfg.client.storagePrefix) || 'dealer_template';
  var STORAGE_KEY = body.getAttribute('data-gate-storage-key') || (prefix + '_inventory_unlocked');
  var STORAGE_TS = STORAGE_KEY + '_at';
  var TTL_MS = Number(body.getAttribute('data-gate-ttl-ms') || 30 * 24 * 60 * 60 * 1000);
  function isUnlocked() {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') return false;
      var ts = parseInt(localStorage.getItem(STORAGE_TS), 10);
      return !ts || Date.now() - ts < TTL_MS;
    } catch (err) { return false; }
  }
  function persistUnlock() {
    try { localStorage.setItem(STORAGE_KEY, '1'); localStorage.setItem(STORAGE_TS, String(Date.now())); sessionStorage.setItem(STORAGE_KEY + '_session', '1'); } catch (err) {}
  }
  function trackUnlock() {
    if (typeof gtag === 'function') gtag('event', 'inventory_unlock', { event_category: 'engagement', page_path: location.pathname || '/' });
    if (typeof clarity === 'function') clarity('event', 'inventory_unlock');
  }
  function applyUnlocked(skipTrack) {
    var unlockedPath = body.getAttribute('data-gate-unlocked-path');
    if (unlockedPath && location.pathname.replace(/\/$/, '') !== unlockedPath.replace(/\/$/, '')) { if (!skipTrack) trackUnlock(); location.replace(unlockedPath); return; }
    body.classList.remove('inventory-locked'); body.classList.add('inventory-unlocked');
    var gate = document.getElementById('inventory-gate'); if (gate) gate.hidden = true;
    if (!skipTrack) trackUnlock();
  }
  function applyLocked() { body.classList.add('inventory-locked'); body.classList.remove('inventory-unlocked'); var gate = document.getElementById('inventory-gate'); if (gate) gate.hidden = false; }
  function init() { var params = new URLSearchParams(location.search); if (params.get('inventory_unlocked') === '1') { persistUnlock(); applyUnlocked(true); history.replaceState && history.replaceState({}, '', location.pathname); return; } isUnlocked() ? applyUnlocked(true) : applyLocked(); }
  if (document.getElementById('inventory-gate')) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); }
  window.DealerInventoryGate = { unlock: function () { persistUnlock(); applyUnlocked(); }, isUnlocked: isUnlocked, storageKey: STORAGE_KEY };
})();
