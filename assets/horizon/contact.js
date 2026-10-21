(function () {
  "use strict";
  var form = document.getElementById("contactForm");
  if (!form) return;

  var status = document.getElementById("form-status");
  var submit = document.getElementById("contact-submit");
  var name = document.getElementById("name");
  var email = document.getElementById("email");
  var message = document.getElementById("message");
  var files = document.getElementById("files");
  var consent = document.getElementById("consent");
  var busy = false;
  var uncertain = false;
  var validationField = null;
  var controls = form.querySelectorAll("input, textarea, button");

  function showStatus(state, text) {
    status.dataset.state = state;
    status.textContent = text;
  }

  function clearErrors() {
    [email, message, files, consent].forEach(function (field) {
      field.removeAttribute("aria-invalid");
      document.getElementById(field.id + "-error").textContent = "";
    });
    if (validationField) showStatus("idle", "");
    validationField = null;
  }

  function invalid(field, text) {
    field.setAttribute("aria-invalid", "true");
    document.getElementById(field.id + "-error").textContent = text;
    validationField = field.id;
    showStatus("error", text);
    field.focus({ preventScroll: true });
    var calm = typeof matchMedia !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches;
    field.scrollIntoView({ block: "center", behavior: calm ? "instant" : "smooth" });
  }

  form.noValidate = true;
  submit.disabled = false;

  form.addEventListener("reset", function (event) {
    if (busy) {
      event.preventDefault();
      return;
    }
    uncertain = false;
    clearErrors();
    submit.disabled = false;
    submit.textContent = "Send message ↗";
    showStatus("idle", "");
  });

  form.addEventListener("input", function (event) {
    event.target.removeAttribute("aria-invalid");
    var error = document.getElementById(event.target.id + "-error");
    if (error) error.textContent = "";
    if (validationField === event.target.id) {
      validationField = null;
      showStatus("idle", "");
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (busy || uncertain) return;
    clearErrors();
    name.value = name.value.trim();
    email.value = email.value.trim();
    message.value = message.value.trim();

    if (!email.value || !email.validity.valid) {
      invalid(email, "Enter a valid email address so I can reply.");
      return;
    }
    if (!message.value) {
      invalid(message, "Write a message before sending.");
      return;
    }
    if (!consent.checked) {
      invalid(consent, "Please agree to share your information before sending.");
      return;
    }
    var attachments = Array.from(files.files);
    if (attachments.reduce(function (total, file) { return total + file.size; }, 0) > 10000000) {
      invalid(files, "Your attachments exceed 10 MB in total. Choose smaller files or email them directly.");
      return;
    }

    var body = new FormData(form);
    body.set("_replyto", email.value);
    body.set("_url", location.origin + location.pathname);
    body.delete("attachment");
    // ponytail: individually named file fields match FormSubmit's documented multi-file form.
    attachments.forEach(function (file, index) {
      body.append(index ? "attachment" + (index + 1) : "attachment", file);
    });

    busy = true;
    controls.forEach(function (control) { control.disabled = true; });
    form.setAttribute("aria-busy", "true");
    submit.textContent = "Sending…";
    showStatus("loading", "Sending your message. Please keep this page open.");
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 30000);

    try {
      var response = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
        method: "POST",
        headers: { Accept: "application/json" },
        body: body,
        signal: controller.signal
      });
      var result = await response.json();
      if (response.ok && result && (result.success === true || result.success === "true")) {
        busy = false;
        form.reset();
        showStatus("success", "Your message was accepted by the delivery service. Thank you for getting in touch.");
      } else if (result && (result.success === false || result.success === "false")) {
        showStatus("error", "The service did not accept your message. Your text is still here. Try again or email me directly.");
      } else {
        throw new Error("Unconfirmed delivery");
      }
    } catch (_) {
      uncertain = true;
      showStatus("uncertain", "Delivery could not be confirmed. Your message is still here. Please check with me by email before sending it again.");
    } finally {
      clearTimeout(timeout);
      busy = false;
      controls.forEach(function (control) { control.disabled = false; });
      form.setAttribute("aria-busy", "false");
      submit.disabled = uncertain;
      submit.textContent = uncertain ? "Delivery unconfirmed" : "Send message ↗";
    }
  });
})();
