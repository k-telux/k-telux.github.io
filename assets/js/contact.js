(function () {
  var cfg   = window.__CONTACT__ || {};
  var base  = cfg.base || "";
  var nextU = cfg.next || (location.origin + base + "/contact/?sent=1");

  var form = document.getElementById("contactForm");
  var err  = document.getElementById("formError");
  var toastEl = document.getElementById("toast");

  function showToast(text, duration) {
    if (!toastEl) return;
    toastEl.textContent = text || "Submitted Successfully";
    toastEl.classList.add("show");
    setTimeout(function () {
      toastEl.classList.add("fade-out");
      toastEl.addEventListener("transitionend", function () {
        toastEl.classList.remove("show", "fade-out");
      }, { once: true });
    }, duration || 2000);
  }

  function maybeToastFromQuery() {
    var params = new URLSearchParams(location.search);
    if (params.get("sent") === "1") {
      showToast("Submitted Successfully", 1600);
      try {
        history.replaceState({}, "", location.pathname + location.hash);
      } catch (_) {}
    }
  }

  function onSubmit(e) {
    var name    = (document.getElementById("name").value || "").trim();
    var email   = (document.getElementById("email").value || "").trim();
    var msg     = (document.getElementById("message").value || "").trim();
    var consent = document.getElementById("consent").checked;

    var emailValid = true;
    if (email.length > 0) {
      emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    if ((!name && !email) || !msg || !consent || !emailValid) {
      e.preventDefault();
      if (err) {
        err.textContent = (!emailValid)
          ? "Please provide a valid email address."
          : "Please provide at least a name or an email, ensure the message is filled, and consent is checked.";
        err.classList.remove("hidden");
      }
    } else {
      if (err) err.classList.add("hidden");
    }
  }

  if (form) form.addEventListener("submit", onSubmit);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", maybeToastFromQuery);
  } else {
    maybeToastFromQuery();
  }
})();
