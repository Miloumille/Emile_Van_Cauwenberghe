const projectsDataUrl = 'data/projects.json';
const projectsGrid = document.querySelector('.projects__grid');
const categoryButtons = document.querySelectorAll('.filters__buttons--categories .filter-button');
const keywordButtons = document.querySelectorAll('.filters__buttons--keywords .filter-button');
const resetButton = document.querySelector('.filters__reset');
const modal = document.querySelector('.project-modal');
const yearElement = document.getElementById('current-year');
const modalTitle = modal?.querySelector('.project-modal__title') ?? null;
const modalCategory = modal?.querySelector('.project-modal__category') ?? null;
const modalStatus = modal?.querySelector('.project-modal__status') ?? null;
const modalDate = modal?.querySelector('.project-modal__date') ?? null;
const modalDescription = modal?.querySelector('.project-modal__description') ?? null;
const modalMedia = modal?.querySelector('.project-modal__media') ?? null;
const modalMediaImg = modalMedia?.querySelector('img') ?? null;
const modalHighlightsSection = modal?.querySelector('.project-modal__highlights') ?? null;
const modalHighlightsList = modalHighlightsSection?.querySelector('ul') ?? null;
const modalTagsSection = modal?.querySelector('.project-modal__tags') ?? null;
const modalTagsList = modalTagsSection?.querySelector('ul') ?? null;
const modalCloseButton = modal?.querySelector('.project-modal__close') ?? null;
const focusableSelectors = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

let projectCardElements = [];
let projectOpenButtons = [];
let projects = [];
let modalFocusableElements = [];
let firstModalFocusable = null;
let lastModalFocusable = null;
let lastFocusedElement = null;
let revealObserver = null;

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const slugify = (value = '') => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const removePlaceholder = () => {
    if (!projectsGrid) {
        return;
    }
    const placeholder = projectsGrid.querySelector('.projects__placeholder');
    if (placeholder) {
        placeholder.remove();
    }
};

const buildProjectCard = (project) => {
    const {
        id,
        title,
        category,
        date,
        status,
        summary,
        description,
        highlights = [],
        keywords = [],
        tags = [],
        image = {}
    } = project;

    const keywordSlugs = keywords.map((keyword) => slugify(keyword));
    const displayTags = (tags.length > 0 ? tags : keywords);
    const keywordsAttr = keywordSlugs.join(',');
    const keywordTags = displayTags
        .map((keyword) => `<li>${escapeHtml(keyword)}</li>`)
        .join('');
    const highlightsList = highlights
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join('');

    const imageSrc = escapeHtml(image.src || '');
    const imageAlt = escapeHtml(image.alt || `${title} illustration`);

    return `
<article class="project-card" id="${escapeHtml(id)}" data-category="${escapeHtml(category)}" data-keywords="${escapeHtml(keywordsAttr)}" role="button" tabindex="0" aria-label="View project: ${escapeHtml(title)}">
  <figure class="project-card__media">
    <img src="${imageSrc}" alt="${imageAlt}" loading="lazy">
  </figure>
  <header class="project-card__header">
    <h3>${escapeHtml(title)}</h3>
    <span class="project-card__category">${escapeHtml(category)}</span>
  </header>
  <p class="project-card__excerpt">${escapeHtml(summary)}</p>
  <ul class="project-card__tags">
    ${keywordTags}
  </ul>
  <footer>
    <div class="project-card__meta">
      <span class="project-card__status">${escapeHtml(status || '')}</span>
      <span class="project-card__date">${escapeHtml(date || '')}</span>
    </div>
    <button type="button" class="project-card__open" aria-label="Open project details for ${escapeHtml(title)}">View project</button>
  </footer>
  <div class="project-card__details" hidden>
    <p data-modal-description>${escapeHtml(description)}</p>
    <ul data-modal-highlights>${highlightsList}</ul>
  </div>
</article>`;
};

const renderProjects = (projectList) => {
    if (!projectsGrid) {
        return;
    }

    removePlaceholder();
    const markup = projectList.map(buildProjectCard).join('\n');
    projectsGrid.innerHTML = markup;
};

const parseKeywords = (value) => {
    if (!value) {
        return [];
    }

    return value
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);
};

const refreshProjectCollections = () => {
    projectCardElements = [...document.querySelectorAll('.project-card')];
    projectOpenButtons = [...document.querySelectorAll('.project-card__open')];
    projects = projectCardElements.map((element) => ({
        element,
        category: element.dataset.category,
        keywords: parseKeywords(element.dataset.keywords)
    }));
};

const applyRevealAnimation = () => {
    if (prefersReducedMotion) {
        projectCardElements.forEach((card) => {
            card.classList.remove('will-reveal');
            card.classList.add('is-visible');
        });
        return;
    }

    if (revealObserver) {
        revealObserver.disconnect();
    }

    revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                revealObserver?.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    projectCardElements.forEach((card) => {
        card.classList.add('will-reveal');
        revealObserver?.observe(card);
    });
};

