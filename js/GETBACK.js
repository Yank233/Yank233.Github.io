let title = document.title;
document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? 'oi小鬼，去哪啊' : title;
});
window.addEventListener('blur', () => document.title = 'OI小鬼，去哪啊');
window.addEventListener('focus', () => document.title = title);