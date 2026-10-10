/* ══════════════════════════════════════════════════════════
   LANGUAGE TOGGLE WITH A SLIDING INDICATOR
══════════════════════════════════════════════════════════ */
const langToggle = document.getElementById('langToggle');
const labelEn    = document.getElementById('lang-en');
const labelEs    = document.getElementById('lang-es');
const transitionDuration = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--motion-duration'));
let currentLang  = 'en';
let langTimer = null;
let langAnimations = [];

function getVisibleLangEls() {
  // All currently visible [data-lang] elements
  return [...document.querySelectorAll('[data-lang]')].filter(el => {
    return el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  });
}

function setLang(lang) {
  if (lang === currentLang) return;
  tabTransition?.skipTransition();
  tabAnimation?.cancel();
  clearTimeout(langTimer);
  langAnimations.forEach(animation => animation.cancel());
  langAnimations = [];

  // Move the indicator immediately; another click can reverse it mid-slide.
  currentLang = lang;
  labelEn.classList.toggle('active', lang === 'en');
  labelEs.classList.toggle('active', lang === 'es');
  langToggle.setAttribute('aria-label', lang === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish');
  langToggle.setAttribute('aria-pressed', String(lang === 'es'));

  const updateContent = () => {
    document.body.classList.remove('en', 'es');
    document.body.classList.add(lang);
    document.documentElement.lang = lang;
    document.querySelector('[role="tablist"]').setAttribute('aria-label', lang === 'es' ? 'Tipo de experiencia' : 'Experience type');
    modalClose.setAttribute('aria-label', lang === 'es' ? 'Cerrar certificado' : 'Close certificate');
  };

  if (document.documentElement.lang === lang) return;
  if (reducedMotion.matches) {
    updateContent();
    return;
  }
  langAnimations = getVisibleLangEls().map(el => el.animate(
    [{ opacity: 1 }, { opacity: 0 }], { duration: transitionDuration / 2, fill: 'forwards' }
  ));
  langTimer = setTimeout(() => {
    langAnimations.forEach(animation => animation.cancel());
    updateContent();
    langAnimations = reducedMotion.matches ? [] : getVisibleLangEls().map(el => el.animate(
      [{ opacity: 0 }, { opacity: 1 }], { duration: transitionDuration / 2, easing: 'ease-out' }
    ));
    langTimer = null;
  }, transitionDuration / 2);
}

langToggle.addEventListener('click', () => {
  setLang(currentLang === 'en' ? 'es' : 'en');
});

/* ══════════════════════════════════════════════════════════
   EXPERIENCE TABS WITH SHARED TEXT TRANSITIONS
══════════════════════════════════════════════════════════ */
const tabBtns  = document.querySelectorAll('.tab-btn[data-tab]');
const panels   = {
  work:     document.getElementById('panel-work'),
  academic: document.getElementById('panel-academic'),
};
const initialTab = location.hash === '#experience-academic' ? 'academic' : 'work';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Additional games: manual, looping navigation with one accessible card. */
const gameCarousel = document.querySelector('.game-carousel');
if (gameCarousel) {
  const slides = [...gameCarousel.querySelectorAll('.carousel-slide')];
  const previous = gameCarousel.querySelector('.carousel-prev');
  const next = gameCarousel.querySelector('.carousel-next');
  const status = gameCarousel.querySelector('.carousel-status');
  let gameIndex = 0;
  const showGame = (index, direction = 1) => {
    gameIndex = (index + slides.length) % slides.length;
    gameCarousel.style.setProperty('--carousel-direction', direction > 0 ? '1rem' : '-1rem');
    slides.forEach((slide, i) => {
      const active = i === gameIndex;
      if (!active && slide.contains(document.activeElement)) (direction > 0 ? next : previous).focus();
      slide.inert = !active;
      slide.setAttribute('aria-hidden', String(!active));
      slide.classList.toggle('is-active', active);
    });
    status.querySelector('.carousel-position').textContent = `${gameIndex + 1} / ${slides.length}`;
    status.querySelector('.carousel-current-title').textContent = slides[gameIndex].querySelector('.project-title').textContent;
  };
  if (slides.length > 1) {
    gameCarousel.classList.add('is-enhanced');
    previous.hidden = next.hidden = status.hidden = false;
    previous.addEventListener('click', () => showGame(gameIndex - 1, -1));
    next.addEventListener('click', () => showGame(gameIndex + 1, 1));
    gameCarousel.addEventListener('keydown', event => {
      if (event.target.closest('a') || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      if (event.key === 'ArrowLeft') showGame(gameIndex - 1, -1);
      else if (event.key === 'ArrowRight') showGame(gameIndex + 1, 1);
      else if (event.key === 'Home') showGame(0, -1);
      else showGame(slides.length - 1, 1);
    });
    showGame(0);
  }
}

/* Keep the identity in the sticky bar once the original title is above it. */
const topbar = document.querySelector('.topbar');
const heroName = document.querySelector('.hero-name');
const topbarName = document.querySelector('.topbar-name');
if (topbar && heroName && topbarName) {
  topbarName.textContent = heroName.textContent;
  let nameFrame = null;
  const updateTopbarName = () => {
    nameFrame = null;
    topbar.classList.toggle('has-name', heroName.getBoundingClientRect().bottom <= topbar.getBoundingClientRect().bottom);
  };
  const scheduleTopbarName = () => {
    if (nameFrame === null) nameFrame = requestAnimationFrame(updateTopbarName);
  };
  window.addEventListener('scroll', scheduleTopbarName, { passive: true });
  window.addEventListener('resize', scheduleTopbarName);
  window.addEventListener('pageshow', scheduleTopbarName);
  const nameResizeObserver = new ResizeObserver(scheduleTopbarName);
  nameResizeObserver.observe(heroName);
  nameResizeObserver.observe(topbar);
  updateTopbarName();
}

/* A small star marks reading progress along the bottom edge of the top bar. */
const scrollProgress = document.querySelector('.topbar .scroll-progress');
if (scrollProgress) {
  let progressFrame = null;
  const updateScrollProgress = () => {
    progressFrame = null;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
    scrollProgress.style.setProperty('--scroll-progress', progress.toFixed(4));
  };
  const scheduleScrollProgress = () => {
    if (progressFrame === null) progressFrame = requestAnimationFrame(updateScrollProgress);
  };
  window.addEventListener('scroll', scheduleScrollProgress, { passive: true });
  window.addEventListener('resize', scheduleScrollProgress);
  window.addEventListener('pageshow', scheduleScrollProgress);
  updateScrollProgress();
}

/* Offer a return to the beginning after scrolling one viewport. */
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  let backToTopFrame = null;
  const updateBackToTop = () => {
    backToTopFrame = null;
    const visible = window.scrollY >= window.innerHeight;
    if (!visible && document.activeElement === backToTop) heroName?.focus({ preventScroll: true });
    backToTop.classList.toggle('is-visible', visible);
    backToTop.disabled = !visible;
  };
  const scheduleBackToTop = () => {
    if (backToTopFrame === null) backToTopFrame = requestAnimationFrame(updateBackToTop);
  };
  window.addEventListener('scroll', scheduleBackToTop, { passive: true });
  window.addEventListener('resize', scheduleBackToTop);
  window.addEventListener('pageshow', scheduleBackToTop);
  backToTop.addEventListener('click', () => {
    heroName?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  updateBackToTop();
}

/* Two scroll-driven depths, sharing one frame with no idle animation. */
const starField = document.querySelector('.star-field');
const midStarField = document.querySelector('.star-field--mid');
if (starField) {
  let starFrame = null;
  const updateStars = () => {
    starFrame = null;
    const offset = reducedMotion.matches ? 0 : -96 * (1 - Math.exp(-Math.max(0, window.scrollY) / 1200));
    starField.style.setProperty('--stars-offset', `${offset.toFixed(2)}px`);
    if (midStarField) {
      // Limit travel on short screens so the repeated sky always covers them.
      const midTravel = Math.min(240, window.innerHeight * 0.6);
      midStarField.style.setProperty('--stars-offset', `${(offset * midTravel / 96).toFixed(2)}px`);
    }
  };
  const scheduleStars = () => {
    if (!reducedMotion.matches && starFrame === null) {
      starFrame = requestAnimationFrame(updateStars);
    }
  };
  window.addEventListener('scroll', scheduleStars, { passive: true });
  window.addEventListener('resize', scheduleStars);
  window.addEventListener('pageshow', scheduleStars);
  reducedMotion.addEventListener('change', () => {
    if (starFrame !== null) cancelAnimationFrame(starFrame);
    updateStars();
  });
  updateStars();
}

let activeTab = null;
let tabTransition = null;
let tabAnimation = null;
let tabRevision = 0;

// Match each date, title and paragraph with its counterpart in the other panel.
Object.values(panels).forEach(panel => {
  panel.querySelectorAll('.exp-entry').forEach((entry, index) => {
    ['date', 'role', 'org', 'desc', 'tags'].forEach(part => {
      entry.querySelectorAll(`.exp-${part}`).forEach(element => {
        element.style.viewTransitionName = `experience-${index}-${part}`;
      });
    });
  });
});

function selectTab(target, updateHash = true, animate = true) {
  if (target === activeTab) return;
  const shouldAnimate = animate && activeTab !== null && !reducedMotion.matches;
  const revision = ++tabRevision;
  activeTab = target;
  tabTransition?.skipTransition();
  tabTransition = null;
  tabAnimation?.cancel();
  tabAnimation = null;

  const updatePanel = () => {
    if (revision !== tabRevision) return;
    Object.entries(panels).forEach(([name, panel]) => {
      const selected = name === target;
      panel.classList.toggle('active', selected);
      panel.hidden = !selected;
    });
  };

  if (shouldAnimate && document.startViewTransition) {
    const transition = document.startViewTransition(updatePanel);
    tabTransition = transition;
    // Skipped transitions are expected when the user changes direction quickly.
    transition.ready.catch(() => {});
    transition.finished.then(() => {
      if (tabTransition === transition) tabTransition = null;
    });
  } else {
    updatePanel();
    if (shouldAnimate) {
      tabAnimation = panels[target].animate([
        { opacity: 0, transform: `translateX(${target === 'academic' ? '-24px' : '24px'})` },
        { opacity: 1, transform: 'translateX(0)' },
      ], { duration: transitionDuration, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' });
    }
  }
  tabBtns.forEach(btn => {
    const selected = btn.dataset.tab === target;
    btn.classList.toggle('active', selected);
    btn.setAttribute('aria-selected', String(selected));
    btn.tabIndex = selected ? 0 : -1;
  });
  if (updateHash) history.replaceState(null, '', target === 'academic' ? '#experience-academic' : '#experience');
}

selectTab(initialTab, false, false);
reducedMotion.addEventListener('change', () => {
  tabTransition?.skipTransition();
  tabAnimation?.cancel();
  langAnimations.forEach(animation => animation.cancel());
});
window.addEventListener('resize', () => tabTransition?.skipTransition());
tabBtns.forEach((btn, index) => {
  btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  btn.addEventListener('keydown', e => {
    let nextIndex;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabBtns.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabBtns.length) % tabBtns.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabBtns.length - 1;
    else return;
    e.preventDefault();
    selectTab(tabBtns[nextIndex].dataset.tab);
    tabBtns[nextIndex].focus();
  });
});
window.addEventListener('hashchange', () => {
  if (location.hash === '#experience' || location.hash === '#experience-academic') {
    selectTab(location.hash === '#experience-academic' ? 'academic' : 'work', false);
  }
});

/* ══════════════════════════════════════════════════════════
   CERTIFICATE MODAL
══════════════════════════════════════════════════════════ */
const backdrop   = document.getElementById('certBackdrop');
const modalTitle = document.getElementById('certModalTitle');
const modalOrg   = document.getElementById('certModalOrg');
const modalBody  = document.getElementById('certModalBody');
const modalClose = document.getElementById('certModalClose');
const modalExt   = document.getElementById('certModalExternal');
const modalExt2  = document.getElementById('certModalExternal2');

let lastFocusedElement = null;

function openModal(url, titleEn, titleEs, org) {
  lastFocusedElement = document.activeElement;
  const title = currentLang === 'es' && titleEs ? titleEs : titleEn;
  modalTitle.textContent = title || '';
  modalOrg.textContent   = org || '';
  modalExt.href  = url;
  modalExt2.href = url;

  // Detect type
  modalBody.innerHTML = '';
  const isImage = /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
  const isPDF   = /\.pdf(\?|$)/i.test(url);

  if (isImage) {
    const img = document.createElement('img');
    img.src = url;
    img.width = 820;
    img.height = 600;
    img.alt = title || 'Certificate';
    modalBody.appendChild(img);
  } else {
    // PDF or URL → iframe
    const iframe = document.createElement('iframe');
    iframe.src = isPDF ? url + '#toolbar=0&navpanes=0' : url;
    iframe.title = title || 'Certificate';
    iframe.allow = 'fullscreen';
    modalBody.appendChild(iframe);
  }

  backdrop.showModal();
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}

function closeModal() {
  if (backdrop.open) backdrop.close();
}

backdrop.addEventListener('close', () => {
  document.body.style.overflow = '';
  if (lastFocusedElement) lastFocusedElement.focus();
  modalBody.replaceChildren();
});

// Wire credential items
document.querySelectorAll('.credential-item[data-cert-modal]').forEach(item => {
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'button');

  const open = () => openModal(
    item.dataset.certModal,
    item.dataset.certTitleEn || '',
    item.dataset.certTitleEs || '',
    item.dataset.certOrg     || ''
  );

  item.addEventListener('click', open);
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });
});

// Wire external-link credentials
document.querySelectorAll('.credential-item[data-cert]').forEach(item => {
  item.setAttribute('tabindex', '0');
  item.setAttribute('role', 'link');

  const go = () => window.open(item.dataset.cert, '_blank', 'noopener');
  item.addEventListener('click', go);
  item.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });
});

// Close on button, backdrop click, Escape
modalClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
