(function () {
  var cfg = window.CLIENT_CONFIG || {};
  var prefix = (cfg.client && cfg.client.storagePrefix) || 'dealer_template';
  var KEY = prefix + '_traffic_channel';
  var ATTR_KEY = prefix + '_traffic_attribution';
  function referrerHost() { try { return document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch (err) { return ''; } }
  function siteHost() { try { return new URL((cfg.client && cfg.client.websiteUrl) || window.location.origin).hostname.toLowerCase(); } catch (err) { return window.location.hostname.toLowerCase(); } }
  function isSiteHost(host) { return host && host === siteHost(); }
  function isSearchEngine(host) { return /google\.|bing\.|duckduckgo\.|yahoo\.|search\.|ecosia\.|ask\.com/.test(host); }
  function isPaidSocialHost(host) { return /facebook\.com|instagram\.com|fb\.com/.test(host); }
  function classifyTraffic() { var params = new URLSearchParams(window.location.search); if (params.get('fbclid') || params.get('gclid') || params.get('msclkid')) return 'paid'; var medium = (params.get('utm_medium') || '').toLowerCase(); var source = (params.get('utm_source') || '').toLowerCase(); if (['cpc','ppc','paid','paidsocial','paid-social','cpm','display'].includes(medium)) return 'paid'; if (medium === 'organic') return 'organic'; if (['facebook','fb','instagram','ig','meta'].includes(source) && (!medium || ['paid','cpc','paidsocial','social'].includes(medium))) return 'paid'; var host = referrerHost(); if (host && isSiteHost(host)) return 'internal'; if (host && isSearchEngine(host)) return 'organic'; if (host && isPaidSocialHost(host)) return 'paid'; return host ? 'referral' : 'direct'; }
  function readAttribution() { var params = new URLSearchParams(window.location.search); return { traffic_channel: classifyTraffic(), landing_page_url: window.location.href, referrer_url: document.referrer || '', utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '', utm_content: params.get('utm_content') || '', utm_term: params.get('utm_term') || '', fbclid: params.get('fbclid') || '', gclid: params.get('gclid') || '', msclkid: params.get('msclkid') || '' }; }
  function storedAttribution() { try { var raw = sessionStorage.getItem(ATTR_KEY); return raw ? JSON.parse(raw) : null; } catch (err) { return null; } }
  function captureTraffic() { try { if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, classifyTraffic()); if (!sessionStorage.getItem(ATTR_KEY)) sessionStorage.setItem(ATTR_KEY, JSON.stringify(readAttribution())); } catch (err) {} }
  captureTraffic();
  window.DealerTraffic = { getChannel: function(){ try { return sessionStorage.getItem(KEY) || classifyTraffic(); } catch (err) { return classifyTraffic(); } }, getAttribution: function(){ return storedAttribution() || readAttribution(); }, capture: captureTraffic };
})();
