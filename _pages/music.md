---
permalink: /music/
title: "Favorite tracks"
excerpt: "favorite tracks"
author_profile: true
---

<!-- 把 baseurl 注入到全局，供 RAW 脚本里使用 -->
<script>
  window.__BASE__ = "{{ site.baseurl | default: '' }}";
</script>

<!-- APlayer 样式（直接用 CDN） -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">

<style>
  .music-container{ max-width:980px; margin:1.5rem auto; padding:0 1rem; }
  .aplayer{ box-shadow:0 8px 24px rgba(0,0,0,.06); border:1px solid #e5e7eb; border-radius:1rem; }
  .aplayer .aplayer-list{ max-height:420px; }

  /* Fallback 原生播放器样式（当 JS 失败时显示） */
  .fallback{ display:none; margin-top:1rem; }
  .fallback .card{
    border:1px solid #e5e7eb; border-radius:1rem; padding:1rem;
    box-shadow:0 8px 24px rgba(0,0,0,.06);
  }
  .fallback .row{ display:flex; gap:1rem; align-items:center; }
  .fallback img{ width:120px; height:120px; border-radius:.75rem; object-fit:cover; }
</style>

<div class="music-container">
  <!-- APlayer 容器 -->
  <div id="aplayer"></div>

  <!-- Fallback：当 APlayer 加载失败/被拦截时显示 -->
  <div id="fallback" class="fallback">
    <div class="card">
      <div class="row">
        <img id="fb-cover" alt="cover">
        <div>
          <div id="fb-title" style="font-weight:700">Title</div>
          <div id="fb-artist" style="color:#6b7280;margin-bottom:.5rem">Artist</div>
          <audio id="fb-audio" controls preload="metadata" style="width:100%">
            <source id="fb-src" type="audio/wav">
          </audio>
          <div style="color:#6b7280;font-size:.85rem;margin-top:.25rem">
            Using fallback player (CDN blocked or JS failed).
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- APlayer 脚本（CDN） -->
<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>

{% raw %}
<script>
(function () {
  const BASE = window.__BASE__ || "";
  const u = (file) => BASE + "/assets/music/" + encodeURIComponent(String(file).trim());

  // ===== 你的歌单（可追加多首）=====
  const audioList = [
    { name: "Somniomancer", artist: "Cryolf", url: u("Somniomancer.wav"), cover: u("Somniomancer.jpg") }
    // { name:"Another", artist:"Someone", url:u("Another.wav"), cover:u("Another.jpg") }
  ];

  // Fallback 赋值
  function mountFallback(){
    document.getElementById('fallback').style.display = 'block';
    document.getElementById('fb-title').textContent  = audioList[0]?.name  || 'Title';
    document.getElementById('fb-artist').textContent = audioList[0]?.artist|| 'Artist';
    document.getElementById('fb-cover').src = audioList[0]?.cover || (BASE + "/assets/music/cover.png");
    document.getElementById('fb-src').src   = audioList[0]?.url;
    const a = document.getElementById('fb-audio');
    a.load();
  }

  function init(){
    if (!window.APlayer) { mountFallback(); return; }
    try{
      const ap = new APlayer({
        container: document.getElementById('aplayer'),
        audio: audioList,
        theme: '#111827',
        preload: 'metadata',
        autoplay: false,
        loop: 'all',
        order: 'list',
        volume: 0.85,
        mutex: true,
        listFolded: false,
        lrcType: 0
      });
      ap.on('error', function(){ mountFallback(); });
    }catch(e){
      console.error(e);
      mountFallback();
    }
  }

  // 等 DOM 就绪再启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
</script>
{% endraw %}
