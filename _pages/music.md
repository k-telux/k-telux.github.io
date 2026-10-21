---
permalink: /music/
layout: editorial
title: Listening room
kicker: BEYOND THE LAB
lede: A few favorite tracks, in full-resolution audio.
---


<section class="music-player" data-asset-base="/assets/music/" aria-label="Music collection">
<img id="track-cover" src="/assets/music/Somniomancer.jpg" alt="Somniomancer cover art" width="320" height="320">
<div class="music-player__content">
<p class="eyebrow">ON THE RECORD</p>
<h2 id="track-title">Somniomancer</h2>
<p id="track-artist">Crywolf</p>
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
<p class="form-note">These full-resolution WAV files may take a moment to load.</p>
<a id="track-file" class="text-link" href="/assets/music/Somniomancer.wav">Open audio file <span aria-hidden="true">↗</span></a>
<noscript><p>The first track is available above. Enable JavaScript to switch between all eight tracks.</p></noscript>
</div>
</section>

<script src="/assets/js/music.js" defer></script>
