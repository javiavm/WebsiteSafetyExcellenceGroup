(function () {
    'use strict';
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const showcase = document.getElementById('aegis-ai');
    const layers = Array.from(document.querySelectorAll('body > section:not(#aegis-ai):not(#trust-section), body > footer, #trust-section > .trust-partners, #trust-section > .trust-credentials')).map(section => {
        const canvas = document.createElement('canvas');
        canvas.className = 'page-particles';
        canvas.setAttribute('aria-hidden', 'true');
        section.prepend(canvas);
        return { section, canvas, context: null, visible: false, points: [] };
    });
    let frame = 0, previous = 0, elapsed = 0;
    const noise = seed => { const n = Math.sin(seed * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };

    function measure(layer) {
        const width = layer.section.clientWidth, height = layer.section.clientHeight;
        if (layer.canvas.width === width && layer.canvas.height === height && layer.context) return;
        layer.canvas.width = width; layer.canvas.height = height;
        layer.context = layer.canvas.getContext('2d', { desynchronized: true });
        const count = Math.min(180, Math.max(24, Math.round(width * height / 14000)));
        layer.points = Array.from({ length: count }, (_, i) => ({
            x: noise(i * 7 + 1) * width, y: noise(i * 13 + 9) * height,
            seed: noise(i + 71), radius: .7 + noise(i + 103) * .8
        }));
    }

    function paint(layer) {
        measure(layer);
        const ctx = layer.context;
        if (!ctx) return;
        const { width, height } = layer.canvas;
        ctx.clearRect(0, 0, width, height);
        const time = motion.matches ? 0 : elapsed;
        const approach = Math.max(0, Math.min(1, (innerHeight * 1.65 - showcase.getBoundingClientRect().top) / (innerHeight * 1.53)));
        const beforeShowcase = layer.section === showcase.previousElementSibling;
        // Sparse background points hand off to the logo as it assembles.
        const opacity = beforeShowcase ? 1 - approach : 1;
        ctx.fillStyle = document.body.classList.contains('aegis-focus-mode') ? '#ff9c0059' : '#d9820038';
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        layer.points.forEach(point => {
            const x = point.x + Math.sin(time * .12 + point.seed * 20) * 8;
            const y = point.y + Math.cos(time * .1 + point.seed * 30) * 10
                + (beforeShowcase ? approach * (height - point.y) * .35 : 0);
            ctx.moveTo(x + point.radius, y);
            ctx.arc(x, y, point.radius, 0, Math.PI * 2);
        });
        ctx.fill(); ctx.globalAlpha = 1;
    }

    function animate(time) {
        frame = 0;
        if (document.hidden || motion.matches || !layers.some(layer => layer.visible)) return;
        if (!previous || time - previous >= 1000 / 24) {
            if (previous) elapsed += Math.min((time - previous) / 1000, .1);
            previous = time;
            layers.forEach(layer => { if (layer.visible) paint(layer); });
        }
        frame = requestAnimationFrame(animate);
    }
    function update() {
        if (frame) cancelAnimationFrame(frame);
        frame = 0; previous = 0;
        layers.forEach(layer => { if (layer.visible) paint(layer); });
        if (!document.hidden && !motion.matches && layers.some(layer => layer.visible)) frame = requestAnimationFrame(animate);
    }
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => { layers.find(layer => layer.section === entry.target).visible = entry.isIntersecting; });
        update();
    });
    layers.forEach(layer => observer.observe(layer.section));
    window.addEventListener('resize', update);
    window.addEventListener('scroll', () => { if (motion.matches) update(); }, { passive: true });
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
})();
