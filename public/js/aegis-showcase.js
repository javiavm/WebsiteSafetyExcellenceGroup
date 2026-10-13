/* AEGIS particle identity: sample the supplied PNG, render points locally with WebGL. */
(function () {
    'use strict';
    const section = document.querySelector('.aegis-showcase');
    if (!section) return;
    const canvas = section.querySelector('.aegis-showcase__particles');
    const waves = section.querySelector('.aegis-showcase__waves');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = { x: -10, y: -10 };
    let gl, ctx, program, uniforms, count = 0, ready = false, visible = false;
    let width = 1, height = 1, frame = 0, scrollProgress = 0;
    let waveFrame = 0, wavePhase = 0, ambientTime = 0, lastWaveTime = 0;
    let logoPoints, sparkSprite, floorSprite;

    // Focus follows the viewport center, independently of WebGL and particle visibility.
    let themeFrame = 0;
    function updateTheme() {
        themeFrame = 0;
        const bounds = section.getBoundingClientRect();
        const center = window.innerHeight * .5;
        document.body.classList.toggle('aegis-focus-mode', bounds.top <= center && bounds.bottom > center);
        const visibleHeight = Math.max(0, Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0));
        document.body.classList.toggle('aegis-showcase-active', visibleHeight / bounds.height > .2);
    }
    function scheduleTheme() {
        if (!themeFrame) themeFrame = requestAnimationFrame(updateTheme);
    }
    window.addEventListener('scroll', scheduleTheme, { passive: true });
    window.addEventListener('resize', scheduleTheme);
    window.addEventListener('pageshow', scheduleTheme);
    document.addEventListener('visibilitychange', scheduleTheme);
    updateTheme();

    function measureProgress() {
        const viewport = window.innerHeight;
        const top = section.getBoundingClientRect().top;
        // One timeline tied to position, so upward scroll retraces every particle's path.
        scrollProgress = Math.max(0, Math.min(1, (viewport * .92 - top) / (viewport * .8)));
    }

    window.addEventListener('scroll', update, { passive: true });

    function shader(type, source) {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Particle shader unavailable');
        return s;
    }

    function init(points) {
        gl = canvas.getContext('webgl', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true });
        if (!gl) return;
        program = gl.createProgram();
        gl.attachShader(program, shader(gl.VERTEX_SHADER, `
            attribute vec3 aPoint;
            uniform vec2 uResolution, uCenter, uPointer;
            uniform float uProgress, uScale, uDpr;
            varying float vLight, vVisibility;
            void main() {
                float seed = aPoint.z;
                vec2 p = aPoint.xy;
                float travel = smoothstep(seed * .16, .82 + seed * .16, uProgress);
                vec2 scatter = vec2(fract(sin(seed * 127.1) * 43758.5453),
                    fract(sin(seed * 311.7 + 17.0) * 96321.9123));
                vec2 origin = (scatter * uResolution - uCenter) / uScale;
                p = mix(origin, p, travel);
                p.x += sin(travel * 3.14159265) * sin(seed * 91.0) * .24;
                p += vec2(sin(seed * 30.0 + uProgress * 4.0), cos(seed * 43.0 + uProgress * 4.0)) * .006;
                vec2 pixel = uCenter + p * uScale;
                float density = mix(.035, 1.0, smoothstep(.25, .95, uProgress));
                vVisibility = 1.0 - smoothstep(density, density + .025, seed);
                vec2 delta = pixel - uPointer;
                float dist = length(delta);
                pixel += delta / max(dist, 1.0) * 32.0 * exp(-dist * dist / 11000.0);
                gl_Position = vec4(pixel / uResolution * vec2(2.0, -2.0) + vec2(-1.0, 1.0), 0.0, 1.0);
                vLight = .65 + .35 * pow(.5 + .5 * sin(seed * 80.0 + uProgress * 6.0), 2.0);
                gl_PointSize = (4.0 + seed * 4.5) * uDpr;
            }
        `));
        gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
            precision mediump float;
            varying float vLight, vVisibility;
            void main() {
                float d = length(gl_PointCoord - .5) * 2.0;
                float halo = pow(max(0.0, 1.0 - d), 3.0);
                float core = 1.0 - smoothstep(.0, .3, d);
                float alpha = (halo * .6 + core * .8) * vLight * vVisibility;
                vec3 color = mix(vec3(1.0, .22, .005), vec3(1.0, .86, .48), core);
                gl_FragColor = vec4(color * alpha * 1.7, alpha);
            }
        `));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Particle renderer unavailable');
        gl.useProgram(program);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
        const attribute = gl.getAttribLocation(program, 'aPoint');
        gl.enableVertexAttribArray(attribute);
        gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
        uniforms = {};
        ['Resolution', 'Center', 'Pointer', 'Progress', 'Scale', 'Dpr'].forEach(name => {
            uniforms[name] = gl.getUniformLocation(program, 'u' + name);
        });
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
        count = points.length / 3;
        ctx = waves.getContext('2d', { desynchronized: true });
        createSprites();
        ready = true;
        resize();
        update();
    }

    function resize() {
        width = section.clientWidth;
        height = section.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        waves.width = width;
        waves.height = height;
        if (ready) {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.uniform1f(uniforms.Dpr, dpr);
            draw();
        }
    }

    function layout() {
        const mobile = width <= 900;
        return {
            cx: width * (mobile ? .5 : .72),
            cy: mobile ? (width <= 480 ? 180 : 205) : height * .44,
            size: mobile ? Math.min(width * .7, 310) : Math.min(width * .26, height * .46, 500),
            floor: mobile ? 345 : height * .825
        };
    }

    function draw() {
        if (!ready) return;
        measureProgress();
        const progress = motion.matches ? 1 : scrollProgress;
        const { cx, cy, size } = layout();
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(uniforms.Resolution, width, height);
        gl.uniform2f(uniforms.Center, cx, cy);
        gl.uniform2f(uniforms.Pointer, pointer.x, pointer.y);
        gl.uniform1f(uniforms.Progress, progress);
        gl.uniform1f(uniforms.Scale, size);
        gl.drawArrays(gl.POINTS, 0, count);
        if (motion.matches) drawWaves();
        section.classList.add('is-rendered');
    }

    function createSprites() {
        // Bake glow once. Per-particle shadowBlur forced costly full-canvas rasterization.
        sparkSprite = document.createElement('canvas');
        sparkSprite.width = sparkSprite.height = 48;
        let sprite = sparkSprite.getContext('2d');
        const glow = sprite.createRadialGradient(24, 24, 0, 24, 24, 24);
        glow.addColorStop(0, '#fff3cd');
        glow.addColorStop(.12, '#ffc15c');
        glow.addColorStop(.25, '#ff8b00a0');
        glow.addColorStop(.6, '#ff650028');
        glow.addColorStop(1, '#ff650000');
        sprite.fillStyle = glow;
        sprite.fillRect(0, 0, 48, 48);
        floorSprite = document.createElement('canvas');
        floorSprite.width = 768; floorSprite.height = 100;
        sprite = floorSprite.getContext('2d');
        sprite.translate(384, 50); sprite.scale(1, .13);
        const floorGlow = sprite.createRadialGradient(0, 0, 0, 0, 0, 384);
        floorGlow.addColorStop(0, '#fff4c4');
        floorGlow.addColorStop(.06, '#ffe6a0');
        floorGlow.addColorStop(.15, '#ff9d33');
        floorGlow.addColorStop(.32, '#ff73008c');
        floorGlow.addColorStop(.6, '#b7390020');
        floorGlow.addColorStop(1, '#ff680000');
        sprite.fillStyle = floorGlow;
        sprite.fillRect(-384, -384, 768, 768);
    }

    function drawWaves() {
        if (!ctx || !sparkSprite) return;
        const mobile = width <= 900;
        const { cx, cy, size, floor } = layout();
        const phase = motion.matches ? 0 : wavePhase + scrollProgress * .35;
        const time = motion.matches ? 0 : ambientTime;
        ctx.clearRect(0, 0, width, height);
        // Ordinary alpha compositing avoids hundreds of destination readbacks per frame.
        if (!mobile) drawFilaments();
        drawAmbientParticles();
        const glowWidth = width * .44;
        ctx.drawImage(floorSprite, cx - glowWidth / 2, floor - glowWidth * .065,
            glowWidth, glowWidth * .13);
        for (let i = 0; i < 3; i++) {
            const radius = width * (.13 + i * .06 + Math.sin(phase * 6.28) * .007);
            ctx.beginPath(); ctx.ellipse(cx, floor, radius, radius * .115, 0, 0, Math.PI * 2);
            ctx.strokeStyle = '#ff680028'; ctx.lineWidth = 5; ctx.stroke();
            ctx.strokeStyle = i === 1 ? '#ffad00bf' : '#ff6a0080';
            ctx.lineWidth = i === 1 ? 1.6 : 1; ctx.stroke();
        }
        for (let i = 0; i < 12; i++) {
            const ring = ((i / 12) + phase) % 1;
            const radius = 38 + ring * width * .78;
            ctx.beginPath();
            ctx.ellipse(cx, floor, radius, radius * .115, 0, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 105, 5,' + ((1 - ring) * .48) + ')';
            ctx.lineWidth = i % 4 === 0 ? 1.3 : .7;
            ctx.stroke();
            for (let j = 0; j < 4; j++) {
                const angle = j * 1.57 + i * 2.4 + phase * 6.28;
                spark(cx + Math.cos(angle) * radius, floor + Math.sin(angle) * radius * .115,
                    i % 4 === 0 ? 2 : .8, .8 * (1 - ring));
            }
        }
        // Each emitter repeats a staggered rise/fade cycle, without allocating new particles.
        for (let i = 0; i < (mobile ? 16 : 38); i++) {
            const seed = noise(i + 7);
            const angle = seed * Math.PI * 2;
            const radius = width * (.035 + noise(i + 19) * (mobile ? .3 : .23));
            const startX = cx + Math.cos(angle) * radius;
            const base = floor + Math.sin(angle) * radius * .115;
            const targetX = cx + (noise(i + 17) - .5) * size * .48;
            const rimRadius = size * .5;
            const targetY = cy + Math.sqrt(rimRadius * rimRadius - (targetX - cx) ** 2) - 3;
            const life = (noise(i + 90) + time / (3.5 + seed * 3)) % 1;
            const fadeIn = Math.min(1, life / .12);
            const fadeOut = 1 - Math.max(0, (life - .8) / .2);
            const alpha = fadeIn * fadeOut * (.55 + seed * .4);
            const convergence = life * life * (3 - 2 * life);
            const x = startX + (targetX - startX) * convergence;
            const y = base + (targetY - base) * life;
            const dx = (targetX - startX) * 6 * life * (1 - life);
            const dy = targetY - base;
            const length = Math.max(1, Math.hypot(dx, dy));
            ctx.strokeStyle = 'rgba(255, 118, 8,' + alpha * .4 + ')';
            ctx.lineWidth = .7;
            ctx.beginPath(); ctx.moveTo(x - dx / length * 16, y - dy / length * 16);
            ctx.lineTo(x, y); ctx.stroke();
            spark(x, y, 1.6 + seed, alpha);
        }
    }

    function noise(seed) {
        const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
        return value - Math.floor(value);
    }

    function spark(x, y, radius, alpha) {
        const opacity = ctx.globalAlpha;
        ctx.globalAlpha = opacity * alpha;
        const size = radius * 9;
        ctx.drawImage(sparkSprite, x - size / 2, y - size / 2, size, size);
        ctx.globalAlpha = opacity;
    }

    function strandPath(t, seed, progress) {
        const time = motion.matches ? 0 : ambientTime;
        const travel = (-.38 + t * 1.08) / .69;
        return {
            // Extend beyond both section edges; retain the wave's shape near the logo.
            x: width * (-.04 + t * 1.08),
            y: height * (.23 + travel * .3
                + Math.sin(travel * 7 + seed * 5 - time * 1.15) * (.035 + seed * .04))
                + Math.sin(travel * 18 + seed * 40 + progress * 4 - time * 1.7) * 11
        };
    }

    function drawAmbientParticles() {
        const progress = motion.matches ? 1 : scrollProgress;
        const time = motion.matches ? 0 : ambientTime;
        const mobile = width <= 900;
        const { cx, cy, size } = layout();
        ctx.save();
        ctx.globalAlpha = progress;
        // Free-flowing sparks have their own clock; the logo's assembly stays scroll-driven.
        if (!mobile) {
            for (let strand = 0; strand < 10; strand++) {
                const seed = noise(strand + 30);
                for (let j = 0; j < 16; j++) {
                    const t = (noise(j * 17 + strand * 211) + time * (.025 + seed * .035)) % 1;
                    const p = strandPath(t, seed, progress);
                    const scatter = Math.sin(j * 13 + strand + time * .6) * .5;
                    spark(p.x + scatter * 25, p.y + scatter * 65,
                        noise(j + strand * 71) * 1.5 + .3, .2 + t * .65);
                }
            }
        }
        for (let i = 0; i < (mobile ? 30 : 60); i++) {
            const seed = noise(i + 301);
            const angle = seed * Math.PI * 2 + time * (.12 + noise(i + 403) * .16);
            const radius = size * (.53 + noise(i + 507) * .12);
            spark(cx + Math.cos(angle) * radius,
                cy + Math.sin(angle) * radius * .92,
                .6 + noise(i + 601) * 1.6, .25 + seed * .55);
        }
        ctx.restore();
    }

    function drawFilaments() {
        const progress = motion.matches ? 1 : scrollProgress;
        ctx.save();
        ctx.globalAlpha = progress;
        for (let strand = 0; strand < 10; strand++) {
            const seed = noise(strand + 30);
            ctx.beginPath();
            for (let j = 0; j <= 48; j++) {
                const p = strandPath(j / 48, seed, progress);
                if (j === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
            }
            ctx.lineWidth = strand % 5 === 0 ? 1 : .45;
            ctx.strokeStyle = strand % 5 === 0 ? '#ff8500e0' : '#ff650080';
            ctx.stroke();
        }
        ctx.restore();
    }

    function animateWaves(time) {
        waveFrame = 0;
        if (!ready || !visible || document.hidden || motion.matches) {
            lastWaveTime = 0;
            return;
        }
        if (lastWaveTime && time - lastWaveTime < 1000 / 30 - 1) {
            waveFrame = requestAnimationFrame(animateWaves);
            return;
        }
        if (lastWaveTime) {
            const delta = Math.min((time - lastWaveTime) / 1000, .05);
            wavePhase = (wavePhase + delta * .012) % 1;
            ambientTime += delta * .35;
        }
        lastWaveTime = time;
        drawWaves();
        waveFrame = requestAnimationFrame(animateWaves);
    }

    function updateWaves() {
        if (!ready || !visible || document.hidden || motion.matches) {
            cancelAnimationFrame(waveFrame);
            waveFrame = 0;
            lastWaveTime = 0;
            if (motion.matches) drawWaves();
        } else if (!waveFrame) {
            waveFrame = requestAnimationFrame(animateWaves);
        }
    }

    function update() {
        updateWaves();
        if (frame || !ready || !visible || document.hidden) return;
        frame = requestAnimationFrame(function () {
            frame = 0;
            draw();
        });
    }

    section.addEventListener('pointermove', function (event) {
        if (motion.matches || event.pointerType === 'touch') return;
        const bounds = section.getBoundingClientRect();
        pointer.x = event.clientX - bounds.left;
        pointer.y = event.clientY - bounds.top;
        update();
    }, { passive: true });
    section.addEventListener('pointerleave', function () { pointer.x = pointer.y = -1000; update(); });
    section.querySelector('[data-aegis-open]').addEventListener('click', function (event) {
        // The widget's document listener otherwise treats this trigger as an outside click.
        event.stopPropagation();
        if (window.AEGIS && typeof window.AEGIS.open === 'function') window.AEGIS.open();
        else window.location.href = 'aegis-demo.html';
    });
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
            visible = entries[0].isIntersecting;
            update();
        }, { rootMargin: '650px 0px', threshold: [0, .05, .2] }).observe(section);
    } else visible = true;
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(section);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', update);
    motion.addEventListener('change', update);
    canvas.addEventListener('webglcontextlost', function (event) {
        event.preventDefault();
        ready = false;
        updateWaves();
        cancelAnimationFrame(frame);
        frame = 0;
        section.classList.remove('is-rendered');
    });
    canvas.addEventListener('webglcontextrestored', function () {
        try { if (logoPoints) init(logoPoints); }
        catch (error) { ready = false; section.classList.remove('is-rendered'); }
    });

    const image = new Image();
    image.onload = function () {
        try {
            const sample = document.createElement('canvas');
            sample.width = 360;
            sample.height = Math.round(360 * image.height / image.width);
            const context = sample.getContext('2d', { willReadFrequently: true });
            context.drawImage(image, 0, 0, sample.width, sample.height);
            const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
            const coords = [];
            let minX = sample.width, maxX = 0, minY = sample.height, maxY = 0;
            for (let y = 0; y < sample.height; y++) {
                for (let x = 0; x < sample.width; x++) {
                    if (pixels[(y * sample.width + x) * 4 + 3] < 110) continue;
                    coords.push([x, y]);
                    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                }
            }
            if (!coords.length) return;
            const points = [];
            const limit = window.innerWidth <= 900 ? 3500 : 11500;
            const step = Math.max(1, coords.length / limit);
            const span = Math.max(maxX - minX, maxY - minY);
            // Trace the supplied silhouette's boundaries, without redrawing the mark.
            const logoEdges = [];
            const filled = (x, y) => x >= 0 && y >= 0 && x < sample.width && y < sample.height
                && pixels[(y * sample.width + x) * 4 + 3] >= 110;
            const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
            for (const [x, y] of coords) {
                const add = (x1, y1, x2, y2) => logoEdges.push([
                    (x1 - centerX) / span, (y1 - centerY) / span,
                    (x2 - centerX) / span, (y2 - centerY) / span, noise(x * 5 + y * 31)
                ]);
                if (!filled(x, y - 1)) add(x - .5, y - .5, x + .5, y - .5);
                if (!filled(x, y + 1)) add(x - .5, y + .5, x + .5, y + .5);
                if (!filled(x - 1, y)) add(x - .5, y - .5, x - .5, y + .5);
                if (!filled(x + 1, y)) add(x + .5, y - .5, x + .5, y + .5);
            }
            for (let i = 0; i < coords.length; i += step) {
                const p = coords[Math.floor(i)];
                points.push((p[0] - (minX + maxX) / 2) / span,
                    (p[1] - (minY + maxY) / 2) / span, Math.random());
            }
            // Edge points now travel in the GPU shader instead of rebuilding blurred CPU paths.
            for (const edge of logoEdges) {
                points.push((edge[0] + edge[2]) / 2, (edge[1] + edge[3]) / 2, edge[4]);
            }
            logoPoints = points;
            init(points);
        } catch (error) {
            ready = false;
            cancelAnimationFrame(frame);
            section.classList.remove('is-rendered');
            // The original accessible logo remains visible if WebGL is unavailable.
        }
    };
    image.src = section.querySelector('.aegis-showcase__fallback img').src;
})();
