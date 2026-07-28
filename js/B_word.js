const murmurs = [
  "vibe coding真几把爽啊",
  "工程代码真jb难写",
  "咕咕嘎嘎",
  "GitHub Pages 真香",
  "友链何时丰富",
  "CSS 只会vibe fuck",
  "大学的课好水",
  "GTA5真好玩",
  "好想成为人类啊",
  "关注和睦社区",
  "深色主题 yyds",
  "想成为codeforces超级大神",
  "今天摸鱼了（战术后仰）",
  "给oi✌🏻👻🌶️",
  "何时能做出更多牛逼项目",
  "吔，哼哼，啊啊啊啊"
];

function getRandomStyle() {
  const sizes = ['small', '', 'large'];
  return sizes[Math.floor(Math.random() * sizes.length)];
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderMurmurs() {
  const grid = document.getElementById('murmurGrid');
  if (!grid) return;
  
  const shuffled = shuffleArray([...murmurs]);
  const selected = shuffled.slice(0, Math.floor(Math.random() * 5) + 6);
  
  grid.innerHTML = selected.map(text => {
    const sizeClass = getRandomStyle();
    return `<span class="murmur-bubble ${sizeClass}">💬 ${text}</span>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', renderMurmurs);

window.__renderMurmurs = renderMurmurs;