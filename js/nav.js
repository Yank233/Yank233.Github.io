/**
 * SPA 导航 — 拦截内部链接，只替换 <main>，保持播放器存活
 */
(function () {
  'use strict';

  var mainEl = null;

  function navigate(url) {
    url = url.replace(window.location.origin, '');
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onload = function () {
      if (xhr.status !== 200) return;
      var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
      var newMain = doc.querySelector('main');
      if (newMain) {
        mainEl.replaceWith(newMain);
        mainEl = newMain;
      }
      document.title = doc.title;
      window.scrollTo(0, 0);
      try {
        history.pushState(null, '', url);
      } catch (_) {
        window.location.href = url;
        return;
      }
      markCurrentPage();
      // 先渲染动态内容，再让动画观察它们，否则元素带 animate-ready 但无人触发入场
      if (window.__renderMurmurs) window.__renderMurmurs();
      if (window.__initAnimations) window.__initAnimations();
    };
    xhr.onerror = function () {
      window.location.href = url;
    };
    xhr.send();
  }

  // 事件委托：拦截内部链接点击
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    // file:// 页面无法安全使用 pushState，交给浏览器做普通页面跳转。
    if (window.location.protocol === 'file:' || !a || a.host !== window.location.host || a.hasAttribute('target') || a.hasAttribute('data-no-spa')) return;
    e.preventDefault();
    navigate(a.href);
  });

  window.addEventListener('popstate', function () {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', window.location.href, true);
    xhr.onload = function () {
      if (xhr.status !== 200) return;
      var doc = new DOMParser().parseFromString(xhr.responseText, 'text/html');
      var newMain = doc.querySelector('main');
      if (newMain) mainEl.replaceWith(newMain);
      document.title = doc.title;
      markCurrentPage();
      if (window.__renderMurmurs) window.__renderMurmurs();
      if (window.__initAnimations) window.__initAnimations();
    };
    xhr.send();
  });

  document.addEventListener('DOMContentLoaded', function () {
    mainEl = document.querySelector('main');
    markCurrentPage();
  });

  function markCurrentPage() {
    var current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav a').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var page = href.split('/').pop() || 'index.html';
      if (page === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
})();
