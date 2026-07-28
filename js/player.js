(function () {
  'use strict';

  let currentIndex = 0;
  let playlist = [];
  let audio = null;
  let ui = {};
  let currentLyrics = [];

  function loadPlaylist() {
    const base = getBase();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', base + 'music/playlist.json', true);
    xhr.onload = function () {
      try {
        playlist = JSON.parse(xhr.responseText);
        if (playlist.length > 0) {
          renderPlaylist();
        }
      } catch (_) { /* fall through */ }
    };
    xhr.send();
  }

  function getBase() {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    return depth > 1 ? '../' : '';
  }

  function buildUI() {
    const bar = document.createElement('div');
    bar.id = 'player-bar';
    bar.innerHTML = `
      <div class="player-info">
        <span class="player-title" id="playerTitle">未播放</span>
        <span class="player-artist" id="playerArtist"></span>
      </div>
      <div class="player-controls">
        <button class="player-btn" id="playerPrev" title="上一首">⏮</button>
        <button class="player-btn player-play-btn" id="playerPlay" title="播放">▶</button>
        <button class="player-btn" id="playerNext" title="下一首">⏭</button>
        <div class="player-progress-wrap">
          <span class="player-time" id="playerCurrent">0:00</span>
          <div class="player-progress" id="playerProgress">
            <div class="player-progress-fill" id="playerProgressFill"></div>
            <div class="player-progress-thumb" id="playerProgressThumb"></div>
          </div>
          <span class="player-time" id="playerDuration">0:00</span>
        </div>
      </div>
      <div class="player-extras">
        <button class="player-btn" id="playerMute" title="静音">🔊</button>
        <div class="player-volume-wrap">
          <input type="range" class="player-volume" id="playerVolume" min="0" max="1" step="0.05" value="0.7">
        </div>
        <button class="player-btn" id="playerListToggle" title="歌单">📋</button>
      </div>
      <div class="player-list" id="playerList"></div>
      <div class="player-lyrics" id="playerLyrics"></div>
      <div class="player-explain" id="playerExplain"></div>
    `;
    document.body.appendChild(bar);

    ui.bar = bar;
    ui.title = bar.querySelector('#playerTitle');
    ui.artist = bar.querySelector('#playerArtist');
    ui.playBtn = bar.querySelector('#playerPlay');
    ui.prevBtn = bar.querySelector('#playerPrev');
    ui.nextBtn = bar.querySelector('#playerNext');
    ui.progress = bar.querySelector('#playerProgress');
    ui.progressFill = bar.querySelector('#playerProgressFill');
    ui.progressThumb = bar.querySelector('#playerProgressThumb');
    ui.currentTime = bar.querySelector('#playerCurrent');
    ui.duration = bar.querySelector('#playerDuration');
    ui.volume = bar.querySelector('#playerVolume');
    ui.muteBtn = bar.querySelector('#playerMute');
    ui.listToggle = bar.querySelector('#playerListToggle');
    ui.list = bar.querySelector('#playerList');
    ui.lyricsContainer = bar.querySelector('#playerLyrics');
    ui.explain = bar.querySelector('#playerExplain');
  }

  function parseLyrics(lrc) {
    if (!lrc) return [];
    const lines = lrc.split('\n');
    const result = [];
    lines.forEach(function (line) {
      const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
      if (match) {
        const time = parseInt(match[1]) * 60 + parseFloat(match[2] + '.' + match[3]);
        const text = match[4].trim();
        if (text) {
          result.push({ time: time, text: text });
        }
      }
    });
    result.sort(function (a, b) { return a.time - b.time; });
    return result;
  }

  function renderLyrics() {
    var container = ui.lyricsContainer;
    container.innerHTML = '';
    if (!currentLyrics.length) {
      container.classList.remove('open');
      return;
    }
    container.classList.add('open');
    currentLyrics.forEach(function (line, i) {
      var el = document.createElement('div');
      el.className = 'lyrics-line';
      el.dataset.index = i;
      el.textContent = line.text;
      container.appendChild(el);
    });
  }

  function updateLyrics(time) {
    if (!currentLyrics.length) return;
    var lines = ui.lyricsContainer.querySelectorAll('.lyrics-line');
    var activeIdx = -1;
    for (var i = currentLyrics.length - 1; i >= 0; i--) {
      if (time >= currentLyrics[i].time) {
        activeIdx = i;
        break;
      }
    }
    lines.forEach(function (el, idx) {
      el.classList.toggle('active', idx === activeIdx);
    });
    if (activeIdx >= 0) {
      var activeEl = lines[activeIdx];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }

  function formatTime(s) {
    if (isNaN(s) || s === Infinity) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function renderPlaylist() {
    ui.list.innerHTML = playlist.map((song, i) =>
      `<div class="player-list-item${i === currentIndex ? ' active' : ''}" data-index="${i}">
        <span class="player-list-title">${song.title}</span>
        <span class="player-list-artist">${song.artist}${song.lyrics ? '  🎤' : ''}</span>
      </div>`
    ).join('');
    ui.list.querySelectorAll('.player-list-item').forEach(el => {
      el.addEventListener('click', function () {
        const idx = parseInt(this.dataset.index);
        if (idx !== currentIndex) {
          currentIndex = idx;
          loadAndPlay();
        }
        ui.list.classList.remove('open');
      });
    });
  }

  function loadAndPlay() {
    if (!playlist[currentIndex]) return;
    const song = playlist[currentIndex];
    const base = getBase();
    if (audio) {
      audio.pause();
      audio.src = '';
    }
    audio = new Audio(base + 'music/' + encodeURIComponent(song.file));
    audio.volume = parseFloat(ui.volume.value);
    currentLyrics = parseLyrics(song.lyrics);
    renderLyrics();
    audio.addEventListener('loadedmetadata', onMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', function () {
      ui.title.textContent = '歌曲加载失败';
      ui.playBtn.textContent = '▶';
    });
    audio.play().then(() => {
      ui.playBtn.textContent = '⏸';
    }).catch(function () {
      ui.title.textContent = '歌曲加载失败';
      ui.playBtn.textContent = '▶';
    });
    ui.title.textContent = song.title;
    ui.artist.textContent = song.artist;
    renderPlaylist();
  }

  function onMetadata() {
    ui.duration.textContent = formatTime(audio.duration);
  }

  function onTimeUpdate() {
    if (!audio || !audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    ui.progressFill.style.width = pct + '%';
    ui.progressThumb.style.left = pct + '%';
    ui.currentTime.textContent = formatTime(audio.currentTime);
    updateLyrics(audio.currentTime);
  }

  function onEnded() {
    nextTrack();
  }

  function togglePlay() {
    if (!audio || !audio.src) {
      loadAndPlay();
      return;
    }
    if (audio.paused) {
      audio.play();
      ui.playBtn.textContent = '⏸';
    } else {
      audio.pause();
      ui.playBtn.textContent = '▶';
    }
  }

  function prevTrack() {
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadAndPlay();
  }

  function nextTrack() {
    currentIndex = (currentIndex + 1) % playlist.length;
    loadAndPlay();
  }

  function seekTo(e) {
    if (!audio || !audio.duration) return;
    const rect = ui.progress.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pct * audio.duration;
  }

  function init() {
    buildUI();
    ui.playBtn.addEventListener('click', togglePlay);
    ui.prevBtn.addEventListener('click', prevTrack);
    ui.nextBtn.addEventListener('click', nextTrack);
    ui.progress.addEventListener('click', seekTo);
    ui.volume.addEventListener('input', function () {
      if (audio) audio.volume = parseFloat(this.value);
    });
    ui.muteBtn.addEventListener('click', function () {
      if (!audio) return;
      audio.muted = !audio.muted;
      this.textContent = audio.muted ? '🔇' : '🔊';
    });
    ui.listToggle.addEventListener('click', function () {
      ui.list.classList.toggle('open');
    });

    ui.title.addEventListener('click', function () {
      if (currentLyrics.length) {
        ui.lyricsContainer.classList.toggle('open');
      }
    });

    loadPlaylist();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
