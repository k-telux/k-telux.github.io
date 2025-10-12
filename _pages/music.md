---
permalink: /music/
title: "Favorite tracks"
excerpt: "favorite tracks"
author_profile: true
---

{% assign base = site.baseurl | default: "" %}

<!-- APlayer CSS（主 CDN） -->
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
  <!-- 播放器容器（APlayer 会注入 UI） -->
  <div id="aplayer"></div>

  <!-- Fallback：当 APlayer 加载失败/被拦截时显示 -->
  <div id="fallback" class="fallback">
    <div class="card">
      <div class="row">
        <img id="fb-cover" src="{{ base }}/assets/music/Somniomancer.jpg" alt="cover">
        <div>
          <div style="font-weight:700">Somniomancer</div>
          <div style="color:#6b7280;margin-bottom:.5rem">Cryolf</div>
          <audio id="fb-audio" controls preload="metadata" style="width:100%">
            <source src="{{ base }}/assets/music/Somniomancer.wav" type="audio/wav">
          </audio>
          <div style="color:#6b7280;font-size:.85rem;margin-top:.25rem">
            Using fallback player (CDN blocked or JS failed).
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
(function(){
  // ===== 基础路径与工具 =====
  const BASE = "{{ base }}";
  const u = f => BASE + "/assets/music/" + encodeURIComponent(f.trim());

  // 你的歌单（可以继续追加）
  const audioList = [
    { name:"Somniomancer", artist:"Cryolf", url:u("Somniomancer.wav"), cover:u("Somniomancer.jpg") }
  ];

  // ===== 多 CDN 动态加载（任何一个成功就初始化） =====
  const CDNS = [
    "https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js",
    "https://unpkg.com/aplayer/dist/APlayer.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/aplayer/1.10.1/APlayer.min.js"
  ];

  function showFallback(){
    document.getElementById('fallback').style.display = 'block';
  }

  function initAPlayer(){
    if (!window.APlayer) { showFallback(); return; }
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
      // 如加载失败（路径/格式问题） -> fallback
      ap.on('error', function(){ showFallback(); });
    }catch(e){
      console.error(e);
      showFallback();
    }
  }

  function loadScriptSeq(urls, done){
    if (!urls.length) return done(new Error("All CDNs failed"));
    const src = urls[0];
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => done(null);
    s.onerror = () => {
      console.warn("CDN failed:", src);
      loadScriptSeq(urls.slice(1), done);
    };
    document.head.appendChild(s);
  }

  // 某些主题会把内容在 DOM Ready 后渲染，保险起见等 DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function(){
    loadScriptSeq(CDNS, function(err){
      if (err) {
        console.warn(err);
        showFallback();
        return;
      }
      initAPlayer();
    });
  });
})();
</script>

