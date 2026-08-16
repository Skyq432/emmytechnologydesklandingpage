(() => {
  'use strict';

  const q = (selector, scope = document) => scope.querySelector(selector);
  const qa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const yearEl = q('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const menuButton = q('.menu-button');
  const siteHeader = q('.site-header');

  menuButton?.addEventListener('click', () => {
    const open = siteHeader?.classList.toggle('is-open') || false;
    menuButton.setAttribute('aria-expanded', String(open));
  });

  qa('.desktop-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      siteHeader?.classList.remove('is-open');
      menuButton?.setAttribute('aria-expanded', 'false');
    });
  });

  const revealItems = qa('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {threshold:0.1, rootMargin:'0px 0px -24px'});

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  const colourChips = qa('.colour-chip');
  colourChips.forEach((button) => {
    button.addEventListener('click', () => {
      colourChips.forEach((chip) => chip.classList.remove('active'));
      button.classList.add('active');
    });
  });
})();