const updateModalFocusables = () => {
    if (!modal) {
        modalFocusableElements = [];
        firstModalFocusable = null;
        lastModalFocusable = null;
        return;
    }

    modalFocusableElements = [...modal.querySelectorAll(focusableSelectors)].filter((element) => {
        return element instanceof HTMLElement && !element.hasAttribute('disabled');
    });
    firstModalFocusable = modalFocusableElements[0] ?? null;
    lastModalFocusable = modalFocusableElements[modalFocusableElements.length - 1] ?? null;
};

const populateModal = (card) => {
    if (!modal || !modalTitle || !modalCategory || !modalStatus || !modalDate || !modalDescription) {
        return;
    }

    const titleElement = card.querySelector('h3');
    modalTitle.textContent = titleElement ? titleElement.textContent : '';
    modalCategory.textContent = card.dataset.category ?? '';

    const statusElement = card.querySelector('.project-card__status');
    modalStatus.textContent = statusElement ? statusElement.textContent : '';

    const dateElement = card.querySelector('.project-card__date');
    modalDate.textContent = dateElement ? dateElement.textContent : '';

    const detailsContainer = card.querySelector('.project-card__details');
    const descriptionSource = detailsContainer?.querySelector('[data-modal-description]');
    const excerptSource = card.querySelector('.project-card__excerpt');
    modalDescription.textContent = descriptionSource?.textContent?.trim() || excerptSource?.textContent?.trim() || '';

    if (modalMedia && modalMediaImg) {
        const mediaImg = card.querySelector('.project-card__media img');
        if (mediaImg && mediaImg.getAttribute('src')) {
            modalMediaImg.src = mediaImg.src;
            modalMediaImg.alt = mediaImg.alt || '';
            modalMedia.hidden = false;
        } else {
            modalMedia.hidden = true;
            modalMediaImg.removeAttribute('src');
            modalMediaImg.alt = '';
        }
    }

    if (modalHighlightsSection && modalHighlightsList) {
        modalHighlightsList.innerHTML = '';
        const highlightsSource = detailsContainer?.querySelector('[data-modal-highlights]');
        const highlightItems = highlightsSource ? [...highlightsSource.children] : [];

        if (highlightItems.length > 0) {
            highlightItems.forEach((item) => {
                const li = document.createElement('li');
                li.textContent = item.textContent ?? '';
                modalHighlightsList.appendChild(li);
            });
            modalHighlightsSection.hidden = false;
        } else {
            modalHighlightsSection.hidden = true;
        }
    }

    if (modalTagsSection && modalTagsList) {
        modalTagsList.innerHTML = '';
        const tagElements = card.querySelectorAll('.project-card__tags li');

        if (tagElements.length > 0) {
            tagElements.forEach((tag) => {
                const li = document.createElement('li');
                li.textContent = tag.textContent ?? '';
                modalTagsList.appendChild(li);
            });
            modalTagsSection.hidden = false;
        } else {
            modalTagsSection.hidden = true;
        }
    }
};

const handleModalKeydown = (event) => {
    if (event.key === 'Tab' && modalFocusableElements.length > 0) {
        if (event.shiftKey) {
            if (!document.activeElement || document.activeElement === firstModalFocusable) {
                event.preventDefault();
                lastModalFocusable?.focus();
            }
        } else if (document.activeElement === lastModalFocusable) {
            event.preventDefault();
            firstModalFocusable?.focus();
        }
    }
};

const handleEscapeKey = (event) => {
    if (event.key === 'Escape') {
        closeModal();
    }
};

const openModal = (card) => {
    if (!modal || modal.classList.contains('is-visible')) {
        return;
    }

    populateModal(card);

    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    modal.hidden = false;
    requestAnimationFrame(() => {
        modal.classList.add('is-visible');
    });
    document.body.classList.add('no-scroll');

    updateModalFocusables();
    (firstModalFocusable ?? modalCloseButton)?.focus();

    modal?.addEventListener('keydown', handleModalKeydown);
    document.addEventListener('keydown', handleEscapeKey);
};

const closeModal = () => {
    if (!modal || modal.hidden) {
        return;
    }

    modal.classList.remove('is-visible');
    document.body.classList.remove('no-scroll');
    modal.hidden = true;

    modal.removeEventListener('keydown', handleModalKeydown);
    document.removeEventListener('keydown', handleEscapeKey);

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
};

const state = {
    category: null,
    keywords: new Set(),
};

const getMatches = (category, keywordsSet) => {
    return projects.filter((project) => {
        const categoryMatches = !category || project.category === category;
        if (!categoryMatches) {
            return false;
        }

        for (const keyword of keywordsSet) {
            if (!project.keywords.includes(keyword)) {
                return false;
            }
        }

        return true;
    });
};

