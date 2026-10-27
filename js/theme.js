/* Shared light/dark theme for the blog and music studio. */
(function () {
  'use strict';

  var STORAGE_KEY = 'blog-theme-v1';
  var root = document.documentElement;

  function readTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch (_) {
      return 'dark';
    }
  }

  function updateMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f5f8fc' : '#0f1518');
  }

  function applyTheme(theme, origin) {
    root.dataset.theme = theme;
    updateMeta(theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      var dark = theme === 'dark';
      button.textContent = dark ? '☀' : '☾';
      button.setAttribute('aria-label', dark ? '切换日间模式' : '切换夜间模式');
      button.title = dark ? '切换日间模式' : '切换夜间模式';
    });
    if (origin) {
      root.style.setProperty('--theme-origin-x', origin.x + 'px');
      root.style.setProperty('--theme-origin-y', origin.y + 'px');
    }
  }

  function setTheme(theme, button) {
    var next = theme === 'light' ? 'light' : 'dark';
    var bounds = button ? button.getBoundingClientRect() : null;
    var origin = bounds ? { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 } : null;
    var update = function () {
      applyTheme(next, origin);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (_) { /* private mode */ }
    };
    if (typeof document.startViewTransition === 'function') document.startViewTransition(update);
    else update();
  }

  applyTheme(readTheme());

  function bind() {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (button) {
      if (button.dataset.themeBound) return;
      button.dataset.themeBound = 'true';
      button.addEventListener('click', function () {
        setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', button);
      });
    });
    applyTheme(root.dataset.theme || readTheme());
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
  window.__setBlogTheme = setTheme;
})();
