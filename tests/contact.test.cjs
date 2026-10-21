const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const contactSource = fs.readFileSync(path.join(root, "assets/horizon/contact.js"), "utf8");

function element() {
  return {
    value: "", checked: false, disabled: false, files: [], dataset: {}, attributes: {},
    validity: { valid: true }, textContent: "", listeners: {},
    addEventListener(type, callback) { this.listeners[type] = callback; },
    setAttribute(key, value) { this.attributes[key] = value; },
    removeAttribute(key) { delete this.attributes[key]; },
    focus() { this.focused = true; },
    scrollIntoView() { this.scrolledIntoView = true; },
    fire(type) {
      const event = { target: this, prevented: false, preventDefault() { this.prevented = true; } };
      return this.listeners[type]?.(event);
    }
  };
}

function contact(fetchResult = { ok: true, success: true }) {
  const ids = ["contactForm", "form-status", "contact-submit", "contact-reset", "name", "email", "message", "files", "consent",
    "email-error", "message-error", "files-error", "consent-error"];
  const nodes = Object.fromEntries(ids.map(id => [id, { ...element(), id }]));
  const form = nodes.contactForm;
  const controls = ["contact-submit", "contact-reset", "name", "email", "message", "files", "consent"].map(id => nodes[id]);
  const requests = [];
  let timeout;
  form.action = "https://formsubmit.co/existing-id";
  form.querySelectorAll = () => controls;
  form.reset = () => {
    const event = { prevented: false, preventDefault() { this.prevented = true; } };
    form.listeners.reset(event);
    if (!event.prevented) {
      controls.forEach(node => { node.value = ""; node.checked = false; node.files = []; });
    }
  };
  class FormData extends Map {
    constructor() {
      super([["name", nodes.name.value], ["email", nodes.email.value], ["message", nodes.message.value]]);
    }
    append(key, value) { this.set(key, value); }
  }
  vm.runInNewContext(contactSource, {
    document: { getElementById: id => nodes[id] },
    location: { origin: "http://localhost:4000", pathname: "/contact/", search: "?sent=1" },
    FormData, AbortController,
    setTimeout(callback) { timeout = callback; return 1; },
    clearTimeout() {},
    fetch(url, options) {
      requests.push({ url, options });
      if (typeof fetchResult === "function") return fetchResult(options);
      return Promise.resolve({ ok: fetchResult.ok, json: async () => ({ success: fetchResult.success }) });
    }
  });
  nodes.name.value = "  Visitor  ";
  nodes.email.value = "reader@example.org";
  nodes.message.value = "  A research question.  ";
  nodes.consent.checked = true;
  return { nodes, requests, submit: () => form.fire("submit"), timeout: () => timeout() };
}

test("a query string cannot claim submission success", () => {
  const { nodes, requests } = contact();
  assert.equal(nodes["form-status"].textContent, "");
  assert.equal(requests.length, 0);
});

test("email, nonblank message and explicit consent are required", async () => {
  for (const field of ["email", "message", "consent"]) {
    const app = contact();
    if (field === "consent") app.nodes.consent.checked = false;
    else app.nodes[field].value = "   ";
    await app.submit();
    assert.equal(app.requests.length, 0);
    assert.equal(app.nodes[field].attributes["aria-invalid"], "true");
    assert.equal(app.nodes[field].focused, true);
    assert.ok(app.nodes[field + "-error"].textContent);
  }
  const app = contact();
  app.nodes.email.validity.valid = false;
  await app.submit();
  assert.equal(app.requests.length, 0);
});

test("attachment size uses the combined total and preserves oversized drafts", async () => {
  const app = contact();
  app.nodes.files.files = [{ size: 5000000 }, { size: 5000001 }];
  await app.submit();
  assert.equal(app.requests.length, 0);
  assert.equal(app.nodes.files.focused, true);
  assert.match(app.nodes["files-error"].textContent, /10 MB/);
  assert.equal(app.nodes.message.value, "A research question.");
});

test("inline errors are associated with fields and clear on input, resubmit and reset", async () => {
  const html = fs.readFileSync(path.join(root, "_pages/contact.md"), "utf8");
  for (const field of ["email", "message", "files", "consent"]) {
    assert.match(html, new RegExp('id="' + field + '"[^>]*aria-describedby="[^"]*' + field + '-error'));
  }
  const app = contact();
  app.nodes.email.value = "";
  await app.submit();
  app.nodes.email.value = "reader@example.org";
  app.nodes.contactForm.listeners.input({ target: app.nodes.email });
  assert.equal(app.nodes["email-error"].textContent, "");
  assert.equal(app.nodes.email.attributes["aria-invalid"], undefined);
  assert.equal(app.nodes["form-status"].textContent, "");
  app.nodes.message.value = " ";
  await app.submit();
  assert.ok(app.nodes["message-error"].textContent);
  app.nodes.message.value = "A question.";
  app.nodes.consent.checked = false;
  await app.submit();
  assert.equal(app.nodes["message-error"].textContent, "");
  assert.ok(app.nodes["consent-error"].textContent);
  app.nodes.contactForm.reset();
  assert.equal(app.nodes["consent-error"].textContent, "");
  assert.equal(app.nodes.consent.attributes["aria-invalid"], undefined);
});

