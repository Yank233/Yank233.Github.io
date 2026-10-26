(function () {
  'use strict';

  if (window.__blogPlayerInitialized) return;
  window.__blogPlayerInitialized = true;

  let currentIndex = 0;
  let playlist = [];
  let audio = null;
  let ui = {};
  let currentLyrics = [];
  let lastLyricIndex = -1;
  const localPlaylist = [
    { title: 'Billie Jean?', artist: '21 Clown', file: 'Billie Jean.mp3' },
    { title: 'On My Own', artist: 'Bltz Kids', file: 'On My Own.mp3' },
    { title: 'Stay With Me', artist: '真夜中のドア', file: 'Stay With Me.mp3' },
    { title: '夜に駆ける', artist: 'YOASOBI', file: '夜に駆ける.mp3' },
    { title: 'Speed of Light', artist: '塞壬唱片', file: 'Speed of Light.mp3' },
    { title: '星に駆られて', artist: '牧野忠羲', file: '星に駆られて.mp3' }
  ];

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function loadPlaylist() {
    // 直接打开本地 HTML 时，浏览器会阻止读取 JSON；使用与 playlist.json 同步的兜底数据。
    if (window.location.protocol === 'file:') {
      playlist = localPlaylist.map(function (song) { return Object.assign({}, song); });
      enablePlaylist();
      return;
    }
    const base = getBase();
    const xhr = new XMLHttpRequest();
    xhr.open('GET', base + 'music/playlist.json?v=2', true);
    xhr.onload = function () {
      try {
        const data = JSON.parse(xhr.responseText);
        playlist = Array.isArray(data) ? data.filter(function (song) {
          return song && song.file && song.title;
        }) : [];
        if (playlist.length > 0) {
          enablePlaylist();
        } else {
          ui.explain.textContent = '歌单为空';
        }
      } catch (_) {
        ui.explain.textContent = '歌单加载失败';
        ui.explain.classList.add('player-error');
      }
    };
    xhr.onerror = function () {
      ui.explain.textContent = '歌单加载失败';
      ui.explain.classList.add('player-error');
    };
    xhr.send();
  }

  function getBase() {
    return /[\\/]posts[\\/]/i.test(window.location.pathname) ? '../' : '';
  }

  function enablePlaylist() {
    [ui.playBtn, ui.prevBtn, ui.nextBtn, ui.listToggle].forEach(function (button) {
      button.disabled = false;
    });
    renderPlaylist();
    ui.explain.textContent = '选择一首歌开始';
  }

  function buildUI() {
    // 播放时的背景光效层（由 body.playing 控制渐显渐隐）
    const glow = document.createElement('div');
    glow.className = 'player-glow';
    document.body.appendChild(glow);

    const bar = document.createElement('div');
    bar.id = 'player-bar';
    bar.innerHTML = `
      <div class="player-info">
        <span class="player-title" id="playerTitle">未播放</span>
        <span class="player-artist" id="playerArtist"></span>
      </div>
      <div class="player-controls">
        <div class="player-transport">
          <button class="player-btn" id="playerPrev" title="上一首" disabled>⏮</button>
          <button class="player-btn player-play-btn" id="playerPlay" title="播放" disabled>▶</button>
          <button class="player-btn" id="playerNext" title="下一首" disabled>⏭</button>
        </div>
        <div class="player-progress-wrap">
          <span class="player-time" id="playerCurrent">0:00</span>
          <div class="player-progress" id="playerProgress" role="slider" tabindex="0" aria-label="播放进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-disabled="true">
            <div class="player-progress-fill" id="playerProgressFill"></div>
            <div class="player-progress-thumb" id="playerProgressThumb"></div>
          </div>
          <span class="player-time" id="playerDuration">0:00</span>
        </div>
      </div>
      <div class="player-lyrics" id="playerLyrics" aria-label="歌词"></div>
      <div class="player-extras">
        <button class="player-btn" id="playerMute" title="静音">🔊</button>
        <div class="player-volume-wrap">
          <input type="range" class="player-volume" id="playerVolume" min="0" max="1" step="0.05" value="0.7">
        </div>
        <button class="player-btn" id="playerListToggle" title="歌单" disabled>📋</button>
      </div>
      <div class="player-list" id="playerList"></div>
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
    const result = [];
    const timestampPattern = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;
    lrc.split(/\r?\n/).forEach(function (line) {
      const timestamps = [];
      let match;
      while ((match = timestampPattern.exec(line)) !== null) {
        const fraction = match[3] ? parseFloat('0.' + match[3]) : 0;
        timestamps.push(parseInt(match[1], 10) * 60 + parseInt(match[2], 10) + fraction);
      }
      timestampPattern.lastIndex = 0;
      const text = line.replace(timestampPattern, '').trim();
      if (!timestamps.length || !text || text === '暂无歌词' || text === '该歌曲暂无歌词') return;
      timestamps.forEach(function (time) {
        result.push({ time: time, text: text });
      });
    });
    result.sort(function (a, b) { return a.time - b.time; });
    return result;
  }

  function renderLyrics() {
    var container = ui.lyricsContainer;
    container.innerHTML = '';
    if (!currentLyrics.length) {
      // 无歌词：占位提示，保持布局一致
      var hint = document.createElement('div');
      hint.className = 'lyrics-line lyrics-hint';
      hint.textContent = '暂无歌词';
      container.appendChild(hint);
      container.classList.add('open');
      return;
    }
    container.classList.add('open');
    // 固定渲染前、中、后三行，时间更新时只换文字（保持布局稳定）
    for (var i = 0; i < 3; i++) {
      var el = document.createElement('div');
      el.className = 'lyrics-line';
      container.appendChild(el);
    }
    updateLyrics(0);
  }

  function updateLyrics(time) {
    if (!currentLyrics.length) return;
    var lines = ui.lyricsContainer.querySelectorAll('.lyrics-line');
    var idx = -1;
    for (var i = currentLyrics.length - 1; i >= 0; i--) {
      if (time >= currentLyrics[i].time) {
        idx = i;
        break;
      }
    }
    if (idx === lastLyricIndex) return;
    lastLyricIndex = idx;
    lines.forEach(function (el, slot) {
      var j = idx - 1 + slot; // 上一行 / 当前行 / 下一行
      var line = currentLyrics[j];
      el.textContent = line ? line.text : '';
      el.classList.toggle('active', j === idx);
    });
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
        <span class="player-list-title">${escapeHtml(song.title)}</span>
        <span class="player-list-artist">${escapeHtml(song.artist || '')}</span>
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
    const el = new Audio(base + 'music/' + encodeURIComponent(song.file));
    audio = el;
    lastLyricIndex = -1;
    updateProgressValue(0);
    ui.currentTime.textContent = '0:00';
    ui.duration.textContent = '0:00';
    el.volume = parseFloat(ui.volume.value);
    currentLyrics = parseLyrics(song.lyrics);
    renderLyrics();
    loadLyrics(el, song, base);
    el.addEventListener('loadedmetadata', onMetadata);
    el.addEventListener('durationchange', onMetadata);
    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('ended', onEnded);
    el.addEventListener('play', function () {
      if (audio === el) setPlaybackState(true);
    });
    el.addEventListener('pause', function () {
      if (audio === el && !el.ended) setPlaybackState(false);
    });
    el.addEventListener('error', function () {
      if (audio !== el) return; // 旧实例的错误，忽略
      ui.title.textContent = '歌曲加载失败';
      setPlaybackState(false);
      ui.explain.textContent = '请检查 music 文件或网络路径';
      ui.explain.classList.add('player-error');
    });
    el.play().then(() => {
      if (audio !== el) return; // 已切歌，忽略
      setPlaybackState(true);
    }).catch(function () {
      if (audio !== el) return; // 旧实例的 reject，忽略
      ui.title.textContent = '点击播放按钮开始';
      setPlaybackState(false);
    });
    ui.title.textContent = song.title;
    ui.artist.textContent = song.artist;
    renderPlaylist();
  }

  // 自动加载同名 .lrc 歌词文件
  function loadLyrics(el, song, base) {
    if (!song.file) return;
    const lrcName = song.file.replace(/\.[^.]+$/, '.lrc');
    fetch(base + 'music/' + encodeURIComponent(lrcName))
      .then(function (r) { return r.ok ? r.text() : ''; })
      .then(function (text) {
        if (audio !== el) return; // 已切歌，丢弃
        if (!text) return;
        song.lyrics = text;
        currentLyrics = parseLyrics(text);
        renderLyrics();
        renderPlaylist();
      })
      .catch(function () {
        if (audio !== el) return; // 已切歌，丢弃
        currentLyrics = [];
        renderLyrics(); // 404 也显示「暂无歌词」占位
      });
  }

  function onMetadata() {
    if (audio !== this) return;
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
    ui.duration.textContent = formatTime(audio.duration);
  }

  function onTimeUpdate() {
    if (audio !== this) return;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    updateProgressValue(audio.currentTime / audio.duration);
    ui.currentTime.textContent = formatTime(audio.currentTime);
    updateLyrics(audio.currentTime);
  }

  function onEnded() {
    if (audio !== this) return;
    nextTrack();
  }

  function togglePlay() {
    if (!audio || !audio.src) {
      loadAndPlay();
      return;
    }
    if (audio.paused) {
      audio.play().then(function () {
        if (audio) setPlaybackState(true);
      }).catch(function () {
        ui.explain.textContent = '浏览器阻止了播放，请再次点击';
      });
    } else {
      audio.pause();
      setPlaybackState(false);
    }
  }

  function setPlaybackState(isPlaying) {
    ui.playBtn.textContent = isPlaying ? '⏸' : '▶';
    ui.playBtn.title = isPlaying ? '暂停' : '播放';
    document.body.classList.toggle('playing', isPlaying);
    ui.explain.classList.toggle('player-error', false);
  }

  function prevTrack() {
    if (!playlist.length) return;
    currentIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadAndPlay();
  }

  function nextTrack() {
    if (!playlist.length) return;
    currentIndex = (currentIndex + 1) % playlist.length;
    loadAndPlay();
  }

  function updateProgressValue(pct) {
    var value = Math.min(1, Math.max(0, pct || 0));
    ui.progressFill.style.width = value * 100 + '%';
    ui.progressThumb.style.left = value * 100 + '%';
    ui.progress.setAttribute('aria-valuenow', String(Math.round(value * 100)));
  }

  function initProgressDisplay() {
    ui.progress.setAttribute('aria-disabled', 'false');
    function seekFromEvent(event) {
      if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const rect = ui.progress.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      audio.currentTime = pct * audio.duration;
      updateProgressValue(pct);
    }
    ui.progress.addEventListener('pointerdown', function (event) {
      if (!audio) return;
      event.preventDefault();
      document.body.classList.add('seeking');
      ui.progress.setPointerCapture?.(event.pointerId);
      seekFromEvent(event);
    });
    ui.progress.addEventListener('pointermove', function (event) {
      if (document.body.classList.contains('seeking')) seekFromEvent(event);
    });
    ui.progress.addEventListener('pointerup', function (event) {
      document.body.classList.remove('seeking');
      ui.progress.releasePointerCapture?.(event.pointerId);
    });
    ui.progress.addEventListener('pointercancel', function () {
      document.body.classList.remove('seeking');
    });
    ui.progress.addEventListener('keydown', function (event) {
      if (!audio || !Number.isFinite(audio.duration)) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        audio.currentTime = Math.min(audio.duration, Math.max(0, audio.currentTime + (event.key === 'ArrowRight' ? 5 : -5)));
      } else if (event.key === 'Home') {
        event.preventDefault(); audio.currentTime = 0;
      } else if (event.key === 'End') {
        event.preventDefault(); audio.currentTime = audio.duration;
      }
    });
  }

  function init() {
    buildUI();
    ui.playBtn.addEventListener('click', togglePlay);
    ui.prevBtn.addEventListener('click', prevTrack);
    ui.nextBtn.addEventListener('click', nextTrack);
    initProgressDisplay();
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

    document.addEventListener('click', function (event) {
      if (!ui.list.contains(event.target) && event.target !== ui.listToggle) {
        ui.list.classList.remove('open');
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
