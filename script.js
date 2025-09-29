const filterButtons = document.querySelectorAll('.filter-button');
const projectCards = document.querySelectorAll('.project-card');
const yearElement = document.getElementById('current-year');

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    projectCards.forEach((card) => {
        card.classList.add('will-reveal');
        observer.observe(card);
    });
}

const handleFilterClick = (filter) => {
    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === filter;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
    });

    // Toggle visibility based on the selected category.
    projectCards.forEach((card) => {
        const matches = filter === 'all' || card.dataset.category === filter;
        card.hidden = !matches;
    });
};

filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const { filter } = button.dataset;
        handleFilterClick(filter);
    });
});

// Provide keyboard navigation parity for the filter buttons group.
const filtersGroup = document.querySelector('.filters__buttons');
if (filtersGroup) {
    filtersGroup.addEventListener('keydown', (event) => {
        const enabledKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
        if (!enabledKeys.includes(event.key)) {
            return;
        }

        const activeIndex = [...filterButtons].findIndex((btn) => btn.classList.contains('is-active'));
        const delta = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        const nextIndex = (activeIndex + delta + filterButtons.length) % filterButtons.length;
        filterButtons[nextIndex].focus();
        filterButtons[nextIndex].click();
        event.preventDefault();
    });
}
