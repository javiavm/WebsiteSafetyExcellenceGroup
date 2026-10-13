/**
 * AegisAI — chat widget
 * Safety Excellence Group
 *
 * UI/behaviour ported from the ModArch "Maia" chatbot (dock + glass panel,
 * markdown bubbles, quick-reply chips, auto-growing input). The brain is still
 * SEG's own /api/chat (Claude) — answers, booking flow and lead capture are unchanged.
 */

// Load reCAPTCHA helper (auto-injects captcha tokens into all /api/forms/ requests)
(function () {
    var s = document.createElement('script');
    s.src = '/js/recaptcha-helper.js';
    s.async = true;
    document.head.appendChild(s);
})();

(function () {
    'use strict';

    var CONFIG = {
        apiUrl: window.location.origin + '/api',
        botName: 'AegisAI',
        botTagline: 'AI Safety Assistant',
        welcomeMessage: "Hi! I'm **AegisAI**, S.E.G.'s AI safety assistant. I can answer questions about OSHA regulations, SEMI S2 compliance, our services, or connect you with our team.\n\nHow can I help you today?",
        quickReplies: [
            'What services do you offer?',
            '📅 Book a discovery call',
            'I have a safety question'
        ]
    };

    var ICONS = {
        chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-4.2-1L3 20l1.1-4.4A8.4 8.4 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z"/></svg>',
        close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M18 6 6 18M6 6l12 12"/></svg>',
        send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z"/></svg>',
        clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>',
        file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
    };

    // ---- session / state --------------------------------------------------
    var sessionId = sessionStorage.getItem('aegis_session') || ('aegis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    sessionStorage.setItem('aegis_session', sessionId);

    var disclaimerAccepted = sessionStorage.getItem('aegis_disclaimer') === 'true';
    var conversationHistory = [];
    var isOpen = false;
    var isTyping = false;
    var pendingAttachment = null;
    var panel, log, quick, input, sendBtn, attachBtn, chip, stateEl, dockBtn, disclaimerEl, brandFrame = 0, brandTime = 0;
    var reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

    var $ = function (s, root) { return (root || document).querySelector(s); };

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    // ---- markdown-lite (from ModArch) ------------------------------------
    function inline(s) {
        return s
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
    }
    function md(text) {
        return esc(text).split(/\n{2,}/).map(function (block) {
            var lines = block.split('\n');
            if (lines.every(function (l) { return /^\s*[-•*]\s+/.test(l); })) {
                return '<ul>' + lines.map(function (l) { return '<li>' + inline(l.replace(/^\s*[-•*]\s+/, '')) + '</li>'; }).join('') + '</ul>';
            }
            return '<p>' + lines.map(inline).join('<br>') + '</p>';
        }).join('');
    }

    // ---- shared dock / fonts ---------------------------------------------
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
        if (!d) return;
        d.classList.toggle('is-panel-open', !!$('.aw-panel.is-open'));
    }

    // ---- build ------------------------------------------------------------
    function build() {
        if ($('#aw-chat-panel')) return;
        ensureFonts();
        var dock = ensureDock();

        // Chat is accessed through the shared AegisAI assistance menu.
        panel = document.createElement('div');
        panel.className = 'aw-panel';
        panel.id = 'aw-chat-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Chat with AegisAI');
        panel.innerHTML =
            
            '<div class="aw-head">' +
                '<span class="aw-avatar aw-chat-avatar" aria-hidden="true"><img class="aw-brand-image" src="/images/Aegis%20logo-15.png" alt=""></span>' +
                '<div class="aw-title"><b>' + CONFIG.botName + '</b><span><span class="aw-chat-tagline">' + CONFIG.botTagline + ' &middot; </span><span id="aw-chat-state" class="is-offline">Offline</span></span></div>' +
                '<button class="aw-hub-back" type="button" aria-label="Back to AegisAI menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m14 5-7 7 7 7"/></svg></button>' +
                '<button class="aw-close" type="button" aria-label="Close chat">' + ICONS.close + '</button>' +
            '</div>' +
            '<div class="aw-log" id="aw-log" data-lenis-prevent></div>' +
            '<div class="aw-foot">' +
                '<div class="aw-quick" id="aw-quick"></div>' +
                '<div class="aw-disclaimer" id="aw-disclaimer"' + (disclaimerAccepted ? ' hidden' : '') + '>' +
                    'AegisAI is for <strong>educational purposes only</strong> — not a substitute for professional safety audits, legal advice, or compliance certification.' +
                    '<label><input type="checkbox" id="aw-disclaimer-check"> I agree</label>' +
                    '<button class="aw-btn is-sage" type="button" id="aw-disclaimer-btn">Continue →</button>' +
                '</div>' +
                '<div class="aw-chip" id="aw-chip"></div>' +
                '<form class="aw-form" id="aw-form">' +
                    '<textarea class="aw-input" id="aw-input" rows="1" placeholder="Type your message…" aria-label="Message"' + (disclaimerAccepted ? '' : ' disabled') + '></textarea>' +
                    '<input type="file" id="aw-file" accept="image/*,application/pdf" hidden>' +
                    '<button class="aw-attach" id="aw-attach" type="button" aria-label="Attach file"' + (disclaimerAccepted ? '' : ' disabled') + '>' + ICONS.clip + '</button>' +
                    '<button class="aw-send" id="aw-send" type="submit" aria-label="Send"' + (disclaimerAccepted ? '' : ' disabled') + '>' + ICONS.send + '</button>' +
                '</form>' +
            '</div>';
        document.body.appendChild(panel);

        log = $('#aw-log');
        quick = $('#aw-quick');
        input = $('#aw-input');
        sendBtn = $('#aw-send');
        attachBtn = $('#aw-attach');
        chip = $('#aw-chip');
        stateEl = $('#aw-chat-state');
        disclaimerEl = $('#aw-disclaimer');

        $('.aw-close', panel).addEventListener('click', close);
        $('.aw-hub-back', panel).addEventListener('click', function (event) { event.stopPropagation(); if (window.AegisCallWidget) window.AegisCallWidget.openMenu(); });
        $('#aw-disclaimer-btn').addEventListener('click', acceptDisclaimer);
        $('#aw-form').addEventListener('submit', function (e) {
            e.preventDefault();
            sendMessage();
        });
        input.addEventListener('input', function () {
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        attachBtn.addEventListener('click', function () { $('#aw-file').click(); });
        $('#aw-file').addEventListener('change', handleFileSelected);
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) close();
        });
        // Click outside the widget minimizes it (composedPath survives nodes removed during the click)
        document.addEventListener('click', function (e) {
            if (!isOpen) return;
            var path = e.composedPath ? e.composedPath() : [];
            var inside = path.some(function (n) {
                return n === panel || (n.classList && (n.classList.contains('aw-dock') || n.classList.contains('aw-modal')));
            });
            if (!inside) close();
        });

        showWelcomeMessage();
        document.addEventListener('aegis-brand-ready', updateBrand);
        document.addEventListener('visibilitychange', function () { setVideo(isOpen); });
        reducedMotion.addEventListener('change', function () { setVideo(isOpen); });
        updateBrand();
        checkStatus();
        setInterval(checkStatus, 30000);
    }

    // ---- open / close -----------------------------------------------------
    function updateBrand() {
        if (!window.AegisCallWidget) return;
        var url = window.AegisCallWidget.getBrandLogo();
        panel.querySelectorAll('.aw-brand-image').forEach(function (image) { image.src = url; });
        setVideo(isOpen);
    }
    function animateBrand(time) {
        brandFrame = 0;
        if (!isOpen || document.hidden || !panel.classList.contains('is-welcome')) return;
        var canvas = $('#aw-chat-brand', panel);
        if (canvas && window.AegisCallWidget && (!brandTime || time - brandTime >= 1000 / 24)) {
            brandTime = time;
            window.AegisCallWidget.renderBrand(canvas, time);
        }
        if (!reducedMotion.matches) brandFrame = requestAnimationFrame(animateBrand);
    }
    function setVideo(active) {
        if (brandFrame) cancelAnimationFrame(brandFrame);
        brandFrame = 0; brandTime = 0;
        if (active && !document.hidden && panel.classList.contains('is-welcome')) {
            if (reducedMotion.matches) animateBrand(0);
            else brandFrame = requestAnimationFrame(animateBrand);
        }
    }
    function open() {
        if (!panel) return;
        if (window.AegisCallWidget && window.AegisCallWidget.close) window.AegisCallWidget.close();
        isOpen = true;
        panel.classList.add('is-open');
        setVideo(true);
        syncDock();
        if (disclaimerAccepted) setTimeout(function () { input.focus(); }, 320);
        scrollDown();
    }
    function close() {
        if (!panel) return;
        isOpen = false;
        panel.classList.remove('is-open');
        setVideo(false);
        syncDock();
    }
    function toggle() { isOpen ? close() : open(); }

    // ---- messages ---------------------------------------------------------
    function scrollDown() {
        if (log) log.scrollTop = log.scrollHeight;
    }
    function addMessage(text, sender, attachment) {
        var el = document.createElement('div');
        el.className = 'aw-msg is-' + (sender === 'bot' ? 'bot' : 'user');
        var att = attachment ? attachmentHtml(attachment) : '';
        el.innerHTML = (sender === 'bot' ? '<span class="aw-message-avatar" aria-hidden="true"><img class="aw-brand-image" src="' + (window.AegisCallWidget ? window.AegisCallWidget.getBrandLogo() : '/images/Aegis%20logo-15.png') + '" alt=""></span>' : '') + att + md(text);
        log.appendChild(el);
        scrollDown();
        conversationHistory.push({ sender: sender, text: text });
        return el;
    }
    function attachmentHtml(a) {
        if (a.isImage && a.dataUrl) {
            return '<img class="aw-attach-img" src="' + a.dataUrl + '" alt="' + esc(a.name) + '">';
        }
        return '<div class="aw-attach-file">' + ICONS.file + '<div>' + esc(a.name) + '<small>' + formatBytes(a.size) + '</small></div></div>';
    }
    function showTyping() {
        isTyping = true;
        var el = document.createElement('div');
        el.className = 'aw-msg is-bot';
        el.id = 'aw-typing';
        el.innerHTML = '<span class="aw-typing"><i></i><i></i><i></i></span>';
        log.appendChild(el);
        setState('Typing…');
        scrollDown();
    }
    function hideTyping() {
        isTyping = false;
        var el = $('#aw-typing');
        if (el) el.remove();
    }
    function setState(text, offline) {
        if (!stateEl) return;
        stateEl.textContent = text;
        stateEl.classList.toggle('is-offline', !!offline);
    }
    function setOnline(online) {
        setState(online ? 'Online' : 'Offline', !online);
        if (dockBtn) dockBtn.classList.toggle('is-offline', !online);
    }

    function showQuickReplies(replies) {
        quick.innerHTML = '';
        replies.forEach(function (reply) {
            var b = document.createElement('button');
            b.type = 'button';
            b.textContent = reply;
            b.addEventListener('click', function () {
                quick.innerHTML = '';
                if (reply.indexOf('Book') !== -1 || reply.indexOf('discovery call') !== -1 ||
                    reply.indexOf('scope my needs') !== -1 || reply.indexOf('Help me') !== -1) {
                    showQualificationForm();
                } else if (reply === 'Keep chatting') {
                    input.focus();
                } else {
                    sendMessage(reply);
                }
            });
            quick.appendChild(b);
        });
    }
    function clearQuickReplies() { quick.innerHTML = ''; }

    function showWelcomeMessage() {
        if (conversationHistory.length !== 0) return;
        panel.classList.add('is-welcome');
        var welcome = document.createElement('div'); welcome.className = 'aw-chat-welcome';
        var paragraphs = CONFIG.welcomeMessage.split('\n\n');
        welcome.innerHTML = '<canvas id="aw-chat-brand" width="480" height="320" aria-hidden="true"></canvas>' +
            '<h3>' + esc(paragraphs[1]) + '</h3><div class="aw-chat-welcome-copy">' + md(paragraphs[0]) + '</div>' +
            '<div class="aw-chat-shortcuts"><button type="button" data-shortcut="safety">Safety questions</button>' +
            '<button type="button" data-shortcut="standards">OSHA &amp; SEMI S2</button>' +
            '<button type="button" data-shortcut="booking">Book a call</button>' +
            '<button type="button" data-shortcut="services">Our services</button></div>';
        log.appendChild(welcome);
        var shortcutIcons = {
            safety: '<path d="m12 3 8 4v5c0 5-8 9-8 9S4 17 4 12V7zM8 12l3 3 5-6"/>',
            standards: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h8"/>',
            booking: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h2m4 0h2"/>',
            services: '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a5 5 0 0 1 10 0v4M16 4a3 3 0 0 1 0 6M16 14a5 5 0 0 1 5 5v2"/>'
        };
        conversationHistory.push({ sender: 'bot', text: CONFIG.welcomeMessage });
        welcome.querySelectorAll('button').forEach(function (button) {
            button.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" aria-hidden="true">' + shortcutIcons[button.dataset.shortcut] + '</svg>');
            button.addEventListener('click', function () {
                if (!disclaimerAccepted) { showDisclaimer(); $('#aw-disclaimer-check').focus(); return; }
                if (button.dataset.shortcut === 'booking') {
                    leaveWelcome(); showQualificationForm(); return;
                }
                var messages = { safety: 'I have a safety question', standards: 'What is SEMI S2 compliance and why does it matter?', services: 'What services do you offer?' };
                sendMessage(messages[button.dataset.shortcut]);
            });
        });
    }
    function leaveWelcome() {
        panel.classList.remove('is-welcome');
        var welcome = $('.aw-chat-welcome', panel); if (welcome) welcome.remove();
        setVideo(false);
    }
    function showDisclaimer() {
        if (disclaimerEl) disclaimerEl.hidden = false;
    }
    function acceptDisclaimer() {
        var cb = $('#aw-disclaimer-check');
        if (!cb || !cb.checked) {
            cb.focus();
            disclaimerEl.style.outline = '1px solid #d18455';
            return;
        }
        disclaimerAccepted = true;
        sessionStorage.setItem('aegis_disclaimer', 'true');
        disclaimerEl.hidden = true;
        input.disabled = false;
        sendBtn.disabled = false;
        attachBtn.disabled = false;
        showWelcomeMessage();
        input.focus();
    }

    // ---- attachments ------------------------------------------------------
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    function notice(text) {
        var el = document.createElement('div');
        el.className = 'aw-msg is-err';
        el.textContent = text;
        log.appendChild(el);
        scrollDown();
    }
    function handleFileSelected(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        var allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (allowed.indexOf(file.type) === -1) {
            notice('Only images (JPG, PNG, GIF, WebP) and PDF files are supported.');
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            notice('File is too large. Maximum size is 5MB.');
            e.target.value = '';
            return;
        }
        pendingAttachment = { name: file.name, type: file.type, size: file.size, isImage: file.type.indexOf('image/') === 0, dataUrl: null };
        if (pendingAttachment.isImage) {
            var reader = new FileReader();
            reader.onload = function (ev) {
                pendingAttachment.dataUrl = ev.target.result;
                renderChip();
            };
            reader.readAsDataURL(file);
        } else {
            renderChip();
        }
        e.target.value = '';
    }
    function renderChip() {
        if (!pendingAttachment) {
            chip.classList.remove('is-on');
            chip.innerHTML = '';
            return;
        }
        var a = pendingAttachment;
        var thumb = a.isImage && a.dataUrl ? '<img src="' + a.dataUrl + '" alt="">' : '<span class="aw-chip-pdf">PDF</span>';
        chip.innerHTML = thumb + '<div class="aw-chip-meta"><b>' + esc(a.name) + '</b><span>' + formatBytes(a.size) + '</span></div>' +
            '<button type="button" aria-label="Remove attachment">' + ICONS.close + '</button>';
        $('button', chip).addEventListener('click', removeAttachment);
        chip.classList.add('is-on');
    }
    function removeAttachment() {
        pendingAttachment = null;
        renderChip();
    }

    // ---- send -------------------------------------------------------------
    async function sendMessage(overrideText) {
        var message = overrideText || input.value.trim();
        var attachment = pendingAttachment;
        if ((!message && !attachment) || isTyping || !disclaimerAccepted) return;

        input.value = '';
        input.style.height = 'auto';
        clearQuickReplies();
        leaveWelcome();

        var withAttachment = attachment
            ? (message ? message + '\n\n[Attached: ' + attachment.name + ']' : '[Attached: ' + attachment.name + ']')
            : message;

        addMessage(withAttachment, 'user', attachment);
        pendingAttachment = null;
        renderChip();
        showTyping();

        try {
            var response = await fetch(CONFIG.apiUrl + '/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: withAttachment,
                    sessionId: sessionId,
                    attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size } : undefined
                })
            });
            if (!response.ok) throw new Error('API request failed');
            var data = await response.json();
            hideTyping();
            var reply = addMessage(data.message, 'bot');
            addContextActions(reply, message, data.message);
            setOnline(true);
            checkForLeadCapture(message, data.message);
        } catch (error) {
            console.error('AegisAI Error:', error);
            hideTyping();
            setOnline(false);
            var el = addMessage("I'm having trouble connecting right now. Please try again, or call us directly at **469.988.4777**.", 'bot');
            el.className = 'aw-msg is-err';
        }
    }

    function addContextActions(reply, question, answer) {
        var text = (question + ' ' + answer).toLowerCase();
        if (/semi\s*s[28]|osha/.test(text)) {
            var resource = document.createElement('a'); resource.className = 'aw-context-resource';
            resource.href = '/services.html#assessments';
            resource.innerHTML = ICONS.file + '<span><strong>Assessments &amp; Audits</strong><small>Safety standards and compliance</small></span>';
            reply.appendChild(resource);
        }
        if (/\b(book|schedule|discovery call)\b/.test(text)) {
            var booking = document.createElement('button'); booking.type = 'button'; booking.className = 'aw-context-resource';
            booking.textContent = 'Book Your Discovery Call'; booking.addEventListener('click', showBookingCalendar);
            reply.appendChild(booking);
        }
        scrollDown();
    }

    function checkForLeadCapture(userMessage, botResponse) {
        var triggers = ['proposal', 'quote', 'pricing', 'cost', 'contact', 'call', 'reach out', 'talk to someone', 'schedule', 'book'];
        var combined = ((userMessage || '') + ' ' + botResponse).toLowerCase();
        var should = triggers.some(function (t) { return combined.indexOf(t) !== -1; });
        if (should && !$('#aw-lead-form') && !$('#aw-qual-form')) {
            setTimeout(function () {
                showQuickReplies(['📅 Book a discovery call', '📋 Help me scope my needs', 'Keep chatting']);
            }, 500);
        }
    }

    // ---- qualification / booking / lead (unchanged flow) ------------------
    function showQualificationForm() {
        clearQuickReplies();
        var old = $('#aw-qual-form');
        if (old) old.remove();

        var f = document.createElement('div');
        f.id = 'aw-qual-form';
        f.className = 'aw-card';
        f.innerHTML =
            '<h5>📋 Quick Qualification</h5>' +
            '<p>Help us prepare for your discovery call:</p>' +
            '<label>Company Name<input type="text" id="qual-company" placeholder="Enter your company name..."></label>' +
            '<label>Industry<select id="qual-industry"><option value="">Select industry...</option>' +
                '<option value="semiconductor">Semiconductor</option><option value="datacenter">Data Center</option>' +
                '<option value="construction">Construction</option><option value="manufacturing">Manufacturing</option>' +
                '<option value="other">Other</option></select></label>' +
            '<label>What do you need?<select id="qual-service"><option value="">Select service...</option>' +
                '<option value="staffing">Precision Placement</option><option value="audits">Assessments &amp; Audits</option>' +
                '<option value="program">Program Development</option><option value="vetting">Subcontractor Vetting</option>' +
                '<option value="not-sure">Not Sure Yet</option></select></label>' +
            '<label>Timeline<select id="qual-timeline"><option value="">Select timeline...</option>' +
                '<option value="asap">ASAP (within 2 weeks)</option><option value="1-3months">1-3 months</option>' +
                '<option value="3-6months">3-6 months</option><option value="planning">6+ months / Planning</option></select></label>' +
            '<button type="button" class="aw-btn" id="aw-qual-submit">📅 Book My Discovery Call</button>';
        log.appendChild(f);
        $('#aw-qual-submit').addEventListener('click', submitQualification);
        scrollDown();
    }

    function submitQualification() {
        var company = $('#qual-company').value.trim();
        var industry = $('#qual-industry').value;
        var service = $('#qual-service').value;
        var timeline = $('#qual-timeline').value;
        if (!company || !industry || !service || !timeline) {
            var btn = $('#aw-qual-submit');
            btn.textContent = 'Please fill out all fields';
            setTimeout(function () { btn.textContent = '📅 Book My Discovery Call'; }, 2200);
            return;
        }
        $('#aw-qual-form').remove();

        var industryLabels = { semiconductor: 'Semiconductor', datacenter: 'Data Center', construction: 'Construction', manufacturing: 'Manufacturing', other: 'Other' };
        var serviceLabels = { staffing: 'Precision Placement', audits: 'Assessments & Audits', program: 'Program Development', vetting: 'Subcontractor Vetting', 'not-sure': 'Not Sure Yet' };
        var timelineLabels = { asap: 'ASAP', '1-3months': '1-3 months', '3-6months': '3-6 months', planning: '6+ months' };

        addMessage('Company: ' + company + '\nIndustry: ' + industryLabels[industry] + '\nService: ' + serviceLabels[service] + '\nTimeline: ' + timelineLabels[timeline], 'user');
        window.aegisQualData = { company: company, industry: industry, service: service, timeline: timeline };

        setTimeout(function () {
            addMessage('Perfect! 🎯 Pick a time that works for you:', 'bot');
            setTimeout(showBookingCalendar, 500);
        }, 500);
    }

    function showBookingCalendar() {
        closeCalendarModal();
        var m = document.createElement('div');
        m.id = 'aw-calendar-modal';
        m.className = 'aw-modal';
        m.innerHTML =
            '<div class="aw-modal-back"></div>' +
            '<div class="aw-modal-box" role="dialog" aria-modal="true" aria-label="Book Your Discovery Call">' +
                '<div class="aw-head"><span class="aw-avatar" aria-hidden="true"><i></i></span>' +
                '<div class="aw-title"><b>Book Your Discovery Call</b><span>15 minutes · No obligation</span></div>' +
                '<button class="aw-close" type="button" aria-label="Close">' + ICONS.close + '</button></div>' +
                '<div class="aw-calendar-scroll" data-lenis-prevent tabindex="0" role="region" aria-label="Discovery call calendar">' +
                    '<div class="aw-calendar-content">' +
                    '<iframe id="aw-calendar-frame" src="https://api.leadconnectorhq.com/widget/booking/56IkA4NNqXU4MQAnpmAh" title="S.E.G. Discovery Call Calendar" scrolling="yes" frameborder="0"></iframe>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(m);
        var bookingFrame = $('iframe', m);
        var bookingScroller = $('.aw-calendar-scroll', m);
        // Follow the provider's measured document height instead of imposing blank space.
        var bookingResize = new MutationObserver(function () {
            var measured = parseFloat(bookingFrame.style.height);
            if (Number.isFinite(measured) && measured > 0) bookingScroller.style.setProperty('--aw-calendar-document-height', measured + 'px');
        });
        bookingResize.observe(bookingFrame, { attributes: true, attributeFilter: ['style'] });
        m.bookingResize = bookingResize;
        $('.aw-modal-back', m).addEventListener('click', closeCalendarModal);
        $('.aw-close', m).addEventListener('click', closeCalendarModal);
        document.body.style.overflow = 'hidden';

        if (!document.getElementById('ghl-form-script')) {
            var s = document.createElement('script');
            s.id = 'ghl-form-script';
            s.src = 'https://link.msgsndr.com/js/form_embed.js';
            document.body.appendChild(s);
        }
    }
    function closeCalendarModal() {
        var m = $('#aw-calendar-modal');
        if (m) {
            if (m.bookingResize) m.bookingResize.disconnect();
            m.remove();
            document.body.style.overflow = '';
        }
    }

    function showLeadForm() {
        var old = $('#aw-lead-form');
        if (old) old.remove();
        var f = document.createElement('div');
        f.id = 'aw-lead-form';
        f.className = 'aw-card';
        f.innerHTML =
            '<h5>📅 Book Your Discovery Call</h5>' +
            '<input type="text" id="lead-name" placeholder="Your name *" required>' +
            '<input type="email" id="lead-email" placeholder="Email address *" required>' +
            '<input type="tel" id="lead-phone" placeholder="Phone number *" required>' +
            '<input type="text" id="lead-company" placeholder="Company name">' +
            '<button type="button" class="aw-btn" id="aw-lead-submit">Schedule My Call →</button>';
        log.appendChild(f);
        $('#aw-lead-submit').addEventListener('click', submitLead);
        scrollDown();
    }
    async function submitLead() {
        var name = $('#lead-name').value.trim();
        var email = $('#lead-email').value.trim();
        var phone = $('#lead-phone').value.trim();
        var company = $('#lead-company').value.trim();
        if (!name || !email || !phone) {
            notice('Please enter your name, email, and phone number.');
            return;
        }
        var q = window.aegisQualData || {};
        try {
            await fetch(CONFIG.apiUrl + '/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name, email: email, phone: phone, company: company,
                    industry: q.industry, service: q.service, timeline: q.timeline,
                    conversationHistory: conversationHistory, sessionId: sessionId
                })
            });
            $('#aw-lead-form').remove();
            addMessage('Thanks ' + name + '! 🎉\n\nYou\'re all set! Our team will reach out within 2 hours to schedule your discovery call.\n\nWe\'ll come prepared to discuss your specific needs. Talk soon!', 'bot');
        } catch (error) {
            console.error('Lead submission error:', error);
            var el = addMessage('There was an issue submitting your info. Please call us directly at **469.988.4777** or email info@safety-excellence.com.', 'bot');
            el.className = 'aw-msg is-err';
        }
    }

    // ---- status -----------------------------------------------------------
    async function checkStatus() {
        try {
            var controller = new AbortController();
            var t = setTimeout(function () { controller.abort(); }, 5000);
            await fetch(CONFIG.apiUrl + '/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '', sessionId: 'ping' }),
                signal: controller.signal
            });
            clearTimeout(t);
            setOnline(true); // any response (even 400) means the server is reachable
        } catch (e) {
            setOnline(false);
        }
    }

    // ---- init / public API -----------------------------------------------
    function init() {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
        else build();
    }

    window.AEGIS = {
        init: init,
        toggle: toggle,
        open: open,
        close: close,
        showDisclaimer: showDisclaimer,
        acceptDisclaimer: acceptDisclaimer,
        sendMessage: sendMessage,
        showLeadForm: showLeadForm,
        submitLead: submitLead,
        showQualificationForm: showQualificationForm,
        submitQualification: submitQualification,
        showBookingCalendar: showBookingCalendar,
        closeCalendarModal: closeCalendarModal,
        removeAttachment: removeAttachment
    };

    init();
})();
