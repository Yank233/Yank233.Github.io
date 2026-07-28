let title = document.title;
document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'oi小鬼去哪啊' : title;
});
window.addEventListener('blur', () => document.title = 'oi小鬼去哪啊');
window.addEventListener('focus', () => document.title = title);