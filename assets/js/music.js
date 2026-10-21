(function () {
  "use strict";
  var player = document.querySelector(".music-player");
  if (!player) return;
  var select = document.getElementById("track-select");
  var audio = document.getElementById("music-audio");
  var status = document.getElementById("music-status");
  var title = document.getElementById("track-title");
  var artist = document.getElementById("track-artist");
  var cover = document.getElementById("track-cover");
  var fileLink = document.getElementById("track-file");

  function showStatus(state, text) {
    status.dataset.state = state;
    status.textContent = text;
  }

  select.disabled = false;
  select.addEventListener("change", function () {
    var track = select.options[select.selectedIndex];
    var wasPlaying = !audio.paused && !audio.ended;
    audio.pause();
    title.textContent = track.textContent;
    artist.textContent = track.dataset.artist;
    cover.src = player.dataset.assetBase + encodeURIComponent(track.dataset.cover);
    cover.alt = track.textContent + " cover art";
    audio.src = player.dataset.assetBase + encodeURIComponent(track.dataset.file);
    audio.setAttribute("aria-label", "Play " + track.textContent);
    if (fileLink) fileLink.href = audio.src;
    showStatus("loading", "Loading " + track.textContent + "…");
    audio.load();
    if (wasPlaying) {
      audio.play().catch(function () {
        if (!audio.error) showStatus("idle", "Press play to start " + title.textContent + ".");
      });
    }
  });

  audio.addEventListener("loadstart", function () {
    showStatus("loading", "Loading " + title.textContent + "…");
  });
  audio.addEventListener("loadedmetadata", function () {
    if (audio.paused) showStatus("idle", "Ready to play " + title.textContent + ".");
  });
  audio.addEventListener("waiting", function () {
    showStatus("loading", "Buffering " + title.textContent + "…");
  });
  audio.addEventListener("stalled", function () {
    showStatus("loading", "Loading is taking longer than usual. You can try another track or open the audio file.");
  });
  audio.addEventListener("playing", function () {
    showStatus("playing", "Playing " + title.textContent + ".");
  });
  audio.addEventListener("pause", function () {
    if (!audio.ended && !audio.error) showStatus("idle", "Paused. Press play to continue.");
  });
  audio.addEventListener("ended", function () {
    showStatus("idle", "Track finished. Choose another track or press play to listen again.");
  });
  audio.addEventListener("error", function () {
    showStatus("error", "This track could not be played. Try another track or open the audio file directly.");
  });
})();
