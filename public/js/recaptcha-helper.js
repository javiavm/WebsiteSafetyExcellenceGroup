/**
 * recaptcha-helper.js
 * Safety Excellence Group
 *
 * Loads Google reCAPTCHA v3 and automatically injects a captcha_token
 * into every fetch() POST to /api/forms/* — no changes needed in form code.
 */
(function () {
    'use strict';

    var siteKey = null;
    var scriptReady = false;
    var pendingResolvers = [];

    /* ── 1. Fetch site key from backend ──────────────────────────── */
    fetch('/api/public-config')
        .then(function (r) { return r.json(); })
        .then(function (cfg) {
            if (!cfg.recaptchaSiteKey) return; // key not configured yet — skip
            siteKey = cfg.recaptchaSiteKey;
            loadScript();
        })
        .catch(function () { /* server unreachable — skip */ });

    /* ── 2. Inject reCAPTCHA v3 script ───────────────────────────── */
    function loadScript() {
        if (document.getElementById('recaptcha-v3-script')) return;
        var s = document.createElement('script');
        s.id = 'recaptcha-v3-script';
        s.src = 'https://www.google.com/recaptcha/api.js?render=' + siteKey;
        s.async = true;
        s.defer = true;
        s.onload = function () {
            grecaptcha.ready(function () {
                scriptReady = true;
                pendingResolvers.forEach(function (resolve) { resolve(); });
                pendingResolvers = [];
            });
        };
        document.head.appendChild(s);
    }

    /* ── 3. Get a fresh token ─────────────────────────────────────── */
    function getToken(action) {
        return new Promise(function (resolve) {
            if (!siteKey) { resolve(''); return; }
            function execute() {
                grecaptcha.execute(siteKey, { action: action || 'submit' })
                    .then(resolve)
                    .catch(function () { resolve(''); });
            }
            if (scriptReady) {
                execute();
            } else {
                pendingResolvers.push(execute);
            }
        });
    }

    /* Expose for manual use if ever needed */
    window.getRecaptchaToken = getToken;

    /* ── 4. Fetch interceptor — auto-inject token into form POSTs ── */
    var _fetch = window.fetch;
    window.fetch = function (url, options) {
        var urlStr = typeof url === 'string' ? url : (url && url.url) || '';

        // Only intercept POST requests to our own form endpoints
        if (
            options &&
            options.method &&
            options.method.toUpperCase() === 'POST' &&
            urlStr.indexOf('/api/forms/') !== -1
        ) {
            return getToken('submit').then(function (token) {
                try {
                    var body = JSON.parse(options.body || '{}');
                    body.captcha_token = token;
                    options = Object.assign({}, options, { body: JSON.stringify(body) });
                    options.headers = Object.assign({}, options.headers || {}, {
                        'Content-Type': 'application/json'
                    });
                } catch (e) {
                    // body wasn't JSON — leave it alone
                }
                return _fetch(url, options);
            });
        }

        return _fetch(url, options);
    };

    /* ── 5. Hide reCAPTCHA badge (GDPR-friendly — keep privacy notice) */
    var badgeStyle = document.createElement('style');
    badgeStyle.textContent = '.grecaptcha-badge { visibility: hidden !important; }';
    document.head.appendChild(badgeStyle);

})();
