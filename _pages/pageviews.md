---
layout: editorial
title: Visitor map
permalink: /pageviews/
kicker: ELSEWHERE / VISITOR MAP
lede: A small window into where readers find this corner of the web.
---

<link rel="stylesheet" href="/assets/horizon/visitors.css">
<section class="visitor-map" aria-labelledby="visitor-heading">
  <div class="visitor-heading"><div><h2 id="visitor-heading">A world of readers.</h2><p>Two ways to see where visits to this website begin.</p></div>
  <fieldset class="visitor-switch"><legend class="visually-hidden">Visitor visualization</legend><label><input type="radio" name="visitor-view" value="globe" checked><span>Globe</span></label><label><input type="radio" name="visitor-view" value="map"><span>Map</span></label></fieldset></div>
  <p id="map-status" role="status" aria-live="polite">Loading the visitor globe…</p>
  <div id="map-container" class="visitor-stage" aria-busy="true"><div id="visitor-globe" class="visitor-panel"></div><div id="visitor-map" class="visitor-panel" hidden></div></div>
  <button class="button-secondary" id="retry-map" type="button" hidden>Try again ↗</button>
  <div class="visitor-bottom"><p class="small-note">Provided by MapMyVisitors. Loading a view records your visit and approximate location. Locations are approximate; new visits can take time to appear.</p><a class="text-link" href="https://mapmyvisitors.com/web/1bzyq" target="_blank" rel="noopener noreferrer">Visit statistics ↗</a></div>
  <noscript><p>JavaScript is needed for these views. You can still open the visit statistics.</p></noscript>
</section>
<script src="/assets/js/visitors.js" defer></script>
