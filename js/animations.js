/**
 * 滚动入场动画 — IntersectionObserver + fade-in-up
 */
(function () {
  'use strict';

  function initScrollAnimations() {
    const els = document.querySelectorAll(
      '.post-card, .project-card, .link-card, .profile-card, .murmur-bubble'
    );
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach(function (el) {
      el.classList.add('animate-ready');
      observer.observe(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScrollAnimations);
  } else {
    initScrollAnimations();
  }
})();