test("10 MB is accepted; files, reply-to and trimmed values are sent", async () => {
  const app = contact();
  app.nodes.files.files = [{ size: 5000000 }, { size: 5000000 }];
  await app.submit();
  const { url, options } = app.requests[0];
  assert.equal(url, "https://formsubmit.co/ajax/existing-id");
  assert.equal(options.body.get("name"), "Visitor");
  assert.equal(options.body.get("message"), "A research question.");
  assert.equal(options.body.get("_replyto"), "reader@example.org");
  assert.equal(options.body.get("attachment2").size, 5000000);
});

test("only explicit boolean or string true confirms success", async () => {
  for (const success of [true, "true"]) {
    const app = contact({ ok: true, success });
    await app.submit();
    assert.equal(app.nodes["form-status"].dataset.state, "success");
    assert.equal(app.nodes.message.value, "");
    assert.equal(app.nodes.consent.checked, false);
  }
  for (const success of [undefined, 1, "yes"]) {
    const app = contact({ ok: true, success });
    await app.submit();
    assert.equal(app.nodes["form-status"].dataset.state, "uncertain");
    assert.equal(app.nodes.message.value, "A research question.");
    assert.equal(app.nodes["contact-submit"].disabled, true);
  }
});

test("explicit rejection preserves the draft and allows retry", async () => {
  for (const success of [false, "false"]) {
    const app = contact({ ok: true, success });
    await app.submit();
    assert.equal(app.nodes["form-status"].dataset.state, "error");
    assert.equal(app.nodes.message.value, "A research question.");
    assert.equal(app.nodes["contact-submit"].disabled, false);
    await app.submit();
    assert.equal(app.requests.length, 2);
    app.nodes.contactForm.reset();
    assert.equal(app.nodes["form-status"].textContent, "");
    assert.equal(app.nodes.message.value, "");
  }
});

test("pending submissions block duplicates and cannot be reset", async () => {
  let resolve;
  const app = contact(() => new Promise(done => { resolve = done; }));
  const pending = app.submit();
  assert.equal(app.nodes["form-status"].dataset.state, "loading");
  assert.equal(app.nodes.contactForm.attributes["aria-busy"], "true");
  assert.equal(app.nodes.email.disabled, true);
  app.nodes.contactForm.reset();
  await app.submit();
  assert.equal(app.requests.length, 1);
  assert.equal(app.nodes.message.value, "A research question.");
  resolve({ ok: true, json: async () => ({ success: true }) });
  await pending;
  assert.equal(app.nodes.email.disabled, false);
});

test("timeout is uncertain, preserves input and prevents blind resending", async () => {
  const app = contact(options => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => reject(new Error("Timeout")));
  }));
  const pending = app.submit();
  app.timeout();
  await pending;
  assert.equal(app.nodes["form-status"].dataset.state, "uncertain");
  assert.equal(app.nodes.message.value, "A research question.");
  await app.submit();
  assert.equal(app.requests.length, 1);
  app.nodes.contactForm.reset();
  assert.equal(app.nodes["contact-submit"].disabled, false);
});

test("HTTP failure cannot be reported as success", async () => {
  const app = contact({ ok: false, success: true });
  await app.submit();
  assert.equal(app.nodes["form-status"].dataset.state, "uncertain");
});

test("all eight tracks resolve locally and native player handles switching and errors", async () => {
  const source = fs.readFileSync(path.join(root, "_pages/music.md"), "utf8");
  const tracks = [...source.matchAll(/<option data-file="([^"]+)" data-cover="([^"]+)" data-artist="([^"]+)">([^<]+)<\/option>/g)];
  assert.equal(tracks.length, 8);
  for (const track of tracks) {
    assert.ok(fs.existsSync(path.join(root, "assets/music", track[1])));
    assert.ok(fs.existsSync(path.join(root, "assets/music", track[2])));
  }
  const ids = ["track-select", "music-audio", "music-status", "track-title", "track-artist", "track-cover", "track-file"];
  const nodes = Object.fromEntries(ids.map(id => [id, element()]));
  const audio = nodes["music-audio"];
  audio.paused = true;
  audio.pause = () => { audio.paused = true; };
  audio.load = () => { audio.loaded = true; };
  nodes["track-select"].options = tracks.map(track => ({
    dataset: { file: track[1], cover: track[2], artist: track[3] }, textContent: track[4]
  }));
  nodes["track-select"].selectedIndex = 1;
  vm.runInNewContext(fs.readFileSync(path.join(root, "assets/js/music.js"), "utf8"), {
    document: {
      querySelector: () => ({ dataset: { assetBase: "/assets/music/" } }),
      getElementById: id => nodes[id]
    }
  });
  nodes["track-select"].fire("change");
  assert.equal(audio.src, "/assets/music/Abnormal%20Spectrum.wav");
  assert.equal(nodes["track-title"].textContent, "Abnormal Spectrum");
  assert.equal(audio.loaded, true);
  audio.fire("loadedmetadata");
  assert.equal(nodes["music-status"].dataset.state, "idle");
  audio.fire("playing");
  assert.equal(nodes["music-status"].dataset.state, "playing");
  audio.fire("error");
  assert.equal(nodes["music-status"].dataset.state, "error");
});

test("invalid fields are brought into view even when already focused", async () => { const app=contact(); app.nodes.email.value=""; app.nodes.email.focused=true; await app.submit(); assert.equal(app.nodes.email.scrolledIntoView,true); });
