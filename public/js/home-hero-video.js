(function () {
    'use strict';
    const hero = document.getElementById('heroSection');
    const video = document.getElementById('heroBackgroundVideo');
    if (!hero || !video) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = true;
    let failed = false;
    // Keep the background silent, including on browsers with audio in the file.
    video.defaultMuted = true;
    video.muted = true;
    video.volume = 0;

    function updatePlayback() {
        if (failed || reducedMotion.matches || document.hidden || !visible) {
            video.pause();
            if (reducedMotion.matches || failed) hero.classList.remove('is-video-ready');
            return;
        }
        video.muted = true;
        video.volume = 0;
        const playback = video.play();
        if (playback) playback.catch(function () {
            // Leave the video frame and hero background in place if autoplay is unavailable.
            if (video.paused) hero.classList.remove('is-video-ready');
        });
    }
    video.addEventListener('playing', function () {
        if (!reducedMotion.matches && !failed) hero.classList.add('is-video-ready');
    });
    video.addEventListener('error', function () { failed = true; updatePlayback(); });
    new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        updatePlayback();
    }).observe(hero);
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', updatePlayback);
    updatePlayback();
})();
