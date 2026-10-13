(function () {
    'use strict';
    const section = document.getElementById('faq');
    if (!section) return;
    const items = Array.from(section.querySelectorAll('.faq-item'));
    items.forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', () => {
            const expand = !item.classList.contains('open');
            items.forEach(other => {
                const open = other === item && expand;
                other.classList.toggle('open', open);
                other.querySelector('.faq-question').setAttribute('aria-expanded', String(open));
                other.querySelector('.faq-answer').hidden = !open;
            });
        });
    });
    section.querySelector('[data-faq-aegis]').addEventListener('click', event => {
        event.stopPropagation();
        if (window.AEGIS && typeof window.AEGIS.open === 'function') window.AEGIS.open();
        else window.location.href = 'aegis-demo.html';
    });

    // Reuse the supplied silhouette. Tiny cached point layers keep this card inexpensive.
    const logo = section.querySelector('.faq-showcase__logo');
    const canvas = logo.querySelector('canvas');
    const context = canvas.getContext('2d');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const layers = [];
    let visible = false, frame = 0, previous = 0, elapsed = 0;
    canvas.width = canvas.height = 256;

    function paint() {
        context.clearRect(0, 0, 256, 256);
        layers.forEach((layer, index) => {
            context.globalAlpha = .72 + Math.sin(elapsed * .6 + index * 2.1) * .22;
            context.drawImage(layer, Math.sin(elapsed * .3 + index) * .3, 0);
        });
        context.globalAlpha = 1;
        context.fillStyle = '#ffc16e';
        context.beginPath();
        for (let i = 0; i < 24; i++) {
            const angle = i * 2.4 + elapsed * (.06 + (i % 3) * .02);
            const radius = 102 + (i % 4) * 4;
            const x = 128 + Math.cos(angle) * radius, y = 128 + Math.sin(angle) * radius;
            context.moveTo(x + 1, y); context.arc(x, y, 1, 0, Math.PI * 2);
        }
        context.fill();
    }

    function animate(time) {
        frame = 0;
        if (!visible || document.hidden || reduced.matches || !layers.length) return;
        if (!previous || time - previous >= 1000 / 24) {
            if (previous) elapsed += Math.min((time - previous) / 1000, .1);
            previous = time;
            paint();
        }
        frame = requestAnimationFrame(animate);
    }

    function update() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0; previous = 0;
        if (!layers.length) return;
        if (reduced.matches) { elapsed = 0; paint(); }
        else if (visible && !document.hidden) frame = requestAnimationFrame(animate);
    }

    const image = new Image();
    image.onload = () => {
        if (!context) return;
        const sample = document.createElement('canvas');
        sample.width = 256; sample.height = Math.round(256 * image.height / image.width);
        const sampler = sample.getContext('2d', { willReadFrequently: true });
        sampler.drawImage(image, 0, 0, sample.width, sample.height);
        const pixels = sampler.getImageData(0, 0, sample.width, sample.height).data;
        const points = [];
        let minX = 256, minY = 256, maxX = 0, maxY = 0;
        for (let y = 0; y < sample.height; y++) for (let x = 0; x < sample.width; x++) {
            if (pixels[(y * sample.width + x) * 4 + 3] < 110) continue;
            points.push([x, y]);
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        if (!points.length) return;
        const scale = 185 / Math.max(maxX - minX, maxY - minY);
        for (let i = 0; i < 3; i++) {
            const layer = document.createElement('canvas');
            layer.width = layer.height = 256;
            const drawing = layer.getContext('2d');
            drawing.fillStyle = ['#ff8b00', '#ffb33f', '#ffe0a4'][i];
            drawing.shadowColor = '#ff7900';
            drawing.shadowBlur = 3;
            drawing.beginPath();
            for (let j = i; j < points.length; j += 3) {
                const x = 128 + (points[j][0] - (minX + maxX) / 2 + Math.random() * .7 - .35) * scale;
                const y = 128 + (points[j][1] - (minY + maxY) / 2 + Math.random() * .7 - .35) * scale;
                drawing.moveTo(x + .85, y); drawing.arc(x, y, .85, 0, Math.PI * 2);
            }
            drawing.fill(); layers.push(layer);
        }
        logo.classList.add('is-rendered'); paint(); update();
    };
    image.src = logo.querySelector('img').src;
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }).observe(logo);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
})();
