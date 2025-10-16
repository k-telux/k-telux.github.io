---
permalink: /music/
title: "Favorite tracks with Hi-Res audio"
excerpt: "favorite tracks"
author_profile: true
---

{% assign base = site.baseurl | default: "" %}

<!-- 注入 baseurl 给外部 JS 使用 -->
<script>window.__BASE__ = "{{ base }}";</script>

<!-- APlayer 样式 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">

<style>
  .music-container{ max-width:980px; margin:1.5rem auto; padding:0 1rem; }
  .aplayer{ box-shadow:0 8px 24px rgba(0,0,0,.06); border:1px solid #e5e7eb; border-radius:1rem; }
  .aplayer .aplayer-list{ max-height:420px; }

  .fallback{ display:none; margin-top:1rem; }
  .fallback .card{
    border:1px solid #e5e7eb; border-radius:1rem; padding:1rem;
    box-shadow:0 8px 24px rgba(0,0,0,.06);
  }
  .fallback .row{ display:flex; gap:1rem; align-items:center; }
  .fallback img{ width:120px; height:120px; border-radius:.75rem; object-fit:cover; }
</style>

<div class="music-container">
  <div id="aplayer"></div>

  <!-- Fallback 原生播放器 -->
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

<script id="music-config" type="application/json">
{
  "tracks": [
    { "name": "Somniomancer", "artist": "Crywolf", "file": "Somniomancer.wav", "cover": "Somniomancer.jpg" },
    { "name": "Abnormal Spectrum", "artist": "Camilo Forero", "file": "Abnormal Spectrum.wav", "cover": "Abnormal Spectrum.png" },
    { "name": "Erlkonig", "artist": "Cody Matthew Johnson", "file": "Erlkonig.wav", "cover": "Erlkonig.jpg" },
    { "name": "Forever Breath", "artist": "YU", "file": "Brokenrec.wav", "cover": "Brokenrec.png" },
    { "name": "Arrived", "artist": "Masanori Akita", "file": "Arrived.wav", "cover": "Arrived.jpg" },
    { "name": "I Will Touch the Sky", "artist": "Edine", "file": "I Will Touch the Sky.wav","cover": "I Will Touch the Sky.jpg" },
    { "name": "Sanctuary Inside", "artist": "chengcheng", "file": "Sanctuary Inside.wav",  "cover": "Sanctuary Inside.png" }
  ]
}
</script>

<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
<script src="{{ base }}/assets/js/music.js"></script>
