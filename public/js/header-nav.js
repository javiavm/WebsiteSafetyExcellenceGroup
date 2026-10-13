(function () {
    'use strict';
    const header = document.getElementById('header');
    const mobile = document.getElementById('mobileMenu');
    if (!header || !mobile) return;
    const toggle = header.querySelector('.mobile-toggle');
    const overlay = document.querySelector('.mobile-menu-overlay');
    const close = mobile.querySelector('.mobile-menu-close');
    const desktop = window.matchMedia('(min-width: 1101px)');
    const hover = window.matchMedia('(hover: hover)');
    const dropdowns = Array.from(header.querySelectorAll('.dropdown'));
    let returnFocus, previousOverflow = '', closeTimer = 0;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let photoTimer = 0;
    const photoSets = new Map();
    header.querySelectorAll('.mega-menu-preview').forEach(function (preview) {
        const frame = preview.querySelector('.mega-menu-preview-image');
        if (!frame) return;
        const topic = preview.id.replace('preview-', '');
        frame.replaceChildren();
        const images = [1, 2, 3].map(function (number) {
            const image = document.createElement('img');
            image.className = 'nav-photo' + (number === 1 ? ' is-visible' : '');
            image.alt = ''; image.width = 900; image.height = 900;
            image.decoding = 'async';
            image.dataset.src = '/images/navigation/' + (topic === 'vetting' && number === 1 ? 'vetting-team' : topic + '-' + number) + '.webp';
            frame.appendChild(image);
            return image;
        });
        photoSets.set(preview, { images, index: 0 });
    });
    function updatePhotos() {
        clearInterval(photoTimer); photoTimer = 0;
        const preview = header.querySelector('.dropdown.is-open .mega-menu-preview.active');
        const set = photoSets.get(preview);
        if (!set || !desktop.matches || document.hidden) return;
        set.images.forEach(function (image) { if (!image.src) image.src = image.dataset.src; });
        if (reducedMotion.matches) return;
        photoTimer = setInterval(function () {
            const next = (set.index + 1) % set.images.length;
            const image = set.images[next];
            if (!image.complete || !image.naturalWidth) return;
            set.images[set.index].classList.remove('is-visible');
            image.classList.add('is-visible'); set.index = next;
        }, 5000);
    }
    document.addEventListener('visibilitychange', updatePhotos);
    reducedMotion.addEventListener('change', updatePhotos);
    window.SEGNavigation = {
        openModal: function (id, event) {
            if (event) event.preventDefault();
            window.closeMobileMenu(false);
            closeDropdowns();
            if (document.getElementById(id) && typeof window.openModal === 'function') window.openModal(id, event);
            else window.location.assign('/index.html?modal=' + encodeURIComponent(id));
        }
    };
    const requestedModal = new URLSearchParams(location.search).get('modal');
    if (requestedModal === 'candidateModal' || requestedModal === 'clientModal') {
        requestAnimationFrame(function () { if (document.getElementById(requestedModal)) window.SEGNavigation.openModal(requestedModal); });
    }

    function closeDropdowns() {
        clearTimeout(closeTimer);
        dropdowns.forEach(function (item) {
            item.classList.remove('is-open');
            item.querySelector(':scope > a').setAttribute('aria-expanded', 'false');
            item.querySelector('.mega-menu').inert = true;
        });
        updatePhotos();
    }
    function openDropdown(item) {
        if (!desktop.matches) return;
        if (item.classList.contains('is-open')) return;
        closeDropdowns();
        item.classList.add('is-open');
        item.querySelector(':scope > a').setAttribute('aria-expanded', 'true');
        item.querySelector('.mega-menu').inert = false;
        updatePhotos();
    }
    dropdowns.forEach(function (item, index) {
        const trigger = item.querySelector(':scope > a');
        const menu = item.querySelector('.mega-menu');
        menu.id = 'nav-mega-' + index;
        menu.inert = true;
        trigger.setAttribute('aria-controls', menu.id);
        trigger.setAttribute('aria-expanded', 'false');
        item.addEventListener('mouseenter', function () { clearTimeout(closeTimer); if (hover.matches) openDropdown(item); });
        item.addEventListener('mouseleave', function () {
            if (!item.contains(document.activeElement)) closeTimer = setTimeout(closeDropdowns, 180);
        });
        menu.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
        trigger.addEventListener('click', function (event) {
            if (event.ctrlKey || event.metaKey || event.shiftKey) return;
            event.preventDefault();
            if (item.classList.contains('is-open')) closeDropdowns(); else openDropdown(item);
        });
        trigger.addEventListener('keydown', function (event) {
            if (event.key === 'ArrowDown' || event.key === ' ') {
                event.preventDefault();
                openDropdown(item);
                requestAnimationFrame(function () {
                    if (item.classList.contains('is-open')) menu.querySelector('a').focus();
                });
            }
        });
        item.addEventListener('focusout', function () {
            requestAnimationFrame(function () {
                if (item.classList.contains('is-open') && !item.contains(document.activeElement)) closeDropdowns();
            });
        });
        menu.querySelectorAll('.mega-menu-item').forEach(function (link) {
            function selectPreview() {
                menu.querySelectorAll('.mega-menu-item').forEach(function (other) { other.classList.toggle('active', other === link); });
                menu.querySelectorAll('.mega-menu-preview').forEach(function (preview) {
                    const active = preview.id === 'preview-' + link.dataset.preview;
                    preview.classList.toggle('active', active);
                    preview.inert = !active;
                });
                updatePhotos();
            }
            link.addEventListener('mouseenter', selectPreview);
            link.addEventListener('focusin', selectPreview);
        });
        menu.querySelectorAll('.mega-menu-preview').forEach(function (preview) { preview.inert = !preview.classList.contains('active'); });
        menu.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', closeDropdowns); });
    });
    document.addEventListener('click', function (event) { if (!event.target.closest('#header .dropdown')) closeDropdowns(); });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const open = dropdowns.find(function (item) { return item.classList.contains('is-open'); });
            if (open) { closeDropdowns(); open.querySelector(':scope > a').focus(); }
        }
    });

    // Use the existing brand asset unchanged, including in the mobile drawer.
    const brand = document.createElement('a');
    brand.className = 'mobile-menu-brand';
    brand.href = '/index.html';
    brand.setAttribute('aria-label', 'Safety Excellence Group home');
    const brandImage = header.querySelector('.logo-icon').cloneNode(true);
    brandImage.removeAttribute('style');
    brand.appendChild(brandImage);
    mobile.prepend(brand);
    mobile.setAttribute('role', 'dialog');
    mobile.setAttribute('aria-label', 'Navigation');
    mobile.setAttribute('aria-modal', 'true');
    mobile.inert = true;
    toggle.setAttribute('aria-label', 'Open navigation');
    toggle.setAttribute('aria-controls', 'mobileMenu');
    toggle.setAttribute('aria-expanded', 'false');
    close.setAttribute('aria-label', 'Close navigation');
    mobile.querySelectorAll('.mobile-menu-submenu').forEach(function (submenu, index) {
        const row = submenu.parentElement;
        row.classList.add('has-submenu');
        submenu.id = 'mobile-submenu-' + index;
        submenu.hidden = true;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-submenu-toggle';
        button.textContent = '+';
        button.setAttribute('aria-label', 'Expand ' + row.querySelector('a').textContent.trim());
        button.setAttribute('aria-controls', submenu.id);
        button.setAttribute('aria-expanded', 'false');
        button.addEventListener('click', function () {
            const expanded = !submenu.hidden;
            submenu.hidden = expanded;
            button.textContent = expanded ? '+' : '−';
            button.setAttribute('aria-expanded', String(!expanded));
        });
        row.insertBefore(button, submenu);
    });

    window.closeMobileMenu = function (restoreFocus = true) {
        if (!mobile.classList.contains('active')) return;
        mobile.classList.remove('active');
        document.body.classList.remove('nav-drawer-open');
        mobile.inert = true;
        toggle.classList.remove('active');
        toggle.setAttribute('aria-expanded', 'false');
        overlay.classList.remove('active');
        document.body.style.overflow = previousOverflow;
        if (restoreFocus && returnFocus && returnFocus.isConnected) returnFocus.focus();
    };
    window.toggleMobileMenu = function () {
        if (mobile.classList.contains('active')) { window.closeMobileMenu(); return; }
        closeDropdowns();
        returnFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;
        mobile.inert = false;
        mobile.classList.add('active');
        document.body.classList.add('nav-drawer-open');
        toggle.classList.add('active');
        toggle.setAttribute('aria-expanded', 'true');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () { close.focus(); });
    };
    mobile.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') { event.preventDefault(); window.closeMobileMenu(); }
        if (event.key !== 'Tab') return;
        const elements = Array.from(mobile.querySelectorAll('a, button, input')).filter(function (el) { return el.getClientRects().length > 0 && !el.disabled; });
        const first = elements[0], last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    desktop.addEventListener('change', function () { window.closeMobileMenu(); closeDropdowns(); });

    // A small navigation search reuses existing destinations and their exact labels.
    const search = document.createElement('dialog');
    search.className = 'nav-search-dialog';
    search.setAttribute('aria-label', 'Search');
    search.innerHTML = '<form method="dialog"><label for="nav-search-input">Search</label><button aria-label="Close search">×</button></form><input id="nav-search-input" type="search" placeholder="Search" autocomplete="off"><div class="nav-search-results"></div><p class="nav-search-empty" hidden>No results</p>';
    document.body.appendChild(search);
    const input = search.querySelector('input');
    const results = search.querySelector('.nav-search-results');
    const destinations = [];
    const unique = new Set();
    header.querySelectorAll('.nav-links a').forEach(function (link) {
        const label = link.textContent.trim().replace(/\s+/g, ' ');
        const key = label + link.getAttribute('href');
        if (unique.has(key)) return;
        unique.add(key);
        destinations.push({ link, label });
    });
    function renderSearch() {
        const query = input.value.trim().toLowerCase();
        results.replaceChildren();
        destinations.filter(function (item) { return item.label.toLowerCase().includes(query); }).forEach(function (item) {
            const link = document.createElement('a');
            link.textContent = item.label;
            link.href = item.link.getAttribute('href');
            link.addEventListener('click', function (event) {
                event.preventDefault();
                search.close();
                if (item.link.hasAttribute('onclick')) item.link.click();
                else window.location.assign(item.link.href);
            });
            results.appendChild(link);
        });
        search.querySelector('.nav-search-empty').hidden = results.childElementCount > 0;
    }
    input.addEventListener('input', renderSearch);
    search.addEventListener('close', function () {
        if (document.activeElement === document.body || !document.activeElement.getClientRects().length) {
            (desktop.matches ? header.querySelector('.nav-search') : toggle).focus();
        }
    });
    search.addEventListener('click', function (event) {
        const bounds = search.getBoundingClientRect();
        if (event.target === search && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) search.close();
    });
    function searchButton(withLabel) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'nav-search';
        button.setAttribute('aria-label', 'Search');
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>' + (withLabel ? '<span>Search</span>' : '');
        button.addEventListener('click', function () {
            window.closeMobileMenu(false);
            closeDropdowns();
            input.value = '';
            renderSearch();
            search.showModal();
            input.focus();
        });
        return button;
    }
    header.querySelector('nav').insertBefore(searchButton(false), header.querySelector('.nav-cta'));
    mobile.insertBefore(searchButton(true), mobile.querySelector('.mobile-menu-cta'));
    header.querySelectorAll('.nav-cta a').forEach(function (link) {
        link.insertAdjacentHTML('beforeend', '<svg class="nav-arrow" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h14m-5-5 5 5-5 5"/></svg>');
    });

    let lastScrollY = Math.max(0, window.scrollY), scrollFrame = 0;
    function showHeader() {
        header.classList.remove('nav-is-hidden');
        header.inert = false;
    }
    function updateScrollDirection() {
        scrollFrame = 0;
        const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
        const delta = y - lastScrollY;
        if (y <= 32) { lastScrollY = y; showHeader(); return; }
        // Accumulate small wheel movements, ignoring touch overscroll and jitter.
        if (Math.abs(delta) < 8) return;
        lastScrollY = y;
        const keyboardFocus = header.contains(document.activeElement) && document.activeElement.matches(':focus-visible');
        if (delta > 0 && !mobile.classList.contains('active') && !keyboardFocus) {
            closeDropdowns();
            header.classList.add('nav-is-hidden');
            header.inert = true;
        } else showHeader();
    }
    window.addEventListener('scroll', function () {
        if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollDirection);
    }, { passive: true });
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Tab') showHeader();
    });
    window.addEventListener('resize', function () {
        lastScrollY = Math.max(0, window.scrollY);
        showHeader();
    });
})();
