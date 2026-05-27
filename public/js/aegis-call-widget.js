/**
 * AEGIS Call Widget
 * Safety Excellence Group
 *
 * Voice-call experience powered by:
 *   - Web Speech API (SpeechRecognition + SpeechSynthesis) — browser-native, free
 *   - Existing /api/chat backend (Claude) for the AI brain
 *
 * No paid voice provider — works in Chrome/Edge/Safari out of the box.
 */
(function () {
    'use strict';

    // ----- Browser support -----
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var speechSynthesis = window.speechSynthesis;
    var isVoiceSupported = !!(SpeechRecognition && speechSynthesis);

    // ----- State -----
    var recognition = null;
    var isCallActive = false;
    var isSpeaking = false;
    var isListening = false;
    var callSessionId = 'aegis_call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    var preferredVoice = null;

    // Pick the best English MALE voice once they're loaded
    function pickVoice() {
        if (!speechSynthesis) return;
        var voices = speechSynthesis.getVoices();
        if (!voices.length) return;

        // 1) Exact-name preferences for high-quality male voices across platforms
        var malePreferences = [
            // Windows (Microsoft online neural voices — male)
            'Microsoft Guy Online (Natural) - English (United States)',
            'Microsoft Davis Online (Natural) - English (United States)',
            'Microsoft Tony Online (Natural) - English (United States)',
            'Microsoft Brandon Online (Natural) - English (United States)',
            'Microsoft Andrew Online (Natural) - English (United States)',
            'Microsoft Brian Online (Natural) - English (United States)',
            // Windows offline male
            'Microsoft David Desktop - English (United States)',
            'Microsoft Mark - English (United States)',
            'Microsoft David',
            // macOS / iOS male
            'Daniel',           // British male
            'Alex',             // US male
            'Fred',             // US male
            'Aaron',            // US male
            'Tom',
            // Google
            'Google UK English Male',
            'Google US English'  // often male-leaning
        ];

        for (var i = 0; i < malePreferences.length; i++) {
            var match = voices.find(function (vv) { return vv.name === malePreferences[i]; });
            if (match) { preferredVoice = match; return; }
        }

        // 2) Fuzzy match by common male name tokens in English voices
        var maleTokens = ['guy', 'davis', 'tony', 'brandon', 'andrew', 'brian',
                          'daniel', 'alex', 'fred', 'aaron', 'tom', 'david', 'mark',
                          'james', 'george', 'oliver', 'liam', 'ryan'];
        var enVoices = voices.filter(function (v) { return v.lang.indexOf('en') === 0; });
        for (var j = 0; j < enVoices.length; j++) {
            var lower = enVoices[j].name.toLowerCase();
            for (var k = 0; k < maleTokens.length; k++) {
                if (lower.indexOf(maleTokens[k]) !== -1) {
                    preferredVoice = enVoices[j];
                    return;
                }
            }
        }

        // 3) Fallback: first English voice (whatever's available)
        preferredVoice = enVoices[0] || voices[0];
    }
    if (speechSynthesis) {
        speechSynthesis.addEventListener('voiceschanged', pickVoice);
        pickVoice();
    }

    function createWidget() {
        if (document.getElementById('aegis-call-widget')) return;

        var widget = document.createElement('div');
        widget.className = 'aegis-call-widget';
        widget.id = 'aegis-call-widget';

        widget.innerHTML = [
            // PANEL
            '<div class="aegis-call-panel" id="aegis-call-panel" role="dialog" aria-hidden="true">',
            '    <div class="aegis-call-header">',
            '        <span class="aegis-call-header-dot" aria-hidden="true"></span>',
            '        <div class="aegis-call-header-title" id="aegis-call-title">Call AEGIS AI</div>',
            '        <button class="aegis-call-header-close" type="button" aria-label="Close" onclick="AegisCallWidget.close()">',
            '            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
            '        </button>',
            '    </div>',

            // IDLE BODY (initial — before call starts)
            '    <div class="aegis-call-body aegis-call-body-idle" id="aegis-call-body-idle">',
            '        <div class="aegis-call-avatar">',
            '            <img src="/images/Aegis logo-15.png" alt="AEGIS AI">',
            '        </div>',
            '        <div class="aegis-call-name">AEGIS AI <span class="aegis-call-badge">AI</span></div>',
            '        <p class="aegis-call-description">Start a conversation and our AI Agent will assist you instantly. Tailored 24/7 safety intelligence built for your business.</p>',
            '        <button type="button" class="aegis-call-action" onclick="AegisCallWidget.startConversation()">',
            '            <svg class="aegis-call-mic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
            '                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>',
            '                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>',
            '                <line x1="12" y1="19" x2="12" y2="23"/>',
            '                <line x1="8" y1="23" x2="16" y2="23"/>',
            '            </svg>',
            '            <span class="aegis-call-rec-dot" aria-hidden="true"></span>',
            '            Start AI Call',
            '        </button>',
            '        <p class="aegis-call-support" id="aegis-call-support"></p>',
            '    </div>',

            // ACTIVE CALL BODY (during call)
            '    <div class="aegis-call-body aegis-call-body-active" id="aegis-call-body-active" hidden>',
            '        <div class="aegis-call-status" id="aegis-call-status">',
            '            <div class="aegis-call-avatar-video" id="aegis-call-avatar-video">',
            '                <video id="aegis-avatar-listening" class="aegis-avatar-clip" muted loop playsinline preload="auto">',
            '                    <source src="/video/aegis-listening.mp4" type="video/mp4">',
            '                </video>',
            '                <video id="aegis-avatar-speaking" class="aegis-avatar-clip" muted loop playsinline preload="auto" hidden>',
            '                    <source src="/video/aegis-speaking.mp4" type="video/mp4">',
            '                </video>',
            '                <video id="aegis-avatar-thinking" class="aegis-avatar-clip" muted loop playsinline preload="auto" hidden>',
            '                    <source src="/video/aegis-thinking.mp4" type="video/mp4">',
            '                </video>',
            '                <div class="aegis-avatar-ring" id="aegis-avatar-ring" data-state="connecting">',
            '                    <span></span><span></span><span></span>',
            '                </div>',
            '            </div>',
            '            <div class="aegis-call-status-label" id="aegis-call-status-label">Listening…</div>',
            '            <div class="aegis-call-timer" id="aegis-call-timer">00:00</div>',
            '        </div>',
            '        <div class="aegis-call-transcript" id="aegis-call-transcript">',
            '            <div class="aegis-call-transcript-empty">Speak naturally — AEGIS is listening.</div>',
            '        </div>',
            '        <div class="aegis-call-controls">',
            '            <button type="button" class="aegis-call-mute" id="aegis-call-mute" onclick="AegisCallWidget.toggleMute()" aria-label="Mute microphone">',
            '                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>',
            '            </button>',
            '            <button type="button" class="aegis-call-hangup" onclick="AegisCallWidget.endCall()" aria-label="End call">',
            '                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">',
            '                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
            '                </svg>',
            '            </button>',
            '        </div>',
            '    </div>',

            '    <div class="aegis-call-footer">',
            '        S.E.G. <span style="opacity:0.4;margin:0 4px;">|</span>',
            '        <a href="#" onclick="AegisCallWidget.openBooking(event)">Book a demo</a>',
            '    </div>',
            '</div>',

            // TRIGGER
            '<button class="aegis-call-trigger" type="button" id="aegis-call-trigger" aria-label="Talk to AEGIS AI" onclick="AegisCallWidget.toggle()">',
            '    <svg class="phone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
            '        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
            '    </svg>',
            '    <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round">',
            '        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
            '    </svg>',
            '</button>',
            '<span class="aegis-call-tooltip">Talk to AEGIS AI</span>'
        ].join('\n');

        document.body.appendChild(widget);

        // Browser-support note in idle view
        if (!isVoiceSupported) {
            var support = document.getElementById('aegis-call-support');
            if (support) {
                support.textContent = 'Voice not supported in this browser. Try Chrome, Edge or Safari.';
            }
        }

        // Close on click outside (only when no call active — don't accidentally hang up)
        document.addEventListener('click', function (e) {
            if (!widget.classList.contains('open')) return;
            if (isCallActive) return;
            if (!widget.contains(e.target)) close();
        });

        // ESC closes panel (and ends call if active)
        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (isCallActive) {
                endCall();
            } else if (widget.classList.contains('open')) {
                close();
            }
        });
    }

    function toggle() {
        var widget = document.getElementById('aegis-call-widget');
        var panel  = document.getElementById('aegis-call-panel');
        if (!widget || !panel) return;
        var isOpen = widget.classList.toggle('open');
        panel.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (!isOpen && isCallActive) endCall();
    }

    function close() {
        var widget = document.getElementById('aegis-call-widget');
        var panel  = document.getElementById('aegis-call-panel');
        if (!widget || !panel) return;
        widget.classList.remove('open');
        panel.setAttribute('aria-hidden', 'true');
        if (isCallActive) endCall();
    }

    // -------------------------------------------------
    // VOICE CALL — main flow
    // -------------------------------------------------
    var callStartedAt = 0;
    var timerInterval = null;
    var isMuted = false;

    function startConversation() {
        if (!isVoiceSupported) {
            alert('Voice calls require Chrome, Edge or Safari. Please open the website in one of those browsers to use the AI voice agent.');
            return;
        }
        if (isCallActive) return;

        // Switch UI to active call mode
        var widget = document.getElementById('aegis-call-widget');
        var idleBody = document.getElementById('aegis-call-body-idle');
        var activeBody = document.getElementById('aegis-call-body-active');
        var title = document.getElementById('aegis-call-title');
        idleBody.hidden = true;
        activeBody.hidden = false;
        widget.classList.add('in-call');
        title.textContent = 'Connecting…';

        isCallActive = true;
        isMuted = false;
        callStartedAt = Date.now();
        clearTranscript();

        // PHASE 1 — show "Connecting call…" with animation
        setStatus('connecting', 'Connecting call…');
        // Don't start the timer yet — wait until connection is "established"

        // PHASE 2 — after ~1.6s "connection", deliver the intro
        setTimeout(function () {
            if (!isCallActive) return;

            // Mark as connected
            title.textContent = 'On call with AEGIS AI';
            startTimer();

            var intro = "Hi, I'm AEGIS — Safety Excellence Group's AI safety intelligence agent. " +
                        "I can help you with OSHA regulations, SEMI S2 compliance, safety staffing, audits, and program development. " +
                        "Do you have any questions I can help you with today?";

            var introEl = addTranscriptLine('bot', '');   // empty bubble — typewriter fills it
            speak(intro, function onIntroDone() {
                if (isCallActive) startListening();
            }, introEl);
        }, 1600);
    }

    function startListening() {
        if (!isCallActive || isMuted || isSpeaking) return;

        try {
            recognition = new SpeechRecognition();
        } catch (err) {
            console.error('SpeechRecognition init error', err);
            setStatus('error', 'Mic unavailable');
            return;
        }

        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        var finalTranscript = '';

        recognition.onstart = function () {
            isListening = true;
            setStatus('listening', 'Listening…');
        };

        recognition.onresult = function (event) {
            var interim = '';
            for (var i = event.resultIndex; i < event.results.length; i++) {
                var t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t;
                } else {
                    interim += t;
                }
            }
            updateInterimTranscript(interim || finalTranscript);
        };

        recognition.onerror = function (event) {
            console.warn('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                setStatus('error', 'Microphone blocked — allow access and try again');
                endCall();
            } else if (event.error === 'no-speech') {
                // Silent — restart listening
                if (isCallActive && !isMuted) setTimeout(startListening, 200);
            }
        };

        recognition.onend = function () {
            isListening = false;
            if (!isCallActive) return;

            if (finalTranscript.trim()) {
                addTranscriptLine('user', finalTranscript.trim());
                clearInterim();
                sendToAI(finalTranscript.trim());
            } else if (!isMuted && !isSpeaking) {
                // Restart for next utterance
                setTimeout(startListening, 200);
            }
        };

        try {
            recognition.start();
        } catch (e) {
            // Already started — ignore
        }
    }

    function stopListening() {
        if (recognition) {
            try { recognition.stop(); } catch (e) {}
        }
        isListening = false;
    }

    function sendToAI(userText) {
        setStatus('thinking', 'AEGIS is thinking…');

        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: userText,
                sessionId: callSessionId
            })
        })
        .then(function (r) {
            if (!r.ok) {
                return r.text().then(function (body) {
                    throw new Error('Backend ' + r.status + ': ' + body.slice(0, 200));
                });
            }
            return r.json();
        })
        .then(function (data) {
            var reply = (data && data.message) ? data.message : "Sorry, I didn't catch that. Could you say it again?";
            var replyEl = addTranscriptLine('bot', '');   // empty bubble — typewriter fills it
            speak(reply, function () {
                if (isCallActive && !isMuted) startListening();
            }, replyEl);
        })
        .catch(function (err) {
            console.error('[AEGIS Call] /api/chat failed →', err);
            var fallback = "I'm having trouble connecting to the safety knowledge base right now. You can also reach our team directly at 4 6 9 . 9 8 8 . 4 7 7 7.";
            var fbEl = addTranscriptLine('bot', '');
            speak(fallback, function () {
                if (isCallActive && !isMuted) startListening();
            }, fbEl);
        });
    }

    function speak(text, onDone, transcriptTextEl) {
        if (!speechSynthesis) { if (onDone) onDone(); return; }

        // Strip markdown / emojis for cleaner TTS
        var clean = text
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/[*_`]/g, '')
            .replace(/\[(.*?)\]\(.*?\)/g, '$1')
            .replace(/[\u{1F600}-\u{1F6FF}\u{2600}-\u{27BF}]/gu, '');

        var utterance = new SpeechSynthesisUtterance(clean);
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 0.85;
        utterance.volume = 1.0;

        // -----------------------------------------------------
        // PROFESSIONAL WORD-BY-WORD REVEAL ANIMATION
        // Each word appears with fade + slide-up + blur-to-sharp
        // -----------------------------------------------------
        var revealedUntil = 0;   // characters already revealed
        var fallbackTimer = null;

        function clearFallback() {
            if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null; }
        }

        // Appends the new slice [revealedUntil → targetEnd) as <span> words.
        function revealUpTo(targetEnd) {
            if (!transcriptTextEl) return;
            if (targetEnd <= revealedUntil) return;
            if (targetEnd > clean.length) targetEnd = clean.length;

            var newPortion = clean.slice(revealedUntil, targetEnd);
            // Split keeping whitespace as separate tokens so spacing renders correctly
            var tokens = newPortion.match(/\S+|\s+/g) || [];
            for (var i = 0; i < tokens.length; i++) {
                if (/^\s+$/.test(tokens[i])) {
                    // Plain whitespace — no animation needed
                    transcriptTextEl.appendChild(document.createTextNode(tokens[i]));
                } else {
                    var span = document.createElement('span');
                    span.className = 'aegis-word-in';
                    span.textContent = tokens[i];
                    transcriptTextEl.appendChild(span);
                }
            }
            revealedUntil = targetEnd;

            var container = document.getElementById('aegis-call-transcript');
            if (container) container.scrollTop = container.scrollHeight;
        }

        utterance.onstart = function () {
            isSpeaking = true;
            setStatus('speaking', 'AEGIS is speaking…');

            if (!transcriptTextEl) return;
            transcriptTextEl.innerHTML = '';   // clear previous content
            revealedUntil = 0;

            // Fallback ticker — runs constantly in case onboundary doesn't fire.
            // It progressively reveals words at speech rate (~150 wpm).
            // If onboundary fires, it just races ahead and the fallback catches up.
            var totalMs = Math.max(1800, clean.length * 65);   // ~65ms per char
            var startedAt = Date.now();
            fallbackTimer = setInterval(function () {
                var elapsed = Date.now() - startedAt;
                var progress = Math.min(1, elapsed / totalMs);
                var idealEnd = Math.floor(progress * clean.length);
                // Snap to end-of-word boundary for cleaner reveal
                while (idealEnd < clean.length && /\S/.test(clean[idealEnd])) idealEnd++;
                revealUpTo(idealEnd);
                if (revealedUntil >= clean.length) clearFallback();
            }, 80);
        };

        // If the browser supports it, sync precisely with word boundaries (better than fallback)
        utterance.onboundary = function (event) {
            if (!transcriptTextEl) return;
            if (event.name && event.name !== 'word' && event.name !== 'sentence') return;
            if (typeof event.charIndex !== 'number') return;
            var endIdx = event.charIndex + (event.charLength || 0);
            // Reveal up to and including the trailing whitespace
            while (endIdx < clean.length && /\s/.test(clean[endIdx])) endIdx++;
            revealUpTo(endIdx);
        };

        utterance.onend = function () {
            clearFallback();
            revealUpTo(clean.length);
            if (transcriptTextEl) transcriptTextEl.classList.remove('aegis-call-typing');
            isSpeaking = false;
            if (onDone) onDone();
        };
        utterance.onerror = function () {
            clearFallback();
            revealUpTo(clean.length);
            if (transcriptTextEl) transcriptTextEl.classList.remove('aegis-call-typing');
            isSpeaking = false;
            if (onDone) onDone();
        };

        // Stop any previous speech first
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    }

    function endCall() {
        if (!isCallActive) return;
        isCallActive = false;
        stopListening();
        if (speechSynthesis) speechSynthesis.cancel();
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }

        // Reset UI back to idle
        var widget = document.getElementById('aegis-call-widget');
        var idleBody = document.getElementById('aegis-call-body-idle');
        var activeBody = document.getElementById('aegis-call-body-active');
        var title = document.getElementById('aegis-call-title');
        if (widget) widget.classList.remove('in-call');
        if (idleBody) idleBody.hidden = false;
        if (activeBody) activeBody.hidden = true;
        if (title) title.textContent = 'Call AEGIS AI';

        // Fresh session for the next call
        callSessionId = 'aegis_call_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function toggleMute() {
        isMuted = !isMuted;
        var btn = document.getElementById('aegis-call-mute');
        if (btn) btn.classList.toggle('muted', isMuted);
        if (isMuted) {
            stopListening();
            setStatus('muted', 'Muted');
        } else if (isCallActive && !isSpeaking) {
            startListening();
        }
    }

    // -------------------------------------------------
    // Transcript + UI helpers
    // -------------------------------------------------
    function clearTranscript() {
        var el = document.getElementById('aegis-call-transcript');
        if (el) el.innerHTML = '';
    }

    function addTranscriptLine(who, text) {
        var el = document.getElementById('aegis-call-transcript');
        if (!el) return null;
        // Remove the "empty" placeholder if present
        var empty = el.querySelector('.aegis-call-transcript-empty');
        if (empty) empty.remove();

        var line = document.createElement('div');
        line.className = 'aegis-call-line aegis-call-line-' + who;
        var label = who === 'user' ? 'You' : 'AEGIS';
        line.innerHTML = '<span class="aegis-call-line-label">' + label + '</span><span class="aegis-call-line-text"></span>';
        var textEl = line.querySelector('.aegis-call-line-text');
        textEl.textContent = text;
        // Add a blinking cursor while bot text is being typed out
        if (who === 'bot' && !text) {
            textEl.classList.add('aegis-call-typing');
        }
        el.appendChild(line);
        el.scrollTop = el.scrollHeight;
        return textEl;
    }

    function updateInterimTranscript(text) {
        var el = document.getElementById('aegis-call-transcript');
        if (!el) return;
        var interim = el.querySelector('.aegis-call-interim');
        if (!interim) {
            interim = document.createElement('div');
            interim.className = 'aegis-call-line aegis-call-line-user aegis-call-interim';
            interim.innerHTML = '<span class="aegis-call-line-label">You</span><span class="aegis-call-line-text"></span>';
            el.appendChild(interim);
        }
        interim.querySelector('.aegis-call-line-text').textContent = text;
        el.scrollTop = el.scrollHeight;
    }

    function clearInterim() {
        var el = document.getElementById('aegis-call-transcript');
        if (!el) return;
        var interim = el.querySelector('.aegis-call-interim');
        if (interim) interim.remove();
    }

    // Map call state → which video clip to show.
    // "connecting" reuses the listening clip since we don't have a dedicated one.
    var stateToClip = {
        connecting: 'listening',
        listening:  'listening',
        speaking:   'speaking',
        thinking:   'thinking',
        muted:      'listening',
        error:      'listening'
    };

    function setStatus(state, label) {
        var lbl = document.getElementById('aegis-call-status-label');
        var ring = document.getElementById('aegis-avatar-ring');
        var wrapper = document.getElementById('aegis-call-avatar-video');

        if (lbl) lbl.textContent = label;
        if (ring) ring.setAttribute('data-state', state);
        if (wrapper) wrapper.setAttribute('data-state', state);

        // Swap visible video clip
        var targetClip = stateToClip[state] || 'listening';
        var clips = ['listening', 'speaking', 'thinking'];
        clips.forEach(function (name) {
            var v = document.getElementById('aegis-avatar-' + name);
            if (!v) return;
            if (name === targetClip) {
                v.hidden = false;
                // Resume playback (videos pause when hidden in some browsers)
                var p = v.play();
                if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay block */ });
            } else {
                v.hidden = true;
                try { v.pause(); } catch (e) {}
            }
        });
    }

    function startTimer() {
        var el = document.getElementById('aegis-call-timer');
        if (!el) return;
        timerInterval = setInterval(function () {
            var secs = Math.floor((Date.now() - callStartedAt) / 1000);
            var m = Math.floor(secs / 60).toString().padStart(2, '0');
            var s = (secs % 60).toString().padStart(2, '0');
            el.textContent = m + ':' + s;
        }, 1000);
    }

    function openBooking(event) {
        if (event) event.preventDefault();
        close();
        if (typeof window.openBookingModal === 'function') {
            window.openBookingModal(event);
        } else if (typeof window.openModal === 'function') {
            window.openModal('bookingModal');
        }
    }

    // Init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createWidget);
    } else {
        createWidget();
    }

    // Public API
    window.AegisCallWidget = {
        toggle: toggle,
        close: close,
        startConversation: startConversation,
        endCall: endCall,
        toggleMute: toggleMute,
        openBooking: openBooking
    };
})();
