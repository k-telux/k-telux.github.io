const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../assets/horizon/site.js"), "utf8");

function element(extra = {}) {
  return Object.assign({
    listeners: {}, attributes: {}, value: "", hidden: false,
    addEventListener(type, callback) { this.listeners[type] = callback; },
    dispatchEvent(event) { this.listeners[event.type]?.(event); },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; }
  }, extra);
}

function site(initial = {}) {
  const search = element({ value: initial.search || "" });
  const count = element(), empty = element(), clear = element(), summary = element();
  const projects = ["Single photon emission", "Cavity photon cooling", "Optical tools"].map(textContent => {
    const details = element();
    return element({
      textContent, details, querySelector: () => details,
      scrollIntoView() { this.scrolled = true; }
    });
  });
  const links = ["/", "/projects/"].map(route => element({ href: "http://localhost:4000" + route }));
  const menu = element({
    open: false, querySelector: () => summary, querySelectorAll: () => links,
    contains: target => target === summary || links.includes(target)
  });
  const nodes = {
    ".nav-menu": menu, "#project-search": search, "#project-count": count,
    "#project-empty": empty, "#clear-search": clear,
    ...Object.fromEntries(projects.map((project, i) => ["#project-" + (i + 1), project]))
  };
  const documentEvents = {}, windowEvents = {};
  const location = { pathname: "/projects/", hash: initial.hash || "" };
  vm.runInNewContext(source, {
    location, URL, Event,
    matchMedia: query => ({ matches: query.includes("1001") && !!initial.desktop, addEventListener() {} }),
    document: {
      querySelector: selector => nodes[selector] || null,
      querySelectorAll: selector => ({ ".nav-links a": links, ".project-item": projects }[selector] || []),
      addEventListener: (type, callback) => { documentEvents[type] = callback; }
    },
    window: { addEventListener: (type, callback) => { windowEvents[type] = callback; } }
  });
  return {
    search, count, empty, clear, summary, projects, menu, links,
    filter(value) { search.value = value; search.dispatchEvent(new Event("input")); },
    navigate(hash) { location.hash = hash; windowEvents.hashchange(); },
    key(key) { documentEvents.keydown({ key }); }
  };
}

test("valid project hashes recover filtered targets, including an initial saved search", () => {
  const app = site();
  app.filter("cooling");
  assert.equal(app.projects[0].hidden, true);
  app.navigate("#project-1");
  assert.equal(app.search.value, "");
  assert.equal(app.projects[0].hidden, false);
  assert.equal(app.projects[0].details.attributes.open, "");
  assert.equal(app.projects[0].scrolled, true);
  assert.equal(app.count.textContent, "3 of 3 projects");
  const initial = site({ search: "cooling", hash: "#project-1" });
  assert.equal(initial.search.value, "");
  assert.equal(initial.projects[0].hidden, false);
  assert.equal(initial.projects[0].details.attributes.open, "");
});

test("unknown or malformed hashes leave the search and results intact", () => {
  const app = site();
  app.filter("cooling");
  for (const hash of ["#project-999", "#project-[1]", "#unrelated", ""]) {
    app.navigate(hash);
    assert.equal(app.search.value, "cooling");
    assert.deepEqual(app.projects.map(project => project.hidden), [true, false, true]);
    assert.equal(app.count.textContent, "1 of 3 projects");
  }
});

test("project search combines words, reports empty results, and clears with focus", () => {
  const app = site();
  app.filter("  PHOTON   cooling ");
  assert.deepEqual(app.projects.map(project => project.hidden), [true, false, true]);
  app.filter("not-in-this-collection");
  assert.equal(app.count.textContent, "0 of 3 projects");
  assert.equal(app.empty.hidden, false);
  assert.equal(app.clear.hidden, false);
  app.clear.dispatchEvent(new Event("click"));
  assert.equal(app.search.value, "");
  assert.equal(app.search.focused, true);
  assert.equal(app.empty.hidden, true);
  assert.equal(app.clear.hidden, true);
  assert.equal(app.count.textContent, "3 of 3 projects");
  assert.ok(app.projects.every(project => !project.hidden));
});

test("Escape closes an open navigation menu and returns focus to its summary", () => {
  const app = site();
  assert.equal(app.links[1].attributes["aria-current"], "page");
  app.menu.open = true;
  app.key("Tab");
  assert.equal(app.menu.open, true);
  app.key("Escape");
  assert.equal(app.menu.open, false);
  assert.equal(app.summary.focused, true);
  app.summary.focused = false;
  app.key("Escape");
  assert.equal(app.summary.focused, false);
});

test("desktop navigation stays available on Escape", () => { const app=site({desktop:true}); assert.equal(app.menu.open,true); app.key("Escape"); assert.equal(app.menu.open,true); });
