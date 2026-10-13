/**
 * AegisAI — voice widget
 * Safety Excellence Group
 *
 * Ported from the ModArch "Maia" voicebot:
 *   - Primary: realtime audio over Gemini Live (WebSocket, 16 kHz mic in / 24 kHz audio out),
 *     authenticated with a short-lived token from POST /api/voice-token.
 *   - Fallback (when the server has no GEMINI_API_KEY or the line cannot open): the browser's
 *     Web Speech API + SEG's existing /api/chat backend, so voice keeps working.
 */
(function () {
    'use strict';

    var IN_RATE = 16000;
    var OUT_RATE = 24000;
    var MAX_CALL_MS = 10 * 60 * 1000;
    var BARS = 72;
    var GREETING = 'Greet the caller briefly with this exact identity: "Hi, I\'m AegisAI, Safety Excellence Group\'s AI safety intelligence agent." ' +
        'Briefly explain that you can help with OSHA regulations, SEMI S2 compliance, Precision Placement, audits, and program development. ' +
        'Then ask how you can help. Never use any other name.';
    var IDLE_SUB = 'Safety questions · Booking · Proposals';

    var RECORDER_WORKLET =
        'class Rec extends AudioWorkletProcessor{constructor(){super();this.buf=new Float32Array(2048);this.n=0;}' +
        'process(inputs){var ch=inputs[0]&&inputs[0][0];if(!ch)return true;' +
        'for(var i=0;i<ch.length;i++){this.buf[this.n++]=ch[i];if(this.n===this.buf.length){this.port.postMessage(this.buf.slice(0));this.n=0;}}' +
        'return true;}}registerProcessor("rec",Rec);';

    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var synth = window.speechSynthesis;

    var ICONS = {
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/></svg>'
    };

    var $ = function (s, root) { return (root || document).querySelector(s); };

    var panel, menu, els, ctx2d, dockBtn, logoLayer, globeLayer, energySprite, brandLogoURL, introTimer, lastVisualFrame = 0;
    var visualMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var S = {
        ws: null, micCtx: null, outCtx: null, stream: null, node: null,
        analyserIn: null, analyserOut: null, outGain: null, playAt: 0,
        sources: new Set(), live: false, muted: false, speaking: false,
        startedAt: 0, timerId: null, maxId: null, raf: null,
        lastRole: null, lastLine: null, captions: [], captionPage: 0,
        // fallback (Web Speech) state
        mode: null, recognition: null, listening: false, sessionId: null
    };

    // ---- helpers ----------------------------------------------------------
    function toBase64(bytes) {
        var bin = '';
        for (var i = 0; i < bytes.length; i += 0x8000) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        return btoa(bin);
    }
    function fromBase64(b64) {
        var bin = atob(b64);
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return bytes;
    }
    function resample(input, from, to) {
        if (from === to) return input;
        var ratio = from / to;
        var out = new Float32Array(Math.round(input.length / ratio));
        for (var i = 0; i < out.length; i++) {
            var pos = i * ratio, idx = Math.floor(pos), frac = pos - idx;
            var a = input[idx] || 0;
            var b = input[idx + 1] !== undefined ? input[idx + 1] : a;
            out[i] = a + (b - a) * frac;
        }
        return out;
    }
    function floatToPcm16(input) {
        var out = new Int16Array(input.length);
        for (var i = 0; i < input.length; i++) {
            var s = Math.max(-1, Math.min(1, input[i]));
            out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        return out;
    }

    function ensureFonts() {
        if (document.getElementById('aw-fonts')) return;
        var l = document.createElement('link');
        l.id = 'aw-fonts';
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Instrument+Serif&display=swap';
        document.head.appendChild(l);
    }
    function ensureDock() {
        var d = $('.aw-dock');
        if (!d) {
            d = document.createElement('div');
            d.className = 'aw-dock';
            document.body.appendChild(d);
        }
        return d;
    }
    function syncDock() {
        var d = $('.aw-dock');
        if (d) d.classList.toggle('is-panel-open', !!$('.aw-panel.is-open'));
    }

    // ---- build ------------------------------------------------------------
    function build() {
        if ($('#aw-voice-panel')) return;
        ensureFonts();
        var dock = ensureDock();

        dockBtn = document.createElement('button');
        dockBtn.className = 'aw-dock-btn';
        dockBtn.type = 'button';
        dockBtn.dataset.aw = 'voice';
        dockBtn.setAttribute('aria-label', 'Open AegisAI assistance menu');
        dockBtn.setAttribute('aria-controls', 'aw-menu-panel');
        dockBtn.setAttribute('aria-expanded', 'false');
        dockBtn.innerHTML = '<span class="aw-dock-tip aw-voice-intro" aria-hidden="true"><strong>Talk to AegisAI</strong><span>Your safety assistant</span></span><img class="aw-voice-logo" src="/images/Aegis%20logo-15.png" alt="">';
        dockBtn.addEventListener('click', toggleMenu);
        dock.appendChild(dockBtn);
        function showIntroduction() {
            clearTimeout(introTimer);
            dockBtn.classList.add('is-intro-visible');
            introTimer = setTimeout(function () { dockBtn.classList.remove('is-intro-visible'); }, 30000);
        }
        showIntroduction();
        window.addEventListener('pageshow', function (event) { if (event.persisted) showIntroduction(); });

        panel = document.createElement('div');
        panel.className = 'aw-panel';
        panel.id = 'aw-voice-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Voice conversation with AegisAI');
        panel.innerHTML =
            '<div class="aw-head">' +
                '<span class="aw-avatar aw-voice-avatar" aria-hidden="true"><img src="/images/Aegis%20logo-15.png" alt=""></span>' +
                '<div class="aw-title"><b>AegisAI · Voice Agent</b><span id="aw-voice-state" aria-live="polite">Ready to talk</span></div>' +
                '<button class="aw-hub-back" type="button" aria-label="Back to AegisAI menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14 5-7 7 7 7"/></svg></button>' +
                '<button class="aw-close" type="button" aria-label="Close call">' + ICONS.close + '</button>' +
            '</div>' +
            '<div class="aw-voice-body" data-lenis-prevent>' +
                '<div class="aw-orb">' +
                    '<img id="aw-voice-core" src="/images/Aegis%20logo-15.png" alt="" aria-hidden="true">' +
                    '<canvas id="aw-voice-viz" width="480" height="320" aria-hidden="true"></canvas>' +
                '</div>' +
                '<div class="aw-voice-status"><b id="aw-voice-headline">Talk to AegisAI</b><span id="aw-voice-sub">' + IDLE_SUB + '</span></div>' +
                '<div class="aw-voice-features"><button type="button" data-voice-chat><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4v5c0 5-8 9-8 9S4 17 4 12V7zM8 12l3 3 5-6"/></svg>Safety guidance</button><a href="/services.html#assessments"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/></svg>Standards &amp; regulations</a><button type="button" data-voice-book><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h2m4 0h2M7 18h2"/></svg>Expert booking</button></div>' +
                '<div class="aw-timer" id="aw-voice-timer" hidden>00:00</div>' +
                '<div class="aw-transcript" id="aw-voice-transcript" aria-live="polite" aria-label="Conversation captions" data-lenis-prevent></div>' +
                '<div class="aw-voice-err" id="aw-voice-err" role="alert"></div>' +
            '</div>' +
            '<div>' +
                '<div class="aw-controls">' +
                    '<button class="aw-ctl" id="aw-voice-mute" type="button" aria-label="Mute microphone" hidden>' + ICONS.mic + '</button>' +
                    '<button class="aw-btn" id="aw-voice-toggle" type="button">Start Voice Conversation</button>' +
                    '<button class="aw-ctl" id="aw-voice-captions" type="button" aria-label="Show transcript" aria-controls="aw-voice-transcript" aria-expanded="false" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/></svg></button>' +
                '</div>' +
                '<div class="aw-voice-foot">S.E.G. · <a id="aw-voice-book" href="#">Book a demo</a></div>' +
            '</div>';
        document.body.appendChild(panel);

        els = {
            core: $('#aw-voice-core'),
            state: $('#aw-voice-state'),
            headline: $('#aw-voice-headline'),
            sub: $('#aw-voice-sub'),
            timer: $('#aw-voice-timer'),
            err: $('#aw-voice-err'),
            transcript: $('#aw-voice-transcript'),
            toggle: $('#aw-voice-toggle'),
            mute: $('#aw-voice-mute'),
            canvas: $('#aw-voice-viz')
        };
        ctx2d = els.canvas.getContext('2d');
        els.transcript.innerHTML = '<div class="aw-line"><span></span><p></p></div><nav class="aw-caption-pages" aria-label="Transcript pages"><button type="button" aria-label="Previous transcript page">Previous</button><span></span><button type="button" aria-label="Next transcript page">Next</button></nav>';
        var captionButtons = els.transcript.querySelectorAll('button');
        captionButtons[0].addEventListener('click', function () { S.captionPage--; renderCaptions(false); });
        captionButtons[1].addEventListener('click', function () { S.captionPage++; renderCaptions(false); });

        $('.aw-close', panel).addEventListener('click', close);
        $('.aw-hub-back', panel).addEventListener('click', function (event) { event.stopPropagation(); openMenu(); });
        els.toggle.addEventListener('click', function () { (S.live || S.ws || S.mode) ? stop() : start(); });
        els.mute.addEventListener('click', toggleMute);
        $('#aw-voice-book').addEventListener('click', openBooking);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panel.classList.contains('is-open')) close();
        });
        // Click outside the widget minimizes it (composedPath survives nodes removed during the click)
        document.addEventListener('click', function (e) {
            if (!panel.classList.contains('is-open')) return;
            var path = e.composedPath ? e.composedPath() : [];
            var inside = path.some(function (n) {
                return n === panel || (n.classList && (n.classList.contains('aw-dock') || n.classList.contains('aw-modal')));
            });
            if (!inside) minimize();
        });

        panel.dataset.state = 'ready';
        buildMenu();
        loadParticleLogo();
        $('#aw-voice-captions').addEventListener('click', function () {
            var expanded = panel.classList.toggle('show-transcript');
            this.setAttribute('aria-expanded', String(expanded));
            this.setAttribute('aria-label', expanded ? 'Hide transcript' : 'Show transcript');
        });
        $('[data-voice-book]', panel).addEventListener('click', openBooking);
        $('[data-voice-chat]', panel).addEventListener('click', function (event) {
            event.stopPropagation(); minimize();
            if (window.AEGIS && window.AEGIS.open) window.AEGIS.open();
        });
        document.addEventListener('visibilitychange', function () { setVideo(panel.classList.contains('is-open')); });
        visualMotion.addEventListener('change', function () { setVideo(panel.classList.contains('is-open')); });
    }

    // ---- shared assistance menu -------------------------------------------
    function buildMenu() {
        var icons = {
            chat: '<svg viewBox="0 0 24 24"><path d="M3 4h18v13H9l-6 4zM7 9h1m3 0h1m3 0h1"/></svg>',
            calendar: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h2m4 0h2"/></svg>',
            document: '<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/></svg>',
            people: '<svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="3"/><path d="M3 21v-4a5 5 0 0 1 10 0v4M16 4a3 3 0 0 1 0 6M16 14a5 5 0 0 1 5 5v2"/></svg>'
        };
        menu = document.createElement('div');
        menu.className = 'aw-panel'; menu.id = 'aw-menu-panel';
        menu.setAttribute('role', 'dialog'); menu.setAttribute('aria-label', 'AegisAI assistance menu');
        menu.innerHTML = '<div class="aw-head"><span class="aw-avatar aw-menu-avatar" aria-hidden="true"><img src="/images/Aegis%20logo-15.png" alt=""></span>' +
            '<div class="aw-title"><b>AegisAI</b><span>How can I help?</span></div>' +
            '<button class="aw-close" type="button" aria-label="Close assistance menu">' + ICONS.close + '</button></div>' +
            '<div class="aw-menu-options">' +
            '<button type="button" data-aegis-option="voice">' + ICONS.mic + '<span>Talk to AegisAI by voice</span></button>' +
            '<button type="button" data-aegis-option="chat">' + icons.chat + '<span>Ask a safety question</span></button>' +
            '<button type="button" data-aegis-option="booking">' + icons.calendar + '<span>Book an expert call</span></button>' +
            '<button type="button" data-aegis-option="proposal">' + icons.document + '<span>Get a proposal</span></button>' +
            '<a href="/about-us.html">' + icons.people + '<span>Learn about S.E.G.</span></a></div>';
        document.body.appendChild(menu);
        menu.addEventListener('click', function (event) { event.stopPropagation(); });
        $('.aw-close', menu).addEventListener('click', function () { closeMenu(); dockBtn.focus(); });
        menu.querySelectorAll('[data-aegis-option]').forEach(function (button) {
            button.addEventListener('click', function () {
                var action = button.dataset.aegisOption;
                closeMenu();
                if (action === 'voice') { open(); els.toggle.focus(); }
                if (action === 'chat' && window.AEGIS) window.AEGIS.open();
                if (action === 'booking') openBooking();
                if (action === 'proposal') {
                    close();
                    if (typeof window.openModal === 'function' && document.getElementById('clientModal')) window.openModal('clientModal');
                    else if (window.AEGIS) {
                        window.AEGIS.open();
                        var input = document.getElementById('aw-input');
                        if (input) input.value = 'I would like to request a proposal.';
                    }
                }
            });
        });
        menu.addEventListener('keydown', function (event) {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
            event.preventDefault();
            var options = Array.from(menu.querySelectorAll('.aw-menu-options > *'));
            var index = options.indexOf(document.activeElement);
            options[(index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length].focus();
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); dockBtn.focus(); }
        });
        document.addEventListener('click', function (event) {
            if (!menu.classList.contains('is-open')) return;
            var path = event.composedPath();
            if (!path.some(function (node) { return node === menu || (node.classList && (node.classList.contains('aw-dock') || node.classList.contains('aw-panel'))); })) closeMenu();
        });
    }
    function closeMenu() {
        if (!menu) return;
        menu.classList.remove('is-open');
        dockBtn.setAttribute('aria-expanded', 'false'); syncDock();
    }
    function openMenu() {
        if (!menu) return;
        minimize();
        if (window.AEGIS) window.AEGIS.close();
        menu.classList.add('is-open'); dockBtn.setAttribute('aria-expanded', 'true'); syncDock();
        menu.querySelector('.aw-menu-options button').focus();
    }
    function toggleMenu() {
        if (menu && menu.classList.contains('is-open')) { closeMenu(); return; }
        openMenu();
    }

    // ---- status / transcript ---------------------------------------------
    function status(main, sub, head) {
        els.state.textContent = main;
        panel.dataset.state = /speaking/i.test(main) ? 'speaking' : /listening|on call/i.test(main) ? 'listening' : /thinking|connecting|linking/i.test(main) ? 'processing' : /muted/i.test(main) ? 'muted' : 'ready';
        if (!head && panel.dataset.state !== 'ready' && panel.dataset.state !== 'muted') {
            head = panel.dataset.state === 'listening' ? 'Listening...' : panel.dataset.state === 'speaking' ? 'AegisAI is speaking' : 'Analyzing your question...';
        }
        if (sub) els.sub.textContent = sub;
        if (head) els.headline.textContent = head;
    }
    function error(msg) { els.err.textContent = msg || ''; }

    function line(role, text, interim) {
        if (!text || !text.trim()) return;
        if (S.lastRole === role && S.lastLine && !interim) {
            S.lastLine.text += text;
        } else {
            var el = { role: role, text: text };
            S.captions.push(el);
            S.lastRole = role;
            S.lastLine = el;
        }
        renderCaptions(true);
    }
    // Short caption pages keep every word accessible without a scrolling surface.
    function renderCaptions(followLatest) {
        var pages = [];
        S.captions.forEach(function (entry) {
            var remaining = entry.text;
            while (remaining.length) {
                var end = Math.min(120, remaining.length);
                if (end < remaining.length) {
                    var space = remaining.lastIndexOf(' ', end);
                    if (space > 60) end = space + 1;
                }
                pages.push({ role: entry.role, text: remaining.slice(0, end) });
                remaining = remaining.slice(end);
            }
        });
        S.captionPage = followLatest ? Math.max(0, pages.length - 1) : Math.max(0, Math.min(S.captionPage, pages.length - 1));
        var page = pages[S.captionPage];
        var item = els.transcript.querySelector('.aw-line');
        item.className = 'aw-line is-' + (page ? page.role : 'agent');
        item.querySelector('span').textContent = page ? (page.role === 'user' ? 'You' : 'AegisAI') : '';
        item.querySelector('p').textContent = page ? page.text : '';
        var nav = els.transcript.querySelector('nav');
        nav.querySelector('span').textContent = (pages.length ? S.captionPage + 1 : 0) + ' / ' + pages.length;
        nav.querySelectorAll('button')[0].disabled = S.captionPage === 0;
        nav.querySelectorAll('button')[1].disabled = S.captionPage >= pages.length - 1;
    }
    function tickTimer() {
        var s = Math.floor((Date.now() - S.startedAt) / 1000);
        els.timer.textContent = String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    }

    // ---- orb visualizer ---------------------------------------------------
    function loadParticleLogo() {
        var image = new Image();
        image.onload = function () {
            var sample = document.createElement('canvas'); sample.width = 256;
            sample.height = Math.round(256 * image.height / image.width);
            var sampling = sample.getContext('2d', { willReadFrequently: true });
            sampling.drawImage(image, 0, 0, sample.width, sample.height);
            var pixels = sampling.getImageData(0, 0, sample.width, sample.height).data;
            var points = [], minX = 256, minY = 256, maxX = 0, maxY = 0;
            for (var y = 0; y < sample.height; y++) for (var x = 0; x < sample.width; x++) {
                if (pixels[(y * sample.width + x) * 4 + 3] < 110) continue;
                points.push([x, y]); minX = Math.min(minX, x); minY = Math.min(minY, y);
                maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
            }
            if (!points.length) return;
            logoLayer = document.createElement('canvas'); logoLayer.width = logoLayer.height = 336;
            var drawing = logoLayer.getContext('2d');
            // Render the original PNG alpha at native detail; particles never redefine its outline.
            var cropX = minX * image.width / sample.width, cropY = minY * image.height / sample.height;
            var cropW = (maxX - minX + 1) * image.width / sample.width;
            var cropH = (maxY - minY + 1) * image.height / sample.height;
            drawing.drawImage(image, cropX, cropY, cropW, cropH, 83, 83, 170, 170);
            drawing.globalCompositeOperation = 'source-in'; drawing.fillStyle = '#ffb33f';
            drawing.fillRect(0, 0, 336, 336); drawing.globalCompositeOperation = 'source-over';
            energySprite = document.createElement('canvas'); energySprite.width = energySprite.height = 48;
            var glowContext = energySprite.getContext('2d');
            var glow = glowContext.createRadialGradient(24, 24, 0, 24, 24, 24);
            glow.addColorStop(0, '#fff0b9'); glow.addColorStop(.12, '#ffbc40');
            glow.addColorStop(.35, '#ff790078'); glow.addColorStop(1, '#ff790000');
            glowContext.fillStyle = glow; glowContext.fillRect(0, 0, 48, 48);
            globeLayer = document.createElement('canvas'); globeLayer.width = globeLayer.height = 336;
            var globe = globeLayer.getContext('2d');
            var halo = globe.createRadialGradient(168, 168, 0, 168, 168, 142);
            halo.addColorStop(0, '#ff790000'); halo.addColorStop(.58, '#ff790000');
            halo.addColorStop(.72, '#ff790014'); halo.addColorStop(.81, '#ff9c006a');
            halo.addColorStop(.9, '#ff790025'); halo.addColorStop(1, '#ff790000');
            globe.fillStyle = halo; globe.fillRect(0, 0, 336, 336);
            var nodes = [];
            for (var i = 0; i < 280; i++) {
                var depth = 1 - 2 * (i + .5) / 280;
                var plane = Math.sqrt(1 - depth * depth), angle = i * 2.399963;
                nodes.push({ x: 168 + Math.cos(angle) * plane * 116,
                    y: 168 + Math.sin(angle) * plane * 116, depth: depth });
            }
            globe.lineWidth = .6;
            for (var n = 0; n < nodes.length; n++) {
                var node = nodes[n];
                globe.strokeStyle = node.depth > 0 ? '#ff9b004a' : '#348cc129';
                globe.beginPath();
                for (var m = n + 1; m < Math.min(n + 24, nodes.length); m++) {
                    var neighbor = nodes[m];
                    if (Math.hypot(node.x - neighbor.x, node.y - neighbor.y) < 31
                        && Math.abs(node.depth - neighbor.depth) < .2) {
                        globe.moveTo(node.x, node.y); globe.lineTo(neighbor.x, neighbor.y);
                    }
                }
                globe.stroke();
                globe.globalAlpha = .35 + Math.abs(node.depth) * .5;
                globe.drawImage(energySprite, node.x - 4, node.y - 4, 8, 8);
                globe.globalAlpha = 1;
            }
            var logoURL = logoLayer.toDataURL();
            brandLogoURL = logoURL;
            document.dispatchEvent(new Event('aegis-brand-ready'));
            $('.aw-voice-avatar img', panel).src = logoURL;
            $('.aw-voice-logo', dockBtn).src = logoURL;
            $('.aw-menu-avatar img', menu).src = logoURL;
            panel.classList.add('has-particle-logo');
            setVideo(panel.classList.contains('is-open'));
        };
        image.src = '/images/Aegis%20logo-15.png';
    }

    function draw(time) {
        S.raf = null;
        if (!panel.classList.contains('is-open') || document.hidden) return;
        if (!visualMotion.matches && lastVisualFrame && time - lastVisualFrame < 1000 / 30) {
            S.raf = requestAnimationFrame(draw); return;
        }
        lastVisualFrame = time || 0;
        var w = els.canvas.width, h = els.canvas.height, cx = w / 2, cy = h / 2;
        var t = visualMotion.matches ? 0 : (time || performance.now()) / 1000;
        ctx2d.clearRect(0, 0, w, h);
        var speaking = S.speaking, listening = S.live || (S.mode && S.listening);
        if (speaking) panel.dataset.state = 'speaking';
        else if (listening && panel.dataset.state !== 'processing') panel.dataset.state = S.muted ? 'muted' : 'listening';
        var processing = panel.dataset.state === 'processing';
        if (globeLayer) {
            ctx2d.save(); ctx2d.translate(cx, cy); ctx2d.rotate(Math.sin(t * .12) * .12);
            ctx2d.drawImage(globeLayer, -168, -168); ctx2d.restore();
        }
        // Open energy waves cross the background; no decorative rings or orbital ellipses.
        for (var wave = 0; wave < 10; wave++) {
            ctx2d.beginPath();
            for (var step = 0; step <= 64; step++) {
                var position = step / 64;
                var wx = -12 + position * (w + 24);
                var wy = cy + Math.sin(position * 7 + wave * .67 - t * .45) * 50
                    + Math.sin(position * 15 + wave * 1.3 + t * .3) * 13 + (wave - 4.5) * 5;
                if (!step) ctx2d.moveTo(wx, wy); else ctx2d.lineTo(wx, wy);
            }
            ctx2d.strokeStyle = processing && wave % 3 === 0 ? '#299ee330' : '#ff710024';
            ctx2d.lineWidth = wave % 3 === 0 ? 4 : 2; ctx2d.stroke();
            ctx2d.strokeStyle = processing && wave % 3 === 0 ? '#45abff88' : wave % 3 === 0 ? '#ffb63bc0' : '#ff7f0059';
            ctx2d.lineWidth = wave % 3 === 0 ? 1 : .5; ctx2d.stroke();
        }
        if (speaking || (listening && !processing)) {
            var analyser = speaking ? S.analyserOut : S.analyserIn;
            var data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
            if (data) analyser.getByteFrequencyData(data);
            ctx2d.strokeStyle = '#ffb52e'; ctx2d.lineWidth = 3; ctx2d.lineCap = 'round';ctx2d.beginPath();
            for (var j = 0; j < 35; j++) {
                var value = data ? data[j + 2] / 255 : (speaking ? .3 + Math.sin(t * 2 + j * .7) * .15 : .06);
                var length = visualMotion.matches ? 8 : 8 + value * 90 * Math.sin((j + 1) / 36 * Math.PI);
                var bx = cx + (j - 17) * 6;ctx2d.moveTo(bx, cy - length);ctx2d.lineTo(bx, cy + length);
            }
            ctx2d.stroke();
        }
        ctx2d.fillStyle = '#ffbd4f';ctx2d.beginPath();
        for (var k = 0; k < 180; k++) {
            var angle = k * 2.4 + t * (.04 + (k % 5) * .008);
            var radius = 100 + Math.sin(k * 17.3) * 14 + (k % 7) * 3;
            var sx = cx + Math.cos(angle) * radius, sy = cy + Math.sin(angle) * radius;
            var dot = .6 + (k % 4) * .25;
            ctx2d.moveTo(sx + dot, sy);ctx2d.arc(sx, sy, dot, 0, Math.PI * 2);
        }
        ctx2d.fill();
        if (energySprite) {
            for (var spark = 0; spark < 30; spark++) {
                var phase = (spark * .618 + t * .012) % 1;
                var ex = phase * w;
                var ey = cy + Math.sin(phase * 7 + (spark % 10) * .67 - t * .45) * 50
                    + Math.sin(phase * 15 + (spark % 10) * 1.3 + t * .3) * 13 + ((spark % 10) - 4.5) * 5;
                ctx2d.globalAlpha = .4 + .4 * Math.sin(spark + t * .5) ** 2;
                ctx2d.drawImage(energySprite, ex - 10, ey - 10, 20, 20);
            }
            ctx2d.globalAlpha = 1;
        }
        if (logoLayer && !speaking && (!listening || processing)) {
            // Clear a quiet center so no energy strand crosses the original brand mark.
            ctx2d.fillStyle = '#030d18'; ctx2d.beginPath();ctx2d.arc(cx, cy, 53, 0, Math.PI * 2);ctx2d.fill();
            ctx2d.drawImage(logoLayer, cx - 98, cy - 98, 196, 196);
        }
        if (!visualMotion.matches) S.raf = requestAnimationFrame(draw);
    }

    // Shared visual for the chatbot welcome; reuses the cached voice brand assets.
    function renderBrand(canvas, time) {
        if (!logoLayer || !globeLayer || !energySprite) return false;
        var ctx = canvas.getContext('2d'), cx = canvas.width / 2, cy = canvas.height / 2;
        var t = visualMotion.matches ? 0 : time / 1000;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t * .12) * .12);
        ctx.drawImage(globeLayer, -168, -168); ctx.restore();
        for (var wave = 0; wave < 8; wave++) {
            ctx.beginPath();
            for (var step = 0; step <= 48; step++) {
                var f = step / 48, x = -12 + f * (canvas.width + 24);
                var y = cy + Math.sin(f * 7 + wave * .67 - t * .45) * 50
                    + Math.sin(f * 15 + wave * 1.3 + t * .3) * 13 + (wave - 3.5) * 5;
                if (!step) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = wave % 3 ? '#ff7f0060' : '#ffb63bb0'; ctx.lineWidth = wave % 3 ? .6 : 1; ctx.stroke();
        }
        ctx.fillStyle = '#ffbd4f'; ctx.beginPath();
        for (var i = 0; i < 90; i++) {
            var angle = i * 2.4 + t * .06, r = 103 + Math.sin(i * 17.3) * 15 + (i % 7) * 3;
            var x = cx + Math.cos(angle) * r, y = cy + Math.sin(angle) * r;
            ctx.moveTo(x + 1, y); ctx.arc(x, y, 1, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.fillStyle = '#030d18'; ctx.beginPath();ctx.arc(cx, cy, 53, 0, Math.PI * 2);ctx.fill();
        ctx.drawImage(logoLayer, cx - 98, cy - 98, 196, 196);
        return true;
    }

    // ---- Gemini Live playback --------------------------------------------
    function playChunk(b64) {
        if (!S.outCtx) return;
        var bytes = fromBase64(b64);
        var pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
        var f32 = new Float32Array(pcm.length);
        for (var i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;

        var buffer = S.outCtx.createBuffer(1, f32.length, OUT_RATE);
        buffer.copyToChannel(f32, 0);
        var src = S.outCtx.createBufferSource();
        src.buffer = buffer;
        src.connect(S.outGain);

        var now = S.outCtx.currentTime;
        if (S.playAt < now + 0.06) S.playAt = now + 0.06;
        src.start(S.playAt);
        S.playAt += buffer.duration;

        S.speaking = true;
        status('Speaking...', null, 'AegisAI is speaking');
        S.sources.add(src);
        src.onended = function () {
            S.sources.delete(src);
            if (!S.sources.size) { S.speaking = false; if (S.live) status('Listening...', null, 'Listening...'); }
        };
    }
    function stopPlayback() {
        S.sources.forEach(function (src) { try { src.stop(); } catch (e) {} });
        S.sources.clear();
        S.playAt = 0;
        S.speaking = false;
    }

    // ---- start ------------------------------------------------------------
    function resetIdleLabels() {
        els.toggle.disabled = false;
        status('Ready to talk', IDLE_SUB, 'Talk to AegisAI');
    }

    async function start() {
        error('');
        els.toggle.disabled = true;
        status('Connecting…', 'Preparing the line', 'Connecting');

        // 1) Ask the server for a Gemini Live token. If voice is not configured, use the fallback.
        var token = null;
        try {
            var res = await fetch('/api/voice-token', { method: 'POST' });
            var data = await res.json().catch(function () { return {}; });
            if (res.ok && data.token) token = data.token;
        } catch (e) { /* network error → fallback */ }

        if (!token) return startSpeechFallback();

        // 2) Microphone
        try {
            S.stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
        } catch (e) {
            resetIdleLabels();
            status('No microphone', 'Permission denied', 'Talk to AegisAI');
            error('We need microphone permission for the call. Enable it from the lock icon in the address bar and try again.');
            return;
        }

        // 3) Audio graph
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            S.micCtx = new AC({ sampleRate: IN_RATE });
            S.outCtx = new AC({ sampleRate: OUT_RATE });
            await S.micCtx.resume();
            await S.outCtx.resume();

            S.outGain = S.outCtx.createGain();
            S.analyserOut = S.outCtx.createAnalyser();
            S.analyserOut.fftSize = 256;
            S.outGain.connect(S.analyserOut);
            S.analyserOut.connect(S.outCtx.destination);

            var source = S.micCtx.createMediaStreamSource(S.stream);
            S.analyserIn = S.micCtx.createAnalyser();
            S.analyserIn.fftSize = 256;
            source.connect(S.analyserIn);

            var url = URL.createObjectURL(new Blob([RECORDER_WORKLET], { type: 'application/javascript' }));
            await S.micCtx.audioWorklet.addModule(url);
            URL.revokeObjectURL(url);

            S.node = new AudioWorkletNode(S.micCtx, 'rec');
            S.node.port.onmessage = function (e) {
                if (S.muted || !S.live || !S.ws || S.ws.readyState !== WebSocket.OPEN) return;
                var pcm = floatToPcm16(resample(e.data, S.micCtx.sampleRate, IN_RATE));
                S.ws.send(JSON.stringify({
                    realtimeInput: { audio: { data: toBase64(new Uint8Array(pcm.buffer)), mimeType: 'audio/pcm;rate=' + IN_RATE } }
                }));
            };
            source.connect(S.node);
            S.node.connect(S.micCtx.destination);
        } catch (err) {
            console.error(err);
            cleanup();
            return startSpeechFallback();
        }

        // 4) Socket
        S.ws = new WebSocket(
            'wss://generativelanguage.googleapis.com/ws/' +
            'google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained' +
            '?access_token=' + token
        );

        S.ws.onopen = function () {
            status('Linking with AegisAI…', 'One moment', 'Connecting');
            S.ws.send(JSON.stringify({ setup: {} }));
        };

        S.ws.onmessage = async function (e) {
            var raw = typeof e.data === 'string' ? e.data : await e.data.text();
            var msg;
            try { msg = JSON.parse(raw); } catch (x) { return; }

            if (msg.setupComplete) {
                S.live = true;
                S.mode = 'live';
                panel.classList.add('is-live');
                S.startedAt = Date.now();
                S.timerId = setInterval(tickTimer, 500);
                S.maxId = setTimeout(function () {
                    error('Call limit of 10 minutes reached.');
                    stop();
                }, MAX_CALL_MS);
                els.timer.hidden = false;
                els.mute.hidden = false;
                setLiveButton();
                status('On call', 'Speak whenever you like', 'You are on a call');
                S.ws.send(JSON.stringify({
                    clientContent: { turns: [{ role: 'user', parts: [{ text: GREETING }] }], turnComplete: true }
                }));
                return;
            }

            var sc = msg.serverContent;
            if (!sc) {
                if (msg.goAway) { error('The voice session expired.'); stop(); }
                return;
            }
            if (sc.interrupted) stopPlayback();
            if (sc.inputTranscription && sc.inputTranscription.text) { line('user', sc.inputTranscription.text); status('Thinking...', null, 'Analyzing your question...'); }
            if (sc.outputTranscription && sc.outputTranscription.text) line('agent', sc.outputTranscription.text);

            var parts = (sc.modelTurn && sc.modelTurn.parts) || [];
            parts.forEach(function (part) {
                var d = part.inlineData && part.inlineData.data;
                if (d && (part.inlineData.mimeType || '').indexOf('audio/') === 0) playChunk(d);
                if (part.text) line('agent', part.text);
            });
            if (sc.turnComplete) S.lastRole = null;
        };

        S.ws.onerror = function () { error('Lost connection to the voice server.'); };
        S.ws.onclose = function (e) {
            if (S.live) stop();
            else {
                resetIdleLabels();
                if (e.code && e.code !== 1000) error('The call could not be established (code ' + e.code + ').');
                cleanup();
                S.ws = null;
            }
        };
    }

    function setLiveButton() {
        els.toggle.disabled = false;
        els.toggle.innerHTML = ICONS.phone + '<span>End call</span>';
        $('#aw-voice-captions').hidden = false;
        els.toggle.classList.add('is-hangup');
    }

    // ---- Web Speech fallback ---------------------------------------------
    function startSpeechFallback() {
        if (!SpeechRecognition || !synth) {
            resetIdleLabels();
            error('Voice calls need Chrome, Edge or Safari. Please open the site in one of those browsers, or use the chat.');
            return;
        }
        S.mode = 'speech';
        S.live = false;
        S.sessionId = 'aegis_call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        S.startedAt = Date.now();
        S.timerId = setInterval(tickTimer, 500);
        S.maxId = setTimeout(function () { error('Call limit of 10 minutes reached.'); stop(); }, MAX_CALL_MS);
        panel.classList.add('is-live');
        els.timer.hidden = false;
        els.mute.hidden = false;
        setLiveButton();
        status('On call', 'Speak whenever you like', 'You are on a call');

        speak("Hi, I'm AegisAI, Safety Excellence Group's AI safety intelligence agent. " +
            'I can help with OSHA regulations, SEMI S2 compliance, Precision Placement, audits, and program development. ' +
            'Do you have any questions I can help you with today?', listen);
    }

    var preferredVoice = null;
    function pickVoice() {
        if (!synth) return;
        var voices = synth.getVoices();
        if (!voices.length) return;
        var prefs = ['Microsoft Guy Online (Natural) - English (United States)', 'Microsoft Davis Online (Natural) - English (United States)',
            'Microsoft Andrew Online (Natural) - English (United States)', 'Microsoft David Desktop - English (United States)',
            'Daniel', 'Alex', 'Google UK English Male', 'Google US English'];
        for (var i = 0; i < prefs.length; i++) {
            var m = voices.filter(function (v) { return v.name === prefs[i]; })[0];
            if (m) { preferredVoice = m; return; }
        }
        preferredVoice = voices.filter(function (v) { return v.lang.indexOf('en') === 0; })[0] || voices[0];
    }
    if (synth) {
        synth.addEventListener('voiceschanged', pickVoice);
        pickVoice();
    }

    function speak(text, onDone) {
        var clean = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/[*_`]/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
        var u = new SpeechSynthesisUtterance(clean);
        if (preferredVoice) u.voice = preferredVoice;
        u.lang = 'en-US';
        u.pitch = 0.9;
        u.onstart = function () { S.speaking = true; status('Speaking…', null, null); S.lastRole = null; line('agent', clean); S.lastRole = null; };
        var done = function () { S.speaking = false; if (S.mode === 'speech' && onDone) onDone(); };
        u.onend = done;
        u.onerror = done;
        synth.cancel();
        synth.speak(u);
    }

    function listen() {
        if (S.mode !== 'speech' || S.muted || S.speaking) return;
        var rec;
        try { rec = new SpeechRecognition(); } catch (e) { error('Microphone unavailable.'); return; }
        S.recognition = rec;
        rec.lang = 'en-US';
        rec.interimResults = false;
        rec.continuous = false;
        var finalText = '';

        rec.onstart = function () { S.listening = true; status('Listening…', null, null); };
        rec.onresult = function (ev) {
            for (var i = ev.resultIndex; i < ev.results.length; i++) {
                if (ev.results[i].isFinal) finalText += ev.results[i][0].transcript;
            }
        };
        rec.onerror = function (ev) {
            if (ev.error === 'not-allowed') {
                error('Microphone blocked. Allow access from the lock icon in the address bar and try again.');
                stop();
            }
        };
        rec.onend = function () {
            S.listening = false;
            if (S.mode !== 'speech') return;
            if (finalText.trim()) {
                S.lastRole = null;
                line('user', finalText.trim());
                S.lastRole = null;
                askBackend(finalText.trim());
            } else if (!S.muted && !S.speaking) {
                setTimeout(listen, 200);
            }
        };
        try { rec.start(); } catch (e) { /* already started */ }
    }

    function askBackend(text) {
        status('Thinking…', null, null);
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, sessionId: S.sessionId })
        })
            .then(function (r) { if (!r.ok) throw new Error('Backend ' + r.status); return r.json(); })
            .then(function (d) { speak((d && d.message) || "Sorry, I didn't catch that. Could you say it again?", listen); })
            .catch(function (err) {
                console.error('[AegisAI call] /api/chat failed', err);
                speak("I'm having trouble connecting right now. You can reach our team directly at 4 6 9, 9 8 8, 4 7 7 7.", listen);
            });
    }

    // ---- cleanup / stop / mute -------------------------------------------
    function cleanup() {
        try { if (S.node && S.node.port) S.node.port.close(); } catch (e) {}
        try { if (S.node) S.node.disconnect(); } catch (e) {}
        if (S.stream) S.stream.getTracks().forEach(function (t) { t.stop(); });
        if (S.micCtx && S.micCtx.close) S.micCtx.close().catch(function () {});
        if (S.outCtx && S.outCtx.close) S.outCtx.close().catch(function () {});
        S.node = S.stream = S.micCtx = S.outCtx = S.analyserIn = S.analyserOut = null;
    }

    function stop() {
        var wasActive = S.live || S.mode;
        if (S.ws) { try { S.ws.close(); } catch (e) {} }
        S.ws = null;
        S.live = false;
        S.muted = false;
        S.mode = null;
        S.listening = false;
        if (S.recognition) { try { S.recognition.abort(); } catch (e) {} S.recognition = null; }
        if (synth) synth.cancel();
        clearInterval(S.timerId);
        clearTimeout(S.maxId);
        S.maxId = null;
        stopPlayback();
        cleanup();

        els.timer.hidden = true;
        els.mute.hidden = true;
        els.mute.classList.remove('is-muted');
        els.toggle.textContent = 'Start Voice Conversation';
        $('#aw-voice-captions').hidden = true;
        panel.classList.remove('show-transcript');
        $('#aw-voice-captions').setAttribute('aria-expanded', 'false');
        els.toggle.classList.remove('is-hangup');
        els.toggle.disabled = false;
        status(wasActive ? 'Call ended' : 'Ready to talk', IDLE_SUB, 'Talk to AegisAI');
        panel.classList.remove('is-listening', 'is-live');
    }

    function toggleMute() {
        S.muted = !S.muted;
        els.mute.classList.toggle('is-muted', S.muted);
        els.mute.setAttribute('aria-label', S.muted ? 'Unmute microphone' : 'Mute microphone');
        status(S.muted ? 'Microphone muted' : 'On call');
        if (S.mode === 'speech') {
            if (S.muted) { if (S.recognition) { try { S.recognition.abort(); } catch (e) {} } }
            else if (!S.speaking) listen();
        }
    }

    // ---- open / close -----------------------------------------------------
    function setVideo(active) {
        if (S.raf) cancelAnimationFrame(S.raf);
        S.raf = null; lastVisualFrame = 0;
        if (active && !document.hidden) {
            if (visualMotion.matches) draw(0);
            else S.raf = requestAnimationFrame(draw);
        }
    }
    function open() {
        if (!panel) return;
        closeMenu();
        if (window.AEGIS && window.AEGIS.close) window.AEGIS.close();
        panel.classList.add('is-open');
        setVideo(true);
        syncDock();
    }
    function close() {
        if (!panel) return;
        closeMenu();
        panel.classList.remove('is-open');
        if (S.live || S.ws || S.mode) stop();
        setVideo(false);
        syncDock();
    }
    // Minimize: hide the panel but keep an active call running (use the dock button to bring it back)
    function minimize() {
        if (!panel) return;
        panel.classList.remove('is-open');
        setVideo(false);
        syncDock();
    }
    function toggle() { panel && panel.classList.contains('is-open') ? close() : open(); }

    function openBooking(event) {
        if (event && event.preventDefault) event.preventDefault();
        close();
        if (window.AEGIS && window.AEGIS.showBookingCalendar) window.AEGIS.showBookingCalendar();
        else if (typeof window.openBookingModal === 'function') window.openBookingModal(event);
        else if (typeof window.openModal === 'function') window.openModal('bookingModal');
    }

    // ---- init / public API -----------------------------------------------
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
    else build();

    window.AegisCallWidget = {
        toggle: toggle,
        renderBrand: renderBrand,
        getBrandLogo: function () { return brandLogoURL || '/images/Aegis%20logo-15.png'; },
        openMenu: openMenu,
        closeMenu: closeMenu,
        open: open,
        close: close,
        minimize: minimize,
        startConversation: function () { open(); if (!S.live && !S.ws && !S.mode) start(); },
        endCall: stop,
        toggleMute: toggleMute,
        openBooking: openBooking,
        isLive: function () { return S.live || !!S.mode; }
    };
})();
