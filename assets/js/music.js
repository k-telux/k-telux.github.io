(function () {
  // 基础路径
  var BASE = window.__BASE__ || "";
  var asset = function (file) { return BASE + "/assets/music/" + encodeURIComponent(String(file).trim()); };

  // 读 JSON 配置
  var cfgEl = document.getElementById('music-config');
  var tracks = [];
  try {
    if (cfgEl && cfgEl.textContent) {
      var data = JSON.parse(cfgEl.textContent);
      tracks = (data && data.tracks) ? data.tracks : [];
    }
  } catch (e) {
    console.error("music-config JSON parse error:", e);
  }

  // 转为 APlayer 需要的格式
  var audioList = tracks.map(function (t) {
    return {
      name: t.name || "Untitled",
      artist: t.artist || "",
      url: asset(t.file),
      cover: asset(t.cover || "cover.png")
    };
  });

  // Fallback 显示
  function showFallback() {
    var fb = document.getElementById('fallback');
    if (!fb || audioList.length === 0) return;
    fb.style.display = 'block';
    document.getElementById('fb-title').textContent  = audioList[0].name;
    document.getElementById('fb-artist').textContent = audioList[0].artist;
    document.getElementById('fb-cover').src = audioList[0].cover;
    document.getElementById('fb-src').src   = audioList[0].url;
    var a = document.getElementById('fb-audio'); a.load();
  }

  function init() {
    if (!window.APlayer) { showFallback(); return; }
    if (!document.getElementById('aplayer')) return;

    try {
      var ap = new APlayer({
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
      ap.on('error', function () { showFallback(); });
    } catch (e) {
      console.error(e);
      showFallback();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
