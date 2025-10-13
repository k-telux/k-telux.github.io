(function () {
    // ------- 基础工具 -------
    var BASE = window.__BASE__ || "";
    var asset = function (file) {
      return BASE + "/assets/music/" + encodeURIComponent(String(file || "").trim());
    };
  
    // ------- 读取配置 -------
    var tracks = (window.__MUSIC__ && Array.isArray(window.__MUSIC__.tracks))
      ? window.__MUSIC__.tracks
      : [];
  
    if (!tracks.length) {
      console.warn("[music] No tracks found in window.__MUSIC__. Add some in music.md.");
    }
  
    // 转为 APlayer 需要的格式
    var audioList = tracks.map(function (t, i) {
      if (!t.file) console.warn("[music] Track", i, "has no 'file' field.");
      return {
        name:   t.name   || "Untitled",
        artist: t.artist || "",
        url:    asset(t.file),
        cover:  asset(t.cover || "cover.png")
      };
    });
  
    // ------- 初始化 APlayer -------
    function init() {
      if (!document.getElementById("aplayer")) return;
      if (!window.APlayer) {
        console.error("[music] APlayer not loaded.");
        return;
      }
  
      try {
        var ap = new APlayer({
          container: document.getElementById("aplayer"),
          audio: audioList,
          theme: "#111827",
          preload: "metadata",
          autoplay: false,
          loop: "all",        // 'all' | 'one' | 'none'
          order: "list",      // 'list' | 'random'
          volume: 0.85,
          mutex: true,
          listFolded: false,  // 默认展开列表（当曲目≥2 时显示）
          listMaxHeight: 360, // 与 CSS 保持一致
          lrcType: 0
        });
  
        // 可选：监听错误，方便排查文件路径问题
        ap.on("error", function (e) {
          console.warn("[music] APlayer error:", e);
        });
      } catch (e) {
        console.error("[music] init error:", e);
      }
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  })();
  