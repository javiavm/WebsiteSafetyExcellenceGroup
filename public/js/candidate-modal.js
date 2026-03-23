/**
 * candidate-modal.js
 * Injects the candidate application modal into any page.
 * Include this script and call openModal('candidateModal', event) from any button.
 */
(function () {
    // Skip if already injected
    if (document.getElementById('candidateModal')) return;

    /* ── 1. CSS ────────────────────────────────────────────────────── */
    var style = document.createElement('style');
    style.textContent = [
        '.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;opacity:0;visibility:hidden;transition:opacity .3s ease,visibility .3s ease;padding:1rem;}',
        '.modal-overlay.active{opacity:1;visibility:visible;}',
        '.modal{background:#fff;border-radius:16px;width:100%;max-width:680px;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,.2);transform:translateY(20px);transition:transform .3s ease;}',
        '.modal-overlay.active .modal{transform:translateY(0);}',
        '.modal-header{display:flex;align-items:flex-start;justify-content:space-between;padding:1.75rem 2rem 1.25rem;border-bottom:1px solid #e5e7eb;position:sticky;top:0;background:#fff;z-index:1;border-radius:16px 16px 0 0;}',
        '.modal-header h3{font-size:1.35rem;color:#132544;margin:0;}',
        '.modal-header p{color:#6b7280;font-size:.9rem;margin:.25rem 0 0;opacity:.85;}',
        '.modal-close{background:none;border:none;cursor:pointer;padding:.5rem;color:#9ca3af;transition:color .3s ease;line-height:1;}',
        '.modal-close:hover{color:#374151;}',
        '.modal-body{padding:1.75rem 2rem 2rem;}',
        '.form-section-title{font-size:.85rem;font-weight:600;color:#132544;text-transform:uppercase;letter-spacing:.05em;margin-bottom:1rem;padding-bottom:.5rem;border-bottom:2px solid #FFCF00;}',
        '.cmod-form-group{margin-bottom:1.25rem;}',
        '.cmod-form-group label{display:block;font-weight:500;font-size:.9rem;margin-bottom:.4rem;color:#374151;}',
        '.cmod-form-group label .required{color:#ef4444;}',
        '.cmod-form-group input,.cmod-form-group select,.cmod-form-group textarea{width:100%;padding:.875rem 1rem;border:2px solid #d1d5db;border-radius:6px;font-family:inherit;font-size:.95rem;transition:border-color .3s ease;outline:none;background:#fff;box-sizing:border-box;}',
        '.cmod-form-group input:focus,.cmod-form-group select:focus{border-color:#FFCF00;}',
        '.cmod-form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem;}',
        '@media(max-width:560px){.cmod-form-row{grid-template-columns:1fr;}}',
        '.checkbox-group{display:flex;flex-wrap:wrap;gap:.5rem;}',
        '.checkbox-item{display:flex;align-items:center;gap:.4rem;padding:.5rem .75rem;background:#f9fafb;border-radius:6px;cursor:pointer;transition:background .2s;font-size:.85rem;}',
        '.checkbox-item:hover{background:#e5e7eb;}',
        '.checkbox-item input{width:auto;margin:0;}',
        '.behavioral-question{margin-bottom:1.5rem;padding:1.25rem;background:#f9fafb;border-radius:8px;}',
        '.behavioral-question p{font-weight:600;color:#132544;margin-bottom:1rem;font-size:.95rem;}',
        '.radio-options{display:flex;flex-direction:column;gap:.5rem;}',
        '.radio-option{display:flex;align-items:center;gap:.75rem;padding:.75rem 1rem;background:#fff;border-radius:6px;cursor:pointer;transition:all .2s;border:2px solid transparent;}',
        '.radio-option:hover{background:#e5e7eb;}',
        '.radio-option.selected{border-color:#FFCF00;background:rgba(255,207,0,.1);}',
        '.radio-option input{display:none;}',
        '.file-upload{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;border:2px dashed #d1d5db;border-radius:8px;cursor:pointer;transition:all .2s;text-align:center;}',
        '.file-upload:hover{border-color:#FFCF00;background:#f9fafb;}',
        '.file-upload input{display:none;}',
        '.file-upload-icon svg{width:40px;height:40px;stroke:#9ca3af;margin-bottom:.5rem;}',
        '.file-upload span{color:#132544;font-weight:600;}',
        '.file-preview{display:none;align-items:center;gap:1rem;padding:1rem 1.25rem;background:#f0fdf4;border:1.5px solid #22c55e;border-radius:8px;margin-top:.75rem;}',
        '.file-preview.visible{display:flex;}',
        '.file-preview-icon{flex-shrink:0;width:40px;height:40px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;}',
        '.file-preview-icon svg{width:22px;height:22px;stroke:#16a34a;}',
        '.file-preview-info{flex:1;min-width:0;}',
        '.file-preview-name{font-weight:600;font-size:.9rem;color:#15803d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
        '.file-preview-size{font-size:.78rem;color:#6b7280;margin-top:2px;}',
        '.file-preview-check{flex-shrink:0;width:24px;height:24px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;}',
        '.file-preview-check svg{width:14px;height:14px;stroke:#fff;stroke-width:2.5;}',
        '.file-remove{background:none;border:none;cursor:pointer;color:#9ca3af;font-size:1.1rem;padding:0 0 0 .5rem;line-height:1;}',
        '.file-remove:hover{color:#ef4444;}',
        '.pdf-preview-container{display:none;margin-top:.75rem;border:1.5px solid #22c55e;border-radius:8px;overflow:hidden;}',
        '.pdf-preview-container.visible{display:block;}',
        '.pdf-preview-container iframe{width:100%;height:400px;border:none;display:block;}',
        '.form-submit{margin-top:1.5rem;text-align:center;}',
        '.form-submit .btn{width:100%;}',
        '.cmod-cancel-btn{display:none;margin-top:.75rem;width:100%;background:none;border:none;color:#9ca3af;font-size:.95rem;cursor:pointer;padding:.5rem;text-decoration:underline;}',
        '.cmod-cancel-btn:hover{color:#374151;}',
        '.required{color:#ef4444;}',
        '.behavioral-question p .required{font-weight:400;}',
        '@media(max-width:600px){.modal-close{padding:.75rem;}.modal-close svg{width:28px;height:28px;}.cmod-cancel-btn{display:block;}}'
    ].join('');
    document.head.appendChild(style);

    /* ── 2. Modal HTML ─────────────────────────────────────────────── */
    var wrapper = document.createElement('div');
    wrapper.innerHTML = '<div class="modal-overlay" id="candidateModal">' +
        '<div class="modal">' +
            '<div class="modal-header">' +
                '<div><h3>Join Our Network</h3><p>Apply to join our team of safety professionals</p></div>' +
                '<button class="modal-close" onclick="closeModal(\'candidateModal\')">' +
                    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' +
                '</button>' +
            '</div>' +
            '<div class="modal-body">' +
                '<form onsubmit="event.preventDefault(); submitCandidateForm();">' +

                    '<h5 class="form-section-title">Contact Information</h5>' +
                    '<div class="cmod-form-row">' +
                        '<div class="cmod-form-group"><label>Full Name <span class="required">*</span></label><input type="text" name="full_name" required placeholder="Your full name"></div>' +
                        '<div class="cmod-form-group"><label>Phone <span class="required">*</span></label><input type="tel" name="phone" required placeholder="(555) 123-4567"></div>' +
                    '</div>' +
                    '<div class="cmod-form-row">' +
                        '<div class="cmod-form-group"><label>Email <span class="required">*</span></label><input type="email" name="email" required placeholder="you@email.com"></div>' +
                        '<div class="cmod-form-group"><label>Location <span class="required">*</span></label><input type="text" name="location" required placeholder="City, State"></div>' +
                    '</div>' +

                    '<h5 class="form-section-title">Qualifications</h5>' +
                    '<div class="cmod-form-group">' +
                        '<label>Certifications (select all that apply) <span class="required">*</span></label>' +
                        '<div class="checkbox-group" data-group="certifications">' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="osha30"> OSHA 30</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="osha510"> OSHA 510</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="osha500"> OSHA 500</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="csp"> CSP</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="asp"> ASP</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="gsp"> GSP</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="chst"> CHST</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="ohst"> OHST</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="semis2"> SEMI S2/S8</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="nfpa70e"> NFPA 70E</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="firstaid"> First Aid/CPR</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="certifications" value="other"> Other BCSP</label>' +
                        '</div>' +
                    '</div>' +
                    '<div class="cmod-form-row">' +
                        '<div class="cmod-form-group"><label>Years of Experience <span class="required">*</span></label>' +
                            '<select name="years_experience" required>' +
                                '<option value="">Select experience</option>' +
                                '<option value="0-2">0-2 years</option>' +
                                '<option value="2-5">2-5 years</option>' +
                                '<option value="5-8">5-8 years</option>' +
                                '<option value="8-15">8-15 years</option>' +
                                '<option value="15+">15+ years</option>' +
                            '</select></div>' +
                        '<div class="cmod-form-group"><label>Role Level Sought <span class="required">*</span></label>' +
                            '<select name="role_level" required>' +
                                '<option value="">Select role level</option>' +
                                '<option value="technician">Safety Technician</option>' +
                                '<option value="coordinator">Safety Coordinator</option>' +
                                '<option value="specialist">Safety Specialist</option>' +
                                '<option value="lead">Safety Lead</option>' +
                                '<option value="manager">Safety Manager</option>' +
                                '<option value="director">Safety Director</option>' +
                            '</select></div>' +
                    '</div>' +
                    '<div class="cmod-form-group">' +
                        '<label>Industry Experience (select all that apply) <span class="required">*</span></label>' +
                        '<div class="checkbox-group" data-group="industries">' +
                            '<label class="checkbox-item"><input type="checkbox" name="industries" value="semiconductor"> Semiconductor</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="industries" value="datacenter"> Data Center</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="industries" value="construction"> Construction</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="industries" value="manufacturing"> Manufacturing</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="industries" value="oil-gas"> Oil &amp; Gas</label>' +
                            '<label class="checkbox-item"><input type="checkbox" name="industries" value="other"> Other</label>' +
                        '</div>' +
                    '</div>' +

                    '<h5 class="form-section-title">Availability</h5>' +
                    '<div class="cmod-form-row">' +
                        '<div class="cmod-form-group"><label>When Can You Start? <span class="required">*</span></label>' +
                            '<select name="start_date" required>' +
                                '<option value="">Select availability</option>' +
                                '<option value="immediate">Immediate</option>' +
                                '<option value="2weeks">Within 2 weeks</option>' +
                                '<option value="30days">Within 30 days</option>' +
                                '<option value="exploring">Just exploring</option>' +
                            '</select></div>' +
                        '<div class="cmod-form-group"><label>Work Type Preference <span class="required">*</span></label>' +
                            '<select name="work_type" required>' +
                                '<option value="">Select preference</option>' +
                                '<option value="longterm">Long-term</option>' +
                                '<option value="shortterm">Short-term</option>' +
                                '<option value="project">Project-based</option>' +
                                '<option value="temptohire">Temp-to-hire</option>' +
                                '<option value="open">Open to all</option>' +
                            '</select></div>' +
                    '</div>' +
                    '<div class="cmod-form-row">' +
                        '<div class="cmod-form-group"><label>Shift Availability <span class="required">*</span></label>' +
                            '<select name="shift_availability" required>' +
                                '<option value="">Select shift preference</option>' +
                                '<option value="days">Days only</option>' +
                                '<option value="nights">Nights only</option>' +
                                '<option value="both">Days &amp; Nights</option>' +
                                '<option value="rotating">Rotating shifts OK</option>' +
                                '<option value="flexible">Flexible / Any</option>' +
                            '</select></div>' +
                        '<div class="cmod-form-group"><label>Willing to Travel / Relocate?</label>' +
                            '<select name="travel_relocate">' +
                                '<option value="">Select</option>' +
                                '<option value="local">Local only (no travel)</option>' +
                                '<option value="regional">Regional travel OK</option>' +
                                '<option value="national">National travel OK</option>' +
                                '<option value="relocate">Open to relocation</option>' +
                            '</select></div>' +
                    '</div>' +

                    '<h5 class="form-section-title">A Few Quick Questions <span class="required">*</span></h5>' +

                    '<div class="behavioral-question">' +
                        '<p>1. A task falls outside your job description but needs to get done. You: <span class="required">*</span></p>' +
                        '<div class="radio-options">' +
                            '<label class="radio-option"><input type="radio" name="cmod_q1" value="4" required><span>Do it without being asked</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q1" value="3"><span>Do it if asked</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q1" value="2"><span>Suggest someone else handle it</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q1" value="1"><span>Explain why it\'s not your responsibility</span></label>' +
                        '</div>' +
                    '</div>' +

                    '<div class="behavioral-question">' +
                        '<p>2. You\'ve been with a company for 6 months. A competitor offers 10% more pay. You: <span class="required">*</span></p>' +
                        '<div class="radio-options">' +
                            '<label class="radio-option"><input type="radio" name="cmod_q2" value="1" required><span>Take the offer</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q2" value="2"><span>Use it to negotiate a raise</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q2" value="3"><span>Weigh growth, team, and your commitment before deciding</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q2" value="4"><span>Decline -- you made a commitment</span></label>' +
                        '</div>' +
                    '</div>' +

                    '<div class="behavioral-question">' +
                        '<p>3. A supervisor asks you to skip a safety step to meet a deadline. You: <span class="required">*</span></p>' +
                        '<div class="radio-options">' +
                            '<label class="radio-option"><input type="radio" name="cmod_q3" value="4" required><span>Refuse and document the request</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q3" value="2"><span>Push back but comply if pressed</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q3" value="1"><span>Follow the supervisor\'s lead</span></label>' +
                            '<label class="radio-option"><input type="radio" name="cmod_q3" value="3"><span>Complete it but report afterward</span></label>' +
                        '</div>' +
                    '</div>' +

                    '<h5 class="form-section-title">Resume</h5>' +
                    '<div class="cmod-form-group">' +
                        '<label class="file-upload" id="cmodFileUploadLabel">' +
                            '<input type="file" accept=".pdf,.doc,.docx" id="cmodResumeInput">' +
                            '<div class="file-upload-icon">' +
                                '<svg viewBox="0 0 24 24" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>' +
                            '</div>' +
                            '<p><span>Click to upload</span> or drag and drop</p>' +
                            '<p style="font-size:.8rem;color:#9ca3af;">PDF, DOC, DOCX (max 5MB)</p>' +
                        '</label>' +
                        '<div class="file-preview" id="cmodFilePreview">' +
                            '<div class="file-preview-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>' +
                            '<div class="file-preview-info">' +
                                '<div class="file-preview-name" id="cmodFileName">document.pdf</div>' +
                                '<div class="file-preview-size" id="cmodFileSize">0 KB</div>' +
                            '</div>' +
                            '<div class="file-preview-check"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg></div>' +
                            '<button type="button" class="file-remove" id="cmodFileRemove" title="Remove file">\u2715</button>' +
                        '</div>' +
                        '<div class="pdf-preview-container" id="cmodPdfPreviewContainer">' +
                            '<iframe id="cmodPdfPreviewFrame" title="PDF Preview"></iframe>' +
                        '</div>' +
                    '</div>' +

                    '<div class="form-submit">' +
                        '<button type="submit" class="btn btn-primary">Submit Application</button>' +
                        '<button type="button" class="cmod-cancel-btn" onclick="closeModal(\'candidateModal\')">Cancel</button>' +
                    '</div>' +

                '</form>' +
            '</div>' +
        '</div>' +
    '</div>';
    document.body.appendChild(wrapper.firstChild);

    /* ── 3. openModal / closeModal (define only if not already present) */
    if (typeof window.openModal !== 'function') {
        window.openModal = function (modalId, event) {
            if (event) event.preventDefault();
            var el = document.getElementById(modalId);
            if (el) { el.classList.add('active'); document.body.style.overflow = 'hidden'; }
        };
    }
    if (typeof window.closeModal !== 'function') {
        window.closeModal = function (modalId) {
            var el = document.getElementById(modalId);
            if (el) { el.classList.remove('active'); document.body.style.overflow = ''; }
        };
    }

    /* ── 4. Close on overlay click & Escape ───────────────────────── */
    document.getElementById('candidateModal').addEventListener('click', function (e) {
        if (e.target === this) { this.classList.remove('active'); document.body.style.overflow = ''; }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            var m = document.getElementById('candidateModal');
            if (m && m.classList.contains('active')) { m.classList.remove('active'); document.body.style.overflow = ''; }
        }
    });

    /* ── 5. Radio option styling ──────────────────────────────────── */
    document.querySelectorAll('#candidateModal .radio-option input').forEach(function (radio) {
        radio.addEventListener('change', function () {
            this.closest('.radio-options').querySelectorAll('.radio-option').forEach(function (opt) {
                opt.classList.remove('selected');
            });
            this.closest('.radio-option').classList.add('selected');
        });
    });

    /* ── 6. Validation helpers ────────────────────────────────────── */
    function showFieldError(field, msg) {
        field.style.borderColor = '#ef4444';
        var err = field.parentNode.querySelector('.field-error');
        if (!err) { err = document.createElement('p'); err.className = 'field-error'; err.style.cssText = 'color:#ef4444;font-size:.78rem;margin-top:.3rem;'; field.parentNode.appendChild(err); }
        err.textContent = msg;
    }
    function clearFieldError(field) {
        field.style.borderColor = '';
        var err = field.parentNode.querySelector('.field-error');
        if (err) err.remove();
    }
    function showGroupError(container, msg) {
        container.style.outline = '1.5px solid #ef4444';
        container.style.borderRadius = '6px';
        container.style.padding = '.5rem';
        var err = container.parentNode.querySelector('.field-error');
        if (!err) { err = document.createElement('p'); err.className = 'field-error'; err.style.cssText = 'color:#ef4444;font-size:.78rem;margin-top:.3rem;'; container.parentNode.appendChild(err); }
        err.textContent = msg;
    }
    function clearGroupError(container) {
        container.style.outline = '';
        container.style.padding = '';
        var err = container.parentNode.querySelector('.field-error');
        if (err) err.remove();
    }

    /* ── 7. submitCandidateForm ───────────────────────────────────── */
    window.submitCandidateForm = function () {
        var form = document.querySelector('#candidateModal form');
        var submitBtn = form.querySelector('button[type="submit"]');
        var originalText = submitBtn.textContent;
        var valid = true;
        var API_BASE = window.location.origin;

        // Required text/select fields
        var requiredFields = ['full_name', 'phone', 'email', 'location', 'years_experience', 'role_level', 'start_date', 'work_type', 'shift_availability'];
        requiredFields.forEach(function (name) {
            var el = form.querySelector('[name="' + name + '"]');
            if (!el) return;
            clearFieldError(el);
            if (!el.value.trim()) { showFieldError(el, 'This field is required.'); valid = false; }
        });

        // Certifications (at least one)
        var certGroup = form.querySelectorAll('input[name="certifications"]')[0] && form.querySelectorAll('input[name="certifications"]')[0].closest('.checkbox-group');
        var certChecked = form.querySelectorAll('input[name="certifications"]:checked').length > 0;
        if (certGroup) {
            clearGroupError(certGroup);
            if (!certChecked) { showGroupError(certGroup, 'Please select at least one certification.'); valid = false; }
        }

        // Industry experience (at least one)
        var indGroup = form.querySelectorAll('input[name="industries"]')[0] && form.querySelectorAll('input[name="industries"]')[0].closest('.checkbox-group');
        var indChecked = form.querySelectorAll('input[name="industries"]:checked').length > 0;
        if (indGroup) {
            clearGroupError(indGroup);
            if (!indChecked) { showGroupError(indGroup, 'Please select at least one industry.'); valid = false; }
        }

        // Behavioral questions (use cmod_ prefix names)
        ['cmod_q1', 'cmod_q2', 'cmod_q3'].forEach(function (q) {
            var checked = form.querySelector('input[name="' + q + '"]:checked');
            var grpEl = form.querySelectorAll('input[name="' + q + '"]')[0];
            var group = grpEl && grpEl.closest('.radio-options');
            if (group) {
                clearGroupError(group);
                if (!checked) { showGroupError(group, 'Please select an answer.'); valid = false; }
            }
        });

        // Resume
        var resumeInput = document.getElementById('cmodResumeInput');
        var resumeLabel = document.getElementById('cmodFileUploadLabel');
        if (resumeLabel) resumeLabel.style.borderColor = '';
        var resumeErr = resumeLabel && resumeLabel.parentNode.querySelector('.field-error');
        if (resumeErr) resumeErr.remove();
        if (!resumeInput || !resumeInput.files || resumeInput.files.length === 0) {
            if (resumeLabel) resumeLabel.style.borderColor = '#ef4444';
            var rErr = document.createElement('p');
            rErr.className = 'field-error';
            rErr.style.cssText = 'color:#ef4444;font-size:.78rem;margin-top:.3rem;';
            rErr.textContent = 'Please upload your resume.';
            if (resumeLabel) resumeLabel.parentNode.appendChild(rErr);
            valid = false;
        }

        if (!valid) {
            var firstErr = form.querySelector('.field-error');
            if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        var certifications = Array.from(form.querySelectorAll('input[name="certifications"]:checked')).map(function (cb) { return cb.value; }).join(', ');
        var industries = Array.from(form.querySelectorAll('input[name="industries"]:checked')).map(function (cb) { return cb.value; }).join(', ');
        var q1 = (form.querySelector('input[name="cmod_q1"]:checked') || {}).value || '';
        var q2 = (form.querySelector('input[name="cmod_q2"]:checked') || {}).value || '';
        var q3 = (form.querySelector('input[name="cmod_q3"]:checked') || {}).value || '';

        var data = {
            form_type: 'join_seg_network',
            full_name: form.querySelector('[name="full_name"]').value,
            phone: form.querySelector('[name="phone"]').value,
            email: form.querySelector('[name="email"]').value,
            location: form.querySelector('[name="location"]').value,
            certifications: certifications,
            years_experience: form.querySelector('[name="years_experience"]').value,
            role_level: form.querySelector('[name="role_level"]').value,
            industry_experience: industries,
            start_date: form.querySelector('[name="start_date"]').value,
            work_type: form.querySelector('[name="work_type"]').value,
            shift_availability: form.querySelector('[name="shift_availability"]').value,
            travel_relocate: (form.querySelector('[name="travel_relocate"]') || {}).value || '',
            q1_answer: q1,
            q2_answer: q2,
            q3_answer: q3
        };

        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        fetch(API_BASE + '/api/forms/candidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(function () {
            submitBtn.textContent = 'Application Submitted!';
            submitBtn.style.background = '#22c55e';
            setTimeout(function () {
                window.closeModal('candidateModal');
                form.reset();
                submitBtn.textContent = originalText;
                submitBtn.style.background = '';
                submitBtn.disabled = false;
            }, 2000);
        }).catch(function () {
            submitBtn.textContent = 'Error - Try Again';
            submitBtn.style.background = '#ef4444';
            submitBtn.disabled = false;
            setTimeout(function () { submitBtn.textContent = originalText; submitBtn.style.background = ''; }, 3000);
        });
    };

    /* ── 8. Resume upload + PDF preview ──────────────────────────── */
    (function () {
        var input = document.getElementById('cmodResumeInput');
        var label = document.getElementById('cmodFileUploadLabel');
        var preview = document.getElementById('cmodFilePreview');
        var nameEl = document.getElementById('cmodFileName');
        var sizeEl = document.getElementById('cmodFileSize');
        var removeBtn = document.getElementById('cmodFileRemove');
        var pdfContainer = document.getElementById('cmodPdfPreviewContainer');
        var pdfFrame = document.getElementById('cmodPdfPreviewFrame');
        var currentBlobUrl = null;

        function formatSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / 1048576).toFixed(1) + ' MB';
        }

        function showFile(file) {
            if (!file) return;
            var allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
                alert('Please upload a PDF, DOC, or DOCX file.');
                input.value = '';
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be 5MB or less.');
                input.value = '';
                return;
            }
            nameEl.textContent = file.name;
            sizeEl.textContent = formatSize(file.size);
            preview.classList.add('visible');
            label.style.display = 'none';

            if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
            if (file.type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
                currentBlobUrl = URL.createObjectURL(file);
                pdfFrame.src = currentBlobUrl;
                pdfContainer.classList.add('visible');
            } else {
                pdfContainer.classList.remove('visible');
                pdfFrame.src = '';
            }
        }

        input.addEventListener('change', function () {
            if (this.files && this.files[0]) showFile(this.files[0]);
        });

        removeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            input.value = '';
            preview.classList.remove('visible');
            pdfContainer.classList.remove('visible');
            pdfFrame.src = '';
            if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
            label.style.display = '';
        });

        label.addEventListener('dragover', function (e) { e.preventDefault(); this.style.borderColor = '#FFCF00'; });
        label.addEventListener('dragleave', function () { this.style.borderColor = ''; });
        label.addEventListener('drop', function (e) {
            e.preventDefault();
            this.style.borderColor = '';
            var file = e.dataTransfer.files[0];
            if (file) { input.files = e.dataTransfer.files; showFile(file); }
        });
    })();

})();
