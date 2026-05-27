/**
 * AEGIS AI Chatbot
 * Safety Excellence Group
 *
 * Frontend chatbot widget that connects to Claude API via backend server.
 */

// Load reCAPTCHA helper (auto-injects captcha tokens into all /api/forms/ requests)
(function() {
    var s = document.createElement('script');
    s.src = '/js/recaptcha-helper.js';
    s.async = true;
    document.head.appendChild(s);
})();

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiUrl: `${window.location.origin}/api`, // Auto-detect based on current domain
        botName: 'AEGIS',
        botTagline: 'AI Safety Assistant',
        welcomeMessage: "Hi! 👋 I'm AEGIS, S.E.G.'s AI safety assistant. I can answer questions about OSHA regulations, SEMI S2 compliance, our services, or connect you with our team.\n\nHow can I help you today?",
        quickReplies: [
            "What services do you offer?",
            "📅 Book a discovery call",
            "I have a safety question"
        ]
    };

    // Session management
    let sessionId = sessionStorage.getItem('aegis_session') || generateSessionId();
    sessionStorage.setItem('aegis_session', sessionId);

    // State
    let isOpen = false;
    let welcomeShown = sessionStorage.getItem('aegis_welcome') === 'true';
    let disclaimerAccepted = sessionStorage.getItem('aegis_disclaimer') === 'true';
    let conversationHistory = [];
    let isTyping = false;
    let isOnline = false;
    let statusCheckInterval = null;

    // Generate unique session ID
    function generateSessionId() {
        return 'aegis_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Create and inject chatbot HTML
    function createChatbotHTML() {
        const widget = document.createElement('div');
        widget.className = 'aegis-widget';
        widget.id = 'aegis-widget';

        widget.innerHTML = `
            <!-- Chat Window -->
            <div class="aegis-chat${disclaimerAccepted ? '' : ' disclaimer-active'}" id="aegis-chat">
                <!-- Header -->
                <div class="aegis-header">
                    <div class="aegis-avatar">
                        <img src="/images/Aegis logo-15.png" alt="AEGIS" style="width: 32px; height: 32px; object-fit: contain;">
                    </div>
                    <div class="aegis-header-info">
                        <h4>${CONFIG.botName}</h4>
                        <p>${CONFIG.botTagline}</p>
                    </div>
                    <span class="aegis-status offline" id="aegis-status">Offline</span>
                    <button class="aegis-header-close" onclick="AEGIS.toggle()" aria-label="Close chat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <!-- Messages -->
                <div class="aegis-messages" id="aegis-messages"><div class="aegis-messages-inner" id="aegis-messages-inner"></div></div>

                <!-- Quick Replies -->
                <div class="aegis-quick-replies" id="aegis-quick-replies"></div>

                <!-- Disclaimer (shown first time, sits above the input) -->
                <div class="aegis-disclaimer" id="aegis-disclaimer" style="${disclaimerAccepted ? 'display: none;' : ''}">
                    <div class="aegis-disclaimer-content">
                        <p class="aegis-disclaimer-text">
                            AEGIS AI is for <strong>educational purposes only</strong> — not a substitute for professional safety audits, legal advice, or compliance certification.
                        </p>
                        <label class="aegis-disclaimer-check">
                            <input type="checkbox" id="aegis-disclaimer-checkbox">
                            <span>I agree</span>
                        </label>
                        <button class="aegis-disclaimer-btn" onclick="AEGIS.acceptDisclaimer()">Continue →</button>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="aegis-input-area">
                    <!-- Attachment preview chip (hidden until file selected) -->
                    <div class="aegis-attachment-preview" id="aegis-attachment-preview" style="display: none;"></div>

                    <div class="aegis-input-wrapper">
                        <textarea
                            class="aegis-input"
                            id="aegis-input"
                            placeholder="Type your message..."
                            rows="1"
                            ${!disclaimerAccepted ? 'disabled' : ''}
                        ></textarea>
                        <input type="file" id="aegis-file-input" accept="image/*,application/pdf" style="display: none;">
                        <button class="aegis-attach-btn" id="aegis-attach" type="button" aria-label="Attach file">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                            </svg>
                        </button>
                        <button class="aegis-send-btn" id="aegis-send" onclick="AEGIS.sendMessage()" ${!disclaimerAccepted ? 'disabled' : ''}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Footer -->
                <div class="aegis-footer">
                    Powered by <a href="https://aegisai.co" target="_blank">AEGISAI, LLC</a>
                </div>
            </div>

            <!-- Trigger Button -->
            <div class="aegis-tooltip">Chat with AEGIS AI</div>
            <button class="aegis-trigger" onclick="AEGIS.toggle()">
                <img class="chat-icon" src="/images/Aegis logo-15.png" alt="AEGIS AI">
                <svg class="close-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
            <span class="aegis-badge" id="aegis-badge">1</span>
        `;

        document.body.appendChild(widget);

        // Set up event listeners
        setupEventListeners();

        // Show welcome message if disclaimer already accepted
        if (disclaimerAccepted) {
            showWelcomeMessage();
        }
    }

    // Pending attachment (in-memory only, never sent to backend as binary)
    let pendingAttachment = null;

    // Set up event listeners
    function setupEventListeners() {
        const input = document.getElementById('aegis-input');

        // Auto-resize textarea
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // Send on Enter (but allow Shift+Enter for new line)
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // File input change handler
        const fileInput = document.getElementById('aegis-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelected);
        }

        // Attach button → open file picker
        const attachBtn = document.getElementById('aegis-attach');
        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                fileInput.click();
            });
        }

        // Close chat when clicking outside (all screen sizes — backdrop tap on mobile)
        document.addEventListener('click', function(e) {
            const widget = document.getElementById('aegis-widget');
            const chat = document.getElementById('aegis-chat');
            const trigger = widget.querySelector('.aegis-trigger');

            if (isOpen && !chat.contains(e.target) && !trigger.contains(e.target)) {
                toggle();
            }
        });

        // Update disclaimer-active class based on disclaimer visibility
        updateDisclaimerState();

        // Track header visibility to adjust chat top position
        setupHeaderTracking();
    }

    // Header tracking removed - chat uses fixed max-height via CSS
    function setupHeaderTracking() {
        // No-op: widget size is now stable via CSS max-height
    }

    // Update disclaimer active state
    function updateDisclaimerState() {
        const chat = document.getElementById('aegis-chat');
        const disclaimer = document.getElementById('aegis-disclaimer');
        if (disclaimer && disclaimer.style.display !== 'none') {
            chat.classList.add('disclaimer-active');
        } else {
            chat.classList.remove('disclaimer-active');
        }
    }

    // Toggle chat window
    function toggle() {
        const widget = document.getElementById('aegis-widget');
        const badge = document.getElementById('aegis-badge');

        isOpen = !isOpen;
        widget.classList.toggle('open', isOpen);
        document.body.classList.toggle('aegis-chat-open', isOpen);

        if (isOpen) {
            badge.style.display = 'none';
            // Also close the call widget if it happens to be open
            if (window.AegisCallWidget && typeof window.AegisCallWidget.close === 'function') {
                window.AegisCallWidget.close();
            }
            if (disclaimerAccepted) {
                document.getElementById('aegis-input').focus();
            }
            updateDisclaimerState();
        }
    }

    // Show disclaimer (after welcome screen)
    function showDisclaimer() {
        welcomeShown = true;
        sessionStorage.setItem('aegis_welcome', 'true');

        document.getElementById('aegis-welcome').style.display = 'none';
        document.getElementById('aegis-disclaimer').style.display = 'block';
    }

    // Accept disclaimer
    function acceptDisclaimer() {
        const checkbox = document.getElementById('aegis-disclaimer-checkbox');
        if (!checkbox || !checkbox.checked) {
            alert('Please check the box to confirm you have read and agree to the disclaimer.');
            return;
        }

        disclaimerAccepted = true;
        sessionStorage.setItem('aegis_disclaimer', 'true');

        document.getElementById('aegis-disclaimer').style.display = 'none';
        document.getElementById('aegis-input').disabled = false;
        document.getElementById('aegis-send').disabled = false;
        const attachBtn = document.getElementById('aegis-attach');
        if (attachBtn) attachBtn.disabled = false;

        // Update disclaimer state to show messages area
        updateDisclaimerState();

        showWelcomeMessage();
        document.getElementById('aegis-input').focus();
    }

    // Show welcome message
    function showWelcomeMessage() {
        if (conversationHistory.length === 0) {
            addMessage(CONFIG.welcomeMessage, 'bot');
            showQuickReplies(CONFIG.quickReplies);
        }
    }

    // Add message to chat
    function addMessage(text, sender, attachment) {
        const inner = document.getElementById('aegis-messages-inner');

        const messageEl = document.createElement('div');
        messageEl.className = `aegis-message ${sender}`;

        const avatarSvg = sender === 'bot'
            ? '<img src="/images/Aegis logo-15.png" alt="AEGIS" style="width: 24px; height: 24px; object-fit: contain;">'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

        const formattedText = formatMessage(text);
        const attachmentHtml = attachment ? renderAttachmentInBubble(attachment) : '';

        messageEl.innerHTML = `
            <div class="avatar">${avatarSvg}</div>
            <div class="bubble">${attachmentHtml}${formattedText}</div>
        `;

        inner.appendChild(messageEl);
        const scroller = document.getElementById('aegis-messages');
        scroller.scrollTop = scroller.scrollHeight;

        conversationHistory.push({ sender, text });
    }

    // Format message text
    function formatMessage(text) {
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/🔹/g, '<span style="color: #FFCF00;">🔹</span>')
            .replace(/⚡/g, '<span style="color: #FFCF00;">⚡</span>')
            .replace(/✅/g, '<span style="color: #22c55e;">✅</span>');
    }

    // Show typing indicator
    function showTyping() {
        isTyping = true;
        const inner = document.getElementById('aegis-messages-inner');

        const typingEl = document.createElement('div');
        typingEl.className = 'aegis-message bot';
        typingEl.id = 'aegis-typing';

        typingEl.innerHTML = `
            <div class="avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
            <div class="aegis-typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;

        inner.appendChild(typingEl);
        const scroller = document.getElementById('aegis-messages');
        scroller.scrollTop = scroller.scrollHeight;
    }

    // Hide typing indicator
    function hideTyping() {
        isTyping = false;
        const typingEl = document.getElementById('aegis-typing');
        if (typingEl) {
            typingEl.remove();
        }
    }

    // Show quick replies
    function showQuickReplies(replies) {
        const container = document.getElementById('aegis-quick-replies');
        container.innerHTML = '';
        
        replies.forEach(reply => {
            const btn = document.createElement('button');
            btn.className = 'aegis-quick-btn';
            btn.textContent = reply;
            btn.onclick = (e) => {
                e.stopPropagation(); // Prevent click from bubbling to document close handler
                container.innerHTML = '';
                
                // Handle special actions
                if (reply.includes('Book') || reply.includes('discovery call')) {
                    showQualificationForm();
                } else if (reply.includes('scope my needs') || reply.includes('Help me')) {
                    showQualificationForm();
                } else {
                    sendMessage(reply);
                }
            };
            container.appendChild(btn);
        });
    }

    // Clear quick replies
    function clearQuickReplies() {
        document.getElementById('aegis-quick-replies').innerHTML = '';
    }

    // Handle file selected from picker
    function handleFileSelected(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        // Validate type
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!allowed.includes(file.type)) {
            alert('Only images (JPG, PNG, GIF, WebP) and PDF files are supported.');
            e.target.value = '';
            return;
        }

        // Validate size (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            alert('File is too large. Maximum size is 5MB.');
            e.target.value = '';
            return;
        }

        pendingAttachment = {
            name: file.name,
            type: file.type,
            size: file.size,
            isImage: file.type.startsWith('image/'),
            dataUrl: null
        };

        // For images, generate a thumbnail preview
        if (pendingAttachment.isImage) {
            const reader = new FileReader();
            reader.onload = function(ev) {
                pendingAttachment.dataUrl = ev.target.result;
                renderAttachmentPreview();
            };
            reader.readAsDataURL(file);
        } else {
            renderAttachmentPreview();
        }

        // Reset input so the same file can be picked again
        e.target.value = '';
    }

    // Format byte size as human-readable
    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Render attachment preview chip above input
    function renderAttachmentPreview() {
        const container = document.getElementById('aegis-attachment-preview');
        if (!container) return;

        if (!pendingAttachment) {
            container.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        const a = pendingAttachment;
        const thumb = a.isImage && a.dataUrl
            ? `<img src="${a.dataUrl}" alt="" class="aegis-attach-thumb">`
            : `<div class="aegis-attach-thumb aegis-attach-thumb-pdf">PDF</div>`;

        container.innerHTML = `
            ${thumb}
            <div class="aegis-attach-meta">
                <span class="aegis-attach-name">${escapeHtml(a.name)}</span>
                <span class="aegis-attach-size">${formatBytes(a.size)}</span>
            </div>
            <button type="button" class="aegis-attach-remove" aria-label="Remove attachment" onclick="AEGIS.removeAttachment()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;
        container.style.display = 'flex';
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function removeAttachment() {
        pendingAttachment = null;
        renderAttachmentPreview();
    }

    // Render attachment INSIDE a message bubble (for user's sent messages)
    function renderAttachmentInBubble(att) {
        if (!att) return '';
        if (att.isImage && att.dataUrl) {
            return `<div class="aegis-bubble-attachment"><img src="${att.dataUrl}" alt="${escapeHtml(att.name)}" class="aegis-bubble-image"></div>`;
        }
        return `
            <div class="aegis-bubble-attachment aegis-bubble-file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>
                <div>
                    <div class="aegis-bubble-file-name">${escapeHtml(att.name)}</div>
                    <div class="aegis-bubble-file-size">${formatBytes(att.size)}</div>
                </div>
            </div>
        `;
    }

    // Send message
    async function sendMessage(overrideText) {
        const input = document.getElementById('aegis-input');
        const message = overrideText || input.value.trim();
        const attachment = pendingAttachment;

        if ((!message && !attachment) || isTyping) return;

        // Clear input
        input.value = '';
        input.style.height = 'auto';

        // Clear quick replies
        clearQuickReplies();

        // Build effective message text (include attachment marker for backend context)
        const messageWithAttachment = attachment
            ? (message ? message + '\n\n[Attached: ' + attachment.name + ']' : '[Attached: ' + attachment.name + ']')
            : message;

        // Add user message (with attachment rendered in bubble)
        addMessage(messageWithAttachment, 'user', attachment);

        // Clear attachment state AFTER message is rendered
        pendingAttachment = null;
        renderAttachmentPreview();
        
        // Show typing indicator
        showTyping();
        
        try {
            // Call backend API
            const response = await fetch(`${CONFIG.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: messageWithAttachment,
                    sessionId,
                    attachment: attachment ? { name: attachment.name, type: attachment.type, size: attachment.size } : undefined
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            
            // Hide typing and show response
            hideTyping();
            addMessage(data.message, 'bot');
            setOnline(true);

            // Check if we should show lead capture form
            checkForLeadCapture(message, data.message);

        } catch (error) {
            console.error('AEGIS Error:', error);
            hideTyping();
            setOnline(false);
            addMessage("I'm having trouble connecting right now. Please try again, or call us directly at 469.988.4777.", 'bot');
        }
    }

    // Check if we should show lead capture
    function checkForLeadCapture(userMessage, botResponse) {
        const leadTriggers = [
            'proposal', 'quote', 'pricing', 'cost', 'contact', 'call',
            'reach out', 'talk to someone', 'schedule', 'book'
        ];
        
        const combined = (userMessage + ' ' + botResponse).toLowerCase();
        const shouldCapture = leadTriggers.some(trigger => combined.includes(trigger));
        
        if (shouldCapture && !document.getElementById('aegis-lead-form') && !document.getElementById('aegis-qual-form')) {
            setTimeout(() => {
                showQuickReplies([
                    "📅 Book a discovery call",
                    "📋 Help me scope my needs",
                    "Keep chatting"
                ]);
            }, 500);
        }
    }

    // Show qualification form with dropdowns
    function showQualificationForm() {
        const inner = document.getElementById('aegis-messages-inner');
        const scroller = document.getElementById('aegis-messages');
        clearQuickReplies();

        // Remove existing form if present
        const existingForm = document.getElementById('aegis-qual-form');
        if (existingForm) existingForm.remove();

        const formEl = document.createElement('div');
        formEl.id = 'aegis-qual-form';
        formEl.className = 'aegis-qual-form';

        formEl.innerHTML = `
            <h5>📋 Quick Qualification</h5>
            <p style="font-size: 12px; color: #666; margin-bottom: 12px;">Help us prepare for your discovery call:</p>

            <div class="aegis-form-group">
                <label>Company Name</label>
                <input type="text" id="qual-company" placeholder="Enter your company name..." class="aegis-qual-input">
            </div>

            <div class="aegis-form-group">
                <label>Industry</label>
                <select id="qual-industry">
                    <option value="">Select industry...</option>
                    <option value="semiconductor">Semiconductor</option>
                    <option value="datacenter">Data Center</option>
                    <option value="construction">Construction</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <div class="aegis-form-group">
                <label>What do you need?</label>
                <select id="qual-service">
                    <option value="">Select service...</option>
                    <option value="staffing">Staffing Solutions</option>
                    <option value="audits">Assessments & Audits</option>
                    <option value="program">Program Development</option>
                    <option value="vetting">Subcontractor Vetting</option>
                    <option value="not-sure">Not Sure Yet</option>
                </select>
            </div>

            <div class="aegis-form-group">
                <label>Timeline</label>
                <select id="qual-timeline">
                    <option value="">Select timeline...</option>
                    <option value="asap">ASAP (within 2 weeks)</option>
                    <option value="1-3months">1-3 months</option>
                    <option value="3-6months">3-6 months</option>
                    <option value="planning">6+ months / Planning</option>
                </select>
            </div>

            <button onclick="AEGIS.submitQualification()" class="aegis-qual-submit">
                📅 Book My Discovery Call
            </button>
        `;

        inner.appendChild(formEl);
        scroller.scrollTop = scroller.scrollHeight;
    }

    // Submit qualification and show booking calendar
    async function submitQualification() {
        const company = document.getElementById('qual-company').value.trim();
        const industry = document.getElementById('qual-industry').value;
        const service = document.getElementById('qual-service').value;
        const timeline = document.getElementById('qual-timeline').value;

        if (!company || !industry || !service || !timeline) {
            alert('Please fill out all fields to continue.');
            return;
        }

        // Remove the form
        const form = document.getElementById('aegis-qual-form');
        if (form) form.remove();

        // Show user's selections as a message
        const industryLabels = { semiconductor: 'Semiconductor', datacenter: 'Data Center', construction: 'Construction', manufacturing: 'Manufacturing', other: 'Other' };
        const serviceLabels = { staffing: 'Staffing Solutions', audits: 'Assessments & Audits', program: 'Program Development', vetting: 'Subcontractor Vetting', 'not-sure': 'Not Sure Yet' };
        const timelineLabels = { asap: 'ASAP', '1-3months': '1-3 months', '3-6months': '3-6 months', planning: '6+ months' };

        addMessage(`Company: ${company}\nIndustry: ${industryLabels[industry]}\nService: ${serviceLabels[service]}\nTimeline: ${timelineLabels[timeline]}`, 'user');

        // Store qualification data
        window.aegisQualData = { company, industry, service, timeline };
        
        // Show bot response and calendar
        setTimeout(() => {
            addMessage("Perfect! 🎯 Pick a time that works for you:", 'bot');
            
            setTimeout(() => {
                showBookingCalendar();
            }, 500);
        }, 500);
    }

    // Show GHL booking calendar in modal overlay
    function showBookingCalendar() {
        // Remove existing modal if present
        const existingModal = document.getElementById('aegis-calendar-modal');
        if (existingModal) existingModal.remove();

        // Create modal overlay
        const modalEl = document.createElement('div');
        modalEl.id = 'aegis-calendar-modal';
        modalEl.className = 'aegis-calendar-modal';

        modalEl.innerHTML = `
            <div class="aegis-calendar-modal-backdrop" onclick="AEGIS.closeCalendarModal()"></div>
            <div class="aegis-calendar-modal-content">
                <div class="aegis-calendar-modal-header">
                    <h3>📅 Book Your Discovery Call</h3>
                    <button class="aegis-calendar-modal-close" onclick="AEGIS.closeCalendarModal()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div class="aegis-calendar-modal-body">
                    <iframe
                        src="https://api.leadconnectorhq.com/widget/booking/56IkA4NNqXU4MQAnpmAh"
                        style="width: 100%; height: 100%; border: none;"
                        scrolling="yes"
                        frameborder="0"
                    ></iframe>
                </div>
            </div>
        `;

        document.body.appendChild(modalEl);

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        // Load GHL script if not already loaded
        if (!document.getElementById('ghl-form-script')) {
            const script = document.createElement('script');
            script.id = 'ghl-form-script';
            script.src = 'https://link.msgsndr.com/js/form_embed.js';
            script.type = 'text/javascript';
            document.body.appendChild(script);
        }
    }

    // Close calendar modal
    function closeCalendarModal() {
        const modal = document.getElementById('aegis-calendar-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    }

    // Show lead capture form
    function showLeadForm() {
        const inner = document.getElementById('aegis-messages-inner');
        const scroller = document.getElementById('aegis-messages');

        // Remove existing form if present
        const existingForm = document.getElementById('aegis-lead-form');
        if (existingForm) existingForm.remove();

        const formEl = document.createElement('div');
        formEl.id = 'aegis-lead-form';
        formEl.className = 'aegis-lead-form';

        formEl.innerHTML = `
            <h5>📅 Book Your Discovery Call</h5>
            <input type="text" id="lead-name" placeholder="Your name *" required>
            <input type="email" id="lead-email" placeholder="Email address *" required>
            <input type="tel" id="lead-phone" placeholder="Phone number *" required>
            <input type="text" id="lead-company" placeholder="Company name">
            <button onclick="AEGIS.submitLead()">Schedule My Call →</button>
        `;

        inner.appendChild(formEl);
        scroller.scrollTop = scroller.scrollHeight;
    }

    // Submit lead
    async function submitLead() {
        const name = document.getElementById('lead-name').value.trim();
        const email = document.getElementById('lead-email').value.trim();
        const phone = document.getElementById('lead-phone').value.trim();
        const company = document.getElementById('lead-company').value.trim();
        
        if (!name || !email || !phone) {
            alert('Please enter your name, email, and phone number.');
            return;
        }
        
        // Get qualification data if available
        const qualData = window.aegisQualData || {};
        
        try {
            await fetch(`${CONFIG.apiUrl}/lead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    company,
                    industry: qualData.industry,
                    service: qualData.service,
                    timeline: qualData.timeline,
                    conversationHistory,
                    sessionId
                })
            });
            
            // Remove form and show confirmation
            const form = document.getElementById('aegis-lead-form');
            form.remove();
            
            addMessage(`Thanks ${name}! 🎉\n\nYou're all set! Our team will reach out within 2 hours to schedule your discovery call.\n\nWe'll come prepared to discuss your specific needs. Talk soon!`, 'bot');
            
        } catch (error) {
            console.error('Lead submission error:', error);
            addMessage("There was an issue submitting your info. Please call us directly at 469.988.4777 or email info@safety-excellence.com.", 'bot');
        }
    }

    // Check API connectivity status
    async function checkStatus() {
        const statusEl = document.getElementById('aegis-status');
        if (!statusEl) return;

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${CONFIG.apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: '', sessionId: 'ping' }),
                signal: controller.signal
            });
            clearTimeout(timeout);
            // Any response (even 400) means server is reachable
            setOnline(true);
        } catch (e) {
            setOnline(false);
        }
    }

    // Update online/offline state
    function setOnline(online) {
        isOnline = online;
        const statusEl = document.getElementById('aegis-status');
        if (!statusEl) return;

        if (online) {
            statusEl.textContent = 'Online';
            statusEl.classList.remove('offline');
        } else {
            statusEl.textContent = 'Offline';
            statusEl.classList.add('offline');
        }
    }

    // Initialize
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                createChatbotHTML();
                checkStatus();
                statusCheckInterval = setInterval(checkStatus, 30000);
            });
        } else {
            createChatbotHTML();
            checkStatus();
            statusCheckInterval = setInterval(checkStatus, 30000);
        }
    }

    // Expose public API
    window.AEGIS = {
        init,
        toggle,
        showDisclaimer,
        acceptDisclaimer,
        sendMessage,
        showLeadForm,
        submitLead,
        showQualificationForm,
        submitQualification,
        showBookingCalendar,
        closeCalendarModal,
        removeAttachment
    };

    // Auto-initialize
    init();

})();