const getKeywordsForCategory = (category) => {
    const keywords = new Set();

    projects.forEach((project) => {
        if (!category || project.category === category) {
            project.keywords.forEach((keyword) => keywords.add(keyword));
        }
    });

    return keywords;
};

const enforceKeywordAvailability = () => {
    if (!state.category) {
        return false;
    }

    const availableKeywords = getKeywordsForCategory(state.category);
    let removed = false;

    state.keywords.forEach((keyword) => {
        if (!availableKeywords.has(keyword)) {
            state.keywords.delete(keyword);
            removed = true;
        }
    });

    return removed;
};

const updateProjectsVisibility = () => {
    const visibleProjects = new Set(getMatches(state.category, state.keywords).map((project) => project.element));

    projects.forEach((project) => {
        const shouldShow = visibleProjects.size === 0
            ? state.category === null && state.keywords.size === 0
            : visibleProjects.has(project.element);

        project.element.hidden = !shouldShow;
    });
};

const updateCategoryButtons = () => {
    categoryButtons.forEach((button) => {
        const category = button.dataset.filter;
        const isActive = state.category === category;
        const count = getMatches(category, state.keywords).length;
        const countElement = button.querySelector('.filter-button__count');

        if (countElement) {
            countElement.textContent = String(count);
        }

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        button.disabled = count === 0 && !isActive;
    });
};

const updateKeywordButtons = () => {
    const availableKeywords = getKeywordsForCategory(state.category);

    keywordButtons.forEach((button) => {
        const keyword = button.dataset.keyword;
        const isActive = state.keywords.has(keyword);

        const nextKeywords = new Set(state.keywords);

        if (isActive) {
            nextKeywords.delete(keyword);
        } else {
            nextKeywords.add(keyword);
        }

        const count = getMatches(state.category, nextKeywords).length;
        const countElement = button.querySelector('.filter-button__count');

        if (countElement) {
            countElement.textContent = String(count);
        }

        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', String(isActive));

        const isKeywordAvailable = availableKeywords.size === 0 || availableKeywords.has(keyword);
        const canActivate = count > 0;
        button.disabled = (!isActive && (!isKeywordAvailable || !canActivate));
    });
};

const updateResetButton = () => {
    if (!resetButton) {
        return;
    }

    const hasFilters = Boolean(state.category) || state.keywords.size > 0;
    resetButton.disabled = !hasFilters;
};

const applyFilters = () => {
    updateProjectsVisibility();
    updateCategoryButtons();
    updateKeywordButtons();
    updateResetButton();
};

categoryButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const { filter } = button.dataset;
        state.category = state.category === filter ? null : filter;
        const keywordsChanged = enforceKeywordAvailability();
        if (keywordsChanged && document.activeElement) {
            document.activeElement.blur();
        }
        applyFilters();
    });
});

keywordButtons.forEach((button) => {
    button.addEventListener('click', () => {
        if (button.disabled) {
            return;
        }

        const { keyword } = button.dataset;
        if (state.keywords.has(keyword)) {
            state.keywords.delete(keyword);
        } else {
            state.keywords.add(keyword);
        }
        applyFilters();
    });
});

if (resetButton) {
    resetButton.addEventListener('click', () => {
        if (resetButton.disabled) {
            return;
        }

        state.category = null;
        state.keywords.clear();
        applyFilters();
    });
}

const attachCardListeners = () => {
    projectOpenButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const card = button.closest('.project-card');
            if (card) {
                openModal(card);
            }
        });
    });

    projectCardElements.forEach((card) => {
        card.addEventListener('click', (event) => {
            if (card.hidden) {
                return;
            }

            if (event.target instanceof HTMLElement && event.target.closest('.project-card__open')) {
                return;
            }

            openModal(card);
        });

        card.addEventListener('keydown', (event) => {
            if (card.hidden) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openModal(card);
            }
        });
    });
};

if (modal) {
    modal.addEventListener('click', (event) => {
        if (!(event.target instanceof HTMLElement)) {
            return;
        }

        const trigger = event.target.closest('[data-modal-close="true"]');
        if (trigger && modal.contains(trigger)) {
            event.preventDefault();
            closeModal();
        }
    });
}

const loadProjectData = async () => {
    try {
        const response = await fetch(projectsDataUrl, { cache: 'no-cache' });
        if (!response.ok) {
            throw new Error(`Failed to load projects: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        if (projectsGrid) {
            projectsGrid.innerHTML = '<p class="projects__placeholder">Unable to load projects at this time.</p>';
        }
        return [];
    }
};

const init = async () => {
    const data = await loadProjectData();

    if (data.length > 0) {
        renderProjects(data);
    }

    refreshProjectCollections();
    applyRevealAnimation();
    attachCardListeners();
    applyFilters();
};

init();
