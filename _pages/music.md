---
permalink: /music/
layout: editorial
title: Listening room
kicker: BEYOND THE LAB
lede: A few favorite tracks, in full-resolution audio.
---


<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.css" integrity="sha384-tLMkTWh2pfXNWGFlUS0w1TFtRG5xZ9lPWFOooj+vDDLIL+xBGQU/voDBY5XE2lVh" crossorigin="anonymous">
<link rel="stylesheet" href="/assets/horizon/music-player.css?v=aplayer-1">

<section class="music-player" data-asset-base="/assets/music/" aria-label="Music collection">
<img id="track-cover" src="/assets/music/Somniomancer.jpg" alt="Somniomancer cover art" width="320" height="320">
<div class="music-player__content">
<p class="eyebrow">ON THE RECORD</p>
<h2 id="track-title">Somniomancer</h2>
<p id="track-artist">Crywolf</p>
<div id="aplayer" class="aplayer-mount" hidden></div>
<div class="native-player">
<div class="field">
<label for="track-select">Choose a track</label>
<select id="track-select" disabled>
<option data-file="Somniomancer.wav" data-cover="Somniomancer.jpg" data-artist="Crywolf">Somniomancer</option>
<option data-file="Abnormal Spectrum.wav" data-cover="Abnormal Spectrum.png" data-artist="Camilo Forero">Abnormal Spectrum</option>
<option data-file="Erlkonig.wav" data-cover="Erlkonig.jpg" data-artist="Cody Matthew Johnson">Erlkonig</option>
<option data-file="Brokenrec.wav" data-cover="Brokenrec.png" data-artist="YU">Forever Breath</option>
<option data-file="Arrived.wav" data-cover="Arrived.jpg" data-artist="Masanori Akita">Arrived</option>
<option data-file="Paper Boat.wav" data-cover="Paper Boat.jpg" data-artist="Maria Landi">Paper Boat</option>
<option data-file="I Will Touch the Sky.wav" data-cover="I Will Touch the Sky.jpg" data-artist="Edine">I Will Touch the Sky</option>
<option data-file="Sanctuary Inside.wav" data-cover="Sanctuary Inside.png" data-artist="chengcheng">Sanctuary Inside</option>
</select>
</div>
<audio id="music-audio" src="/assets/music/Somniomancer.wav" controls preload="metadata" aria-label="Play Somniomancer"></audio>
<p class="form-status" id="music-status" role="status" aria-live="polite" aria-atomic="true" data-state="idle">Choose a track, then press play.</p>
</div>
<a id="download-all" class="text-link download-all" href="https://github.com/k-telux/k-telux.github.io/tree/master/assets/music">Download all 8 tracks <span class="download-meta">WAV · 526 MB</span> <span aria-hidden="true">↓</span></a>
<p class="form-status" id="download-status" role="status" aria-live="polite" aria-atomic="true" data-state="idle"></p>
<noscript><p>The first track is available above. Enable JavaScript to switch between all eight tracks.</p></noscript>
</div>
</section>

<script src="https://cdn.jsdelivr.net/npm/aplayer@1.10.1/dist/APlayer.min.js" integrity="sha384-gdGYZwHnfJM54evoZhpO0s6ZF5BQiybkiyW7VXr+h5UfruuRL/aORyw+5+HZoU6e" crossorigin="anonymous" defer></script>
<script src="/assets/js/music.js" defer></script>
<script src="/assets/horizon/music-aplayer.js?v=aplayer-1" defer></script>
<script src="/assets/horizon/music-download.js?v=zip-1" defer></script>
