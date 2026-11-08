/* =========================================================
   Portfolio interactions
   Each feature is a small, self-contained block, so you can
   delete any one of them without breaking the others.
   ========================================================= */

const root = document.documentElement;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- 1. Mobile navigation ---------- */
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

function setMenu(open) {
  navMenu.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

navToggle.addEventListener('click', () => {
  setMenu(!navMenu.classList.contains('open'));
});

// Close the menu after a link is clicked, or when Escape is pressed
navMenu.querySelectorAll('.nav-link').forEach(link =>
  link.addEventListener('click', () => setMenu(false))
);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') setMenu(false);
});

/* ---------- 2. Dark / light theme toggle ---------- */
document.querySelector('.theme-toggle').addEventListener('click', () => {
  // Work out the current theme, including the OS default if nothing is saved
  const current = root.dataset.theme ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked: that's fine */ }
});

/* ---------- 3. Header shadow on scroll ---------- */
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- 4. Highlight the nav link of the section in view ---------- */
const sections = document.querySelectorAll('main section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    navLinks.forEach(link => {
      const isActive = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' }); // fires when a section crosses the middle of the screen

sections.forEach(section => sectionObserver.observe(section));

/* ---------- 5. Reveal elements as they scroll into view ---------- */
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // animate only once
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

/* ---------- 6. Typing effect in the hero ---------- */
const typedEl = document.querySelector('.typed');
const roles = ['Digital Marketer', 'Social Media Strategist'];

if (prefersReducedMotion) {
  typedEl.textContent = roles.join(' · ');
} else {
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  (function type() {
    const word = roles[roleIndex];
    charIndex += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, charIndex);

    let delay = deleting ? 50 : 100;
    if (!deleting && charIndex === word.length) {
      delay = 1800;           // pause on the full word
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 400;
    }
    setTimeout(type, delay);
  })();
}

/* ---------- 7. Pop-ups: case studies and PDF viewer ---------- */
const supportsDialog = typeof HTMLDialogElement === 'function';

// Every pop-up closes with its ✕ button, the Escape key, or a click on the dark backdrop
document.querySelectorAll('dialog.modal').forEach(modal => {
  modal.querySelectorAll('[data-close-modal]').forEach(btn =>
    btn.addEventListener('click', () => modal.close())
  );
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.close();
  });
});

// Project folders: clicking anywhere on a folder opens its case study
document.querySelectorAll('.folder[data-case]').forEach(folder => {
  const modal = document.getElementById(folder.dataset.case);
  const open = () => {
    if (!supportsDialog || !modal || modal.open) return;
    modal.showModal();
    modal.querySelector('.modal-scroll').scrollTop = 0; // always start at the top
  };
  folder.addEventListener('click', open);
});

// PDF viewer: any link with data-pdf (résumé, decks) opens here instead of a new tab
const pdfModal = document.getElementById('pdf-modal');
const pdfTitle = document.getElementById('pdf-title');
const pdfFrame = pdfModal.querySelector('.pdf-frame');
const pdfFallback = pdfModal.querySelector('.pdf-fallback');
const pdfOpenLinks = pdfModal.querySelectorAll('.pdf-open');
const pdfHeaderOpen = pdfModal.querySelector('.modal-actions .pdf-open');
const pdfDownload = pdfModal.querySelector('.pdf-download');
// Most phones report pdfViewerEnabled = false: they can't show a PDF inside a page
const canShowPdfInline = navigator.pdfViewerEnabled !== false;

document.querySelectorAll('[data-pdf]').forEach(trigger => {
  trigger.addEventListener('click', e => {
    if (!supportsDialog) return; // very old browser: just follow the link
    e.preventDefault();

    const url = trigger.getAttribute('href');
    const title = trigger.dataset.pdfTitle || 'Document';
    pdfTitle.textContent = title;
    pdfOpenLinks.forEach(link => { link.href = url; });
    pdfDownload.href = url;
    pdfDownload.setAttribute('download', trigger.dataset.pdfName || '');

    // View-only (data-pdf-view-only): hide Open/Download and the browser's PDF toolbar
    const viewOnly = 'pdfViewOnly' in trigger.dataset;
    pdfDownload.hidden = viewOnly;
    pdfHeaderOpen.hidden = viewOnly;

    if (canShowPdfInline) {
      const src = viewOnly ? `${url}#toolbar=0&navpanes=0&view=FitH` : `${url}#view=FitH`;
      if (pdfFrame.getAttribute('src') !== src) pdfFrame.src = src; // don't reload the same PDF
      pdfFrame.title = `${title} (PDF)`;
    } else {
      pdfFrame.hidden = true;
      pdfFallback.hidden = false;
    }
    pdfModal.showModal(); // can open on top of a case study; closing it returns there
  });
});

/* ---------- 8. Creatives carousels (center item pops up) ---------- */
document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const track = carousel.querySelector('.carousel-track');
  const items = [...track.querySelectorAll('.carousel-item')];
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  let activeIndex = -1;
  let onScreen = false;

  // Scroll so that an item sits in the middle of the row
  function centerItem(index, smooth = true) {
    const item = items[index];
    if (!item) return;
    const left = item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2;
    track.scrollTo({ left, behavior: smooth && !prefersReducedMotion ? 'smooth' : 'auto' });
  }

  // Only the active video plays (muted, looping, with controls); the others pause
  function syncVideos() {
    items.forEach((item, i) => {
      const video = item.querySelector('video');
      if (!video) return;
      const isActive = i === activeIndex;
      video.controls = isActive;
      if (isActive && onScreen && !prefersReducedMotion) {
        video.play().catch(() => {}); // autoplay can be blocked; controls still work
      } else {
        video.pause();
      }
    });
  }

  // Find the item closest to the middle and mark it active
  function updateActive() {
    const box = track.getBoundingClientRect();
    const middle = box.left + box.width / 2;
    let closest = 0;
    let bestDistance = Infinity;
    items.forEach((item, i) => {
      const r = item.getBoundingClientRect();
      const distance = Math.abs(r.left + r.width / 2 - middle);
      if (distance < bestDistance) { bestDistance = distance; closest = i; }
    });
    if (closest === activeIndex) return;

    activeIndex = closest;
    items.forEach((item, i) => item.classList.toggle('is-active', i === activeIndex));
    prevBtn.disabled = activeIndex === 0;
    nextBtn.disabled = activeIndex === items.length - 1;
    syncVideos();
  }

  let ticking = false;
  track.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { updateActive(); ticking = false; });
  }, { passive: true });

  prevBtn.addEventListener('click', () => centerItem(activeIndex - 1));
  nextBtn.addEventListener('click', () => centerItem(activeIndex + 1));

  // Clicking a side item brings it to the middle
  items.forEach((item, i) => item.addEventListener('click', () => {
    if (i !== activeIndex) centerItem(i);
  }));

  // Left/right arrow keys move one item at a time when the row has focus
  track.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); centerItem(activeIndex - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); centerItem(activeIndex + 1); }
  });

  // Pause videos when the carousel scrolls off screen
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    syncVideos();
  }, { threshold: 0.4 }).observe(carousel);

  // Start with the middle item popped up
  window.addEventListener('resize', () => centerItem(activeIndex, false));
  requestAnimationFrame(() => {
    centerItem(Math.floor(items.length / 2), false);
    updateActive();
  });
});

/* ---------- 9. Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();
