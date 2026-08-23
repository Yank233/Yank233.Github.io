const murmurs = [
  "身后的乡土正在崩塌，面前的路途只有迷雾",
  "去码头整点薯条",
  "那无休止跳动的心脏，今天辛苦了",
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