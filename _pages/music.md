---
permalink: /music/
title: "Favorite tracks"
excerpt: "favorite tracks"
author_profile: true
---

{% assign base = site.baseurl | default: "" %}

<style>
  /* Container */
  .music-wrap{
    max-width: 980px; margin: 1.5rem auto; padding: 0 1rem;
    display:grid; grid-template-columns: 320px 1fr; gap: 1.25rem;
  }
  @media (max-width: 900px){ .music-wrap{ grid-template-columns: 1fr; } }

  /* Playlist panel */
  .playlist{
    background: #fff; border:1px solid #e5e7eb; border-radius: 1rem;
    overflow: hidden; display:flex; flex-direction: column;
    box-shadow: 0 8px 24px rgba(0,0,0,.04);
  }
  .playlist h3{ margin:0; padding:.9rem 1rem; border-bottom:1px solid #eef2f7; font-size:1.05rem }
  .playlist ul{ list-style:none; margin:0; padding:0; max-height: 520px; overflow:auto }
  .playlist li{
    display:flex; gap:.75rem; align-items:center; padding:.6rem .8rem; cursor:pointer;
    transition: background .15s ease;
  }
  .playlist li:hover{ background:#f9fafb }
  .playlist li.active{ background:#eef6ff }
  .mini-cover{ width:44px; height:44px; border-radius:.5rem; object-fit:cover; flex:0 0 auto }
  .meta{ display:flex; flex-direction:column; line-height:1.2 }
  .title{ font-weight:600; font-size:.95rem }
  .artist{ color:#6b7280; font-size:.85rem }

  /* Player card */
  .player{
    background:#fff; border:1px solid #e5e7eb; border-radius:1rem; padding:1rem;
    box-shadow: 0 8px 24px rgba(0,0,0,.04);
  }
  .hero{ display:flex; gap:1rem; align-items:center; }
  .cover{
    width:180px; height:180px; border-radius:1rem; object-fit:cover; box-shadow:0 10px 24px rgba(0,0,0,.08);
  }
  .now{ display:flex; flex-direction:column; gap:.25rem }
  .now .t{ font-size:1.25rem; font-weight:700 }
  .now .a{ color:#6b7280 }

  .controls{ display:flex; align-items:center; gap:.6rem; margin-top:1rem; flex-wrap:wrap }
  .btn{
    border:none; background:#111827; color:#fff; padding:.55rem .8rem; border-radius:.65rem; cursor:pointer;
  }
  .btn.alt{ background:#374151 }
  .btn.ghost{ background:#f3f4f6; color:#111827 }
  .btn:disabled{ opacity:.6; cursor:not-allowed }

  .progress{ display:flex; align-items:center; gap:.5rem; margin-top:.75rem }
  .time{ font-variant-numeric: tabular-nums; font-size:.85rem; color:#6b7280 }
  input[type="range"]{ width:100%; accent-color:#111827; }

  .row{ display:flex; gap:1rem; align-items:center; margin-top:.5rem; flex-wrap:wrap }
  .chip{ font-size:.85rem; background:#f3f4f6; padding:.3rem .55rem; border-radius:.5rem; cursor:pointer; }
  .chip.active{ background:#111827; color:#fff }

  .hint{ color:#6b7280; font-size:.85rem; margin-top:.5rem }
</style>

<div class="music-wrap">
  <!-- Playlist -->
  <div class="playlist">
    <h3>Playlist</h3>
    <ul id="playlist"></ul>
  </div>

  <!-- Player -->
  <div class="player">
    <div class="hero">
      <img id="cover" class="cover" src="{{ base }}/assets/music/cover.png" alt="cover">
      <div class="now">
        <div id="nowTitle" class="t">Title</div>
        <div id="nowArtist" class="a">Artist</div>
      </div>
    </div>

    <div class="controls">
      <button id="prev" class="btn alt" aria-label="Previous">⏮</button>
      <button id="play" class="btn" aria-label="Play/Pause">▶️</button>
      <button id="next" class="btn alt" aria-label="Next">⏭</button>

      <div class="row">
        <span class="chip" id="loopChip" title="Loop">Loop</span>
        <span class="chip" id="shuffleChip" title="Shuffle">Shuffle</span>
        <span class="chip" id="muteChip" title="Mute">Mute</span>
      </div>
    </div>

    <div class="progress">
      <span id="cur" class="time">0:00</span>
      <input id="seek" type="range" min="0" max="100" value="0" step="1" aria-label="Seek">
      <span id="dur" class="time">0:00</span>
    </div>

    <div class="row">
      <label class="time" for="vol">Volume</label>
      <input id="vol" type="range" min="0" max="1" step="0.01" value="0.9" style="width:180px">
    </div>

    <audio id="audio" preload="metadata"></audio>
  </div>
</div>

<script>
  // ======== 配置：支持多格式优先级（WAV 优先，回退 MP3/OGG/M4A/FLAC） ========
  // 方式1（推荐）：为每首提供 sources 数组（浏览器会选第一个可播放的）
  // 方式2：仍可用原来的单一 src（会按扩展名猜 MIME）

  const base = "{{ base }}";
  const tracks = [
    {
      title: "Somniomancer [null set]",
      artist: "Cryolf",
      // 只有一个 src 也支持（会根据扩展名猜测 MIME）
      src: base + "/assets/music/Somniomancer.wav",
      cover: base + "/assets/music/Somniomancer.jpg"
    }
  ];

  // ======== 元素 ========
  const listEl = document.getElementById('playlist');
  const audio = document.getElementById('audio');
  const cover = document.getElementById('cover');
  const nowTitle = document.getElementById('nowTitle');
  const nowArtist = document.getElementById('nowArtist');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const seek = document.getElementById('seek');
  const curT = document.getElementById('cur');
  const durT = document.getElementById('dur');
  const vol = document.getElementById('vol');
  const loopChip = document.getElementById('loopChip');
  const shuffleChip = document.getElementById('shuffleChip');
  const muteChip = document.getElementById('muteChip');

  let index = 0;
  let isLoop = false;
  let isShuffle = false;

  // ======== 工具：扩展名 -> MIME 猜测 ========
  const mimeByExt = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    aac: "audio/aac",
    flac: "audio/flac" // 注意：浏览器普遍不原生支持 FLAC
  };
  function guessMime(url){
    const m = url.toLowerCase().match(/\.([a-z0-9]+)(?:\?|#|$)/);
    return m ? (mimeByExt[m[1]] || "") : "";
  }

  // 把 track 统一转为 sources 数组
  function toSources(track){
    if (Array.isArray(track.sources) && track.sources.length) return track.sources;
    if (track.src) return [{ src: track.src, type: guessMime(track.src) }];
    return [];
  }

  // 选择第一个可播放的 source
  function pickPlayable(track){
    const sources = toSources(track);
    for (const s of sources){
      // 若有 type，用 canPlayType 判断；没有 type 时尝试直接返回（有些浏览器仍可播）
      if (s.type) {
        const support = audio.canPlayType(s.type);
        if (support === "probably" || support === "maybe") return s;
      } else {
        return s;
      }
    }
    // 都不支持则返回第一个作为兜底
    return sources[0] || null;
  }

  // ======== 渲染歌单 ========
  function renderList(){
    listEl.innerHTML = "";
    tracks.forEach((t, i)=>{
      const li = document.createElement('li');
      li.dataset.index = i;
      li.innerHTML = `
        <img class="mini-cover" src="${t.cover}" alt="">
        <div class="meta">
          <span class="title">${t.title}</span>
          <span class="artist">${t.artist}</span>
        </div>`;
      li.addEventListener('click', ()=> loadAndPlay(i));
      listEl.appendChild(li);
    });
    activate(index);
  }

  function activate(i){
    [...listEl.children].forEach(li=> li.classList.remove('active'));
    const active = listEl.children[i];
    if (active) active.classList.add('active');
  }

  // ======== 加载并播放 ========
  function load(i){
    const t = tracks[i];
    if (!t) return;
    index = i;

    const selected = pickPlayable(t);
    if (!selected){
      // 没有可播放来源，清空
      audio.removeAttribute('src');
    } else {
      audio.src = selected.src;
    }

    cover.src = t.cover;
    nowTitle.textContent = t.title;
    nowArtist.textContent = t.artist;
    activate(index);
  }
  function loadAndPlay(i){
    load(i);
    // 尝试播放（自动播放可能被策略阻止）
    audio.play().catch(()=>{});
    syncPlayButton();
  }

  // ======== 控件 ========
  function syncPlayButton(){
    playBtn.textContent = audio.paused ? "▶️" : "⏸";
  }
  playBtn.addEventListener('click', ()=>{
    if (audio.paused) audio.play(); else audio.pause();
    syncPlayButton();
  });
  prevBtn.addEventListener('click', ()=> {
    if (isShuffle) return nextRandom();
    const i = (index - 1 + tracks.length) % tracks.length;
    loadAndPlay(i);
  });
  nextBtn.addEventListener('click', ()=> {
    if (isShuffle) return nextRandom();
    const i = (index + 1) % tracks.length;
    loadAndPlay(i);
  });

  // 进度 & 时长
  function fmt(sec){
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec/60); const s = Math.floor(sec%60);
    return m + ":" + (s<10 ? "0"+s : s);
  }
  audio.addEventListener('loadedmetadata', ()=>{
    durT.textContent = fmt(audio.duration);
  });
  audio.addEventListener('timeupdate', ()=>{
    curT.textContent = fmt(audio.currentTime);
    if (audio.duration) seek.value = Math.floor(audio.currentTime / audio.duration * 100);
  });
  seek.addEventListener('input', ()=>{
    if (audio.duration) audio.currentTime = seek.value/100 * audio.duration;
  });

  // 音量 & 静音
  vol.addEventListener('input', ()=> { audio.volume = parseFloat(vol.value); });
  muteChip.addEventListener('click', ()=>{
    audio.muted = !audio.muted;
    muteChip.classList.toggle('active', audio.muted);
    muteChip.textContent = audio.muted ? "Muted" : "Mute";
  });

  // 循环 & 随机
  loopChip.addEventListener('click',()=>{
    isLoop = !isLoop;
    loopChip.classList.toggle('active', isLoop);
  });
  shuffleChip.addEventListener('click',()=>{
    isShuffle = !isShuffle;
    shuffleChip.classList.toggle('active', isShuffle);
  });

  function nextRandom(){
    if (tracks.length <= 1) return;
    let j = index;
    while (j === index) j = Math.floor(Math.random()*tracks.length);
    loadAndPlay(j);
  }

  // 自动下一首
  audio.addEventListener('ended', ()=>{
    if (isLoop) { loadAndPlay(index); return; }
    if (isShuffle) { nextRandom(); return; }
    const i = (index + 1) % tracks.length;
    loadAndPlay(i);
  });

  // 初始化
  renderList();
  load(0);
</script>
