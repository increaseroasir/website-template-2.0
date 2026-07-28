(function () {
  var cfg = window.CLIENT_CONFIG || {};
  var tracking = cfg.tracking || {};
  function real(value) { return value && String(value).indexOf('{{') === -1; }
  if (real(tracking.clarityId)) {
    (function(c,l,a,r,i,t,y){ c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)}; t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i; y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y); })(window, document, 'clarity', 'script', tracking.clarityId);
  }
  if (real(tracking.ga4Id)) {
    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(tracking.ga4Id);
    document.head.appendChild(ga);
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', tracking.ga4Id);
  }
  /* GHL External Tracking (session stitching + page-view attribution into the
     client's sub-account). Loads immediately with the other pixels — NEVER on
     a deferral: page-view tracking that loads late misses the page view.
     Value = the src URL from the per-location External Tracking snippet.
     Empty/tokenized → nothing injected (same strip pattern as the GSC meta). */
  if (real(tracking.ghlExternalTracking) && /^https:\/\//.test(tracking.ghlExternalTracking)) {
    var ghlx = document.createElement('script');
    ghlx.async = true;
    ghlx.defer = true;
    ghlx.src = tracking.ghlExternalTracking;
    document.head.appendChild(ghlx);
  }
  /* Fallback only: the build hardcodes the pixel into every page (see
     build-config.mjs injectMetaPixel). When that ran, fbq already exists and
     this block skips — otherwise init + PageView would fire twice. */
  if (real(tracking.metaPixelId) && !window.fbq) {
    !function(f,b,e,v,n,t,s){ if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)}; if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0'; n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s); }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', tracking.metaPixelId);
    fbq('track', 'PageView');
  }
})();
