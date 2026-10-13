(function () {
    'use strict';
    const section = document.getElementById('testimonials');
    if (!section) return;
    const grid = section.querySelector('.testimonials-grid');
    const cards = Array.from(grid.querySelectorAll('.testimonial-card'));
    const dots = Array.from(section.querySelectorAll('[data-testimonial-index]'));
    const status = section.querySelector('.testimonial-carousel__status');
    const mobile = matchMedia('(max-width: 760px)');
    const tablet = matchMedia('(max-width: 1100px)');
    let index = 0;

    function render(announce) {
        const visible = mobile.matches ? 1 : tablet.matches ? 2 : 3;
        cards.forEach((card, position) => {
            const order = (position - index + cards.length) % cards.length;
            card.style.order = order;
            card.hidden = order >= visible;
        });
        dots.forEach((dot, position) => dot.setAttribute('aria-current', String(position === index)));
        if (announce) status.textContent = cards[index].querySelector('.testimonial-info strong').textContent;
    }

    section.querySelectorAll('[data-testimonial-direction]').forEach(button => {
        button.addEventListener('click', () => {
            index = (index + Number(button.dataset.testimonialDirection) + cards.length) % cards.length;
            render(true);
        });
    });
    dots.forEach((button, position) => button.addEventListener('click', () => {
        index = position;
        render(true);
    }));
    section.querySelector('.testimonial-carousel').addEventListener('keydown', event => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        index = (index + (event.key === 'ArrowRight' ? 1 : -1) + cards.length) % cards.length;
        render(true);
    });
    mobile.addEventListener('change', () => render(false));
    tablet.addEventListener('change', () => render(false));
    section.classList.add('is-carousel-ready');
    render(false);
})();
