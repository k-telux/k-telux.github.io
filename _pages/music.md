---
permalink: /music/
title: "Favorite tracks"
excerpt: "favorite tracks"
author_profile: true
---

{% assign base = site.baseurl | default: "" %}

<!-- 把 baseurl 注入到全局，供外部 JS 使用 -->
<script>window.__BASE__ = "{{ base }}";</script>

<!-- APlayer 样式 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">

<style>
  .music-container{ max-width:980px; margin:1.5rem auto; padding:0 1rem; }
  .aplayer{
    box-shadow:0 8px 24px rgba(0,0,0,.06);
    border:1px solid #e5e7eb; border-radius:1rem;
  }
  /* 播放列表高度（当曲目≥2 时自动显示） */
  .aplayer .aplayer-list{ max-height:360px; }
</style>

<div class="music-container">
  <div id="aplayer"></div>
</div>

<!-- 👇 在这里维护你的歌单；复制一段对象即可新增一首（文件放 assets/music/） -->
{% raw %}
<script>
  window.__MUSIC__ = {
    tracks: [
      // 现有示例（已存在于你的仓库）
      { name: "Somniomancer", artist: "Cryolf", file: "Somniomancer.wav", cover: "Somniomancer.jpg" },

      // 新增一首（示例）：把下面一行取消注释并替换文件名即可
      // { name: "Another Track", artist: "Artist Name", file: "Another.wav", cover: "Another.jpg" },

      // 也支持 MP3/OGG 等格式（浏览器支持即可）
      // { name: "MP3 Example", artist: "Someone", file: "example.mp3", cover: "example.jpg" }
    ]
  };
</script>
{% endraw %}

<!-- APlayer 核心脚本 & 你的初始化逻辑 -->
<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>
<script src="{{ base }}/assets/js/music.js"></script>

