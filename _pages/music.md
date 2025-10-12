---
permalink: /music/
title: "Favorite tracks"
excerpt: "favorite tracks"
author_profile: true
---

{% assign base = site.baseurl | default: "" %}

<!-- APlayer 样式 -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.css">

<style>
  /* 卡片外观，贴合你站点风格 */
  .music-container{
    max-width: 980px; margin: 1.5rem auto; padding: 0 1rem;
  }
  .aplayer{
    box-shadow: 0 8px 24px rgba(0,0,0,.06);
    border: 1px solid #e5e7eb; border-radius: 1rem;
  }
  .aplayer .aplayer-list{
    max-height: 420px; /* 播放列表区域加个高度方便滚动 */
  }
</style>

<div class="music-container">
  <div id="aplayer"></div>
</div>

<!-- APlayer 脚本 -->
<script src="https://cdn.jsdelivr.net/npm/aplayer/dist/APlayer.min.js"></script>

<script>
  (function(){
    // 站点 baseurl（GitHub Pages 根站为空字符串，子路径时如 "/repo"）
    const BASE = "{{ base }}";
    // 仅编码文件名，避免空格/中文/特殊字符问题
    const u = (file) => BASE + "/assets/music/" + encodeURIComponent(file.trim());

    // 你的歌单（可继续追加）
    const audioList = [
      {
        name: "Somniomancer",
        artist: "Cryolf",
        url: u("Somniomancer.wav"),     // 支持 .wav
        cover: u("Somniomancer.jpg")    // 封面
      }
      // 继续加：
      // { name:"...", artist:"...", url: u("My Song.wav"), cover: u("My Song.jpg") }
    ];

    // 初始化播放器
    const ap = new APlayer({
      container: document.getElementById('aplayer'),
      audio: audioList,
      theme: '#111827',
      preload: 'metadata',
      autoplay: false,
      loop: 'all',        // all / one / none
      order: 'list',      // list / random
      volume: 0.85,
      mutex: true,        // 多个音频互斥
      listFolded: false,  // 默认展开播放列表
      lrcType: 0
    });

    // 失败兜底提示（比如路径错或浏览器不支持格式）
    ap.on('error', function(e){
      console.warn('Audio load error:', e);
      alert('Audio failed to load. Please check file name/path and try hard refresh (Ctrl+F5).');
    });
  })();
</script>
