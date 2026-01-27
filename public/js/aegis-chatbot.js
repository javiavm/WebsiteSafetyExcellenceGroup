/**
 * AEGIS AI Chatbot
 * Safety Excellence Group
 * 
 * Frontend chatbot widget that connects to Claude API via backend server.
 */

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
            <div class="aegis-chat" id="aegis-chat">
                <!-- Header -->
                <div class="aegis-header">
                    <div class="aegis-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <div class="aegis-header-info">
                        <h4>${CONFIG.botName}</h4>
                        <p>${CONFIG.botTagline}</p>
                    </div>
                    <span class="aegis-status">Online</span>
                </div>

                <!-- Disclaimer (shown first time) -->
                <div class="aegis-disclaimer" id="aegis-disclaimer" style="${disclaimerAccepted ? 'display: none;' : ''}">
                    <div class="aegis-disclaimer-content">
                        <strong>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFCF00" stroke-width="2">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            Important Disclaimer
                        </strong>
                        <div style="max-height: 150px; overflow-y: auto; margin: 8px 0; padding: 8px; background: #fff; border-radius: 4px; font-size: 10px; line-height: 1.4;">
                            <p style="margin-bottom: 6px;">AEGIS AI is provided by Safety Excellence Group for <strong>educational and informational purposes only</strong>.</p>
                            <p style="margin-bottom: 6px;"><strong>This tool does NOT constitute:</strong></p>
                            <ul style="margin: 4px 0 6px 16px; padding: 0;">
                                <li>A professional safety audit or compliance assessment</li>
                                <li>Legal, regulatory, or professional advice</li>
                                <li>Certification of compliance with OSHA, ANSI, SEMI, or any standard</li>
                                <li>A substitute for consultation with qualified safety professionals</li>
                            </ul>
                            <p style="margin-bottom: 6px;"><strong>No liability.</strong> Safety Excellence Group assumes no responsibility for outcomes resulting from the use of this tool. Users assume all risk.</p>
                            <p><strong>Recommendation:</strong> Engage qualified safety professionals for comprehensive assessments.</p>
                        </div>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 11px; font-weight: 500; color: var(--aegis-blue); margin-bottom: 8px;">
                            <input type="checkbox" id="aegis-disclaimer-checkbox" style="width: 16px; height: 16px;">
                            <span>I have read, understand, and agree to this disclaimer</span>
                        </label>
                        <button class="aegis-disclaimer-btn" onclick="AEGIS.acceptDisclaimer()">I Agree — Continue →</button>
                    </div>
                </div>

                <!-- Messages -->
                <div class="aegis-messages" id="aegis-messages"></div>

                <!-- Quick Replies -->
                <div class="aegis-quick-replies" id="aegis-quick-replies"></div>

                <!-- Input Area -->
                <div class="aegis-input-area">
                    <div class="aegis-input-wrapper">
                        <textarea 
                            class="aegis-input" 
                            id="aegis-input" 
                            placeholder="Type your message..."
                            rows="1"
                            ${!disclaimerAccepted ? 'disabled' : ''}
                        ></textarea>
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
    }

    // Toggle chat window
    function toggle() {
        const widget = document.getElementById('aegis-widget');
        const badge = document.getElementById('aegis-badge');
        
        isOpen = !isOpen;
        widget.classList.toggle('open', isOpen);
        
        if (isOpen) {
            badge.style.display = 'none';
            if (disclaimerAccepted) {
                document.getElementById('aegis-input').focus();
            }
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
    function addMessage(text, sender) {
        const messagesContainer = document.getElementById('aegis-messages');
        
        const messageEl = document.createElement('div');
        messageEl.className = `aegis-message ${sender}`;
        
        const avatarSvg = sender === 'bot' 
            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>'
            : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
        
        // Format message text (handle line breaks and basic markdown)
        const formattedText = formatMessage(text);
        
        messageEl.innerHTML = `
            <div class="avatar">${avatarSvg}</div>
            <div class="bubble">${formattedText}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Store in conversation history
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
        const messagesContainer = document.getElementById('aegis-messages');
        
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
        
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
            btn.onclick = () => {
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

    // Send message
    async function sendMessage(overrideText) {
        const input = document.getElementById('aegis-input');
        const message = overrideText || input.value.trim();
        
        if (!message || isTyping) return;
        
        // Clear input
        input.value = '';
        input.style.height = 'auto';
        
        // Clear quick replies
        clearQuickReplies();
        
        // Add user message
        addMessage(message, 'user');
        
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
                    message,
                    sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            
            // Hide typing and show response
            hideTyping();
            addMessage(data.message, 'bot');
            
            // Check if we should show lead capture form
            checkForLeadCapture(message, data.message);
            
        } catch (error) {
            console.error('AEGIS Error:', error);
            hideTyping();
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
        const messagesContainer = document.getElementById('aegis-messages');
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
        
        messagesContainer.appendChild(formEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        const messagesContainer = document.getElementById('aegis-messages');
        
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
        
        messagesContainer.appendChild(formEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

    // Initialize
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createChatbotHTML);
        } else {
            createChatbotHTML();
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
        closeCalendarModal
    };

    // Auto-initialize
    init();

})();
