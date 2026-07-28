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
      history.pushState(null, '', url);
      if (window.__initAnimations) window.__initAnimations();
      if (window.__renderMurmurs) window.__renderMurmurs();
    };
    xhr.send();
  }

  // 事件委托：拦截内部链接点击
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || a.host !== window.location.host || a.hasAttribute('target')) return;
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
      if (window.__initAnimations) window.__initAnimations();
      if (window.__renderMurmurs) window.__renderMurmurs();
    };
    xhr.send();
  });

  document.addEventListener('DOMContentLoaded', function () {
    mainEl = document.querySelector('main');
  });
})();
