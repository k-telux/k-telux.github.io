---
permalink: /contact/
title: "Contact Me [Wechat](../images/wechat.jpg)"
excerpt: "Get in touch"
layout: single
author_profile: true
---

{% assign base = site.baseurl | default: "" %}
{% assign site_url = site.url | default: "https://k-telux.github.io" %}

<style>
  form.contact-card {
    max-width: 720px; margin: 1.5rem auto; padding: 1.25rem 1.5rem;
    border: 1px solid #e5e7eb; border-radius: 1rem;
    box-shadow: 0 4px 14px rgba(0,0,0,0.04); background: #fff;
  }
  .contact-grid { display: grid; gap: 1rem; }
  .inline-two { display: grid; gap: 1rem; grid-template-columns: 1fr 1fr; }
  label { font-weight: 600; margin-bottom: 0.25rem; display:block; }
  input[type="text"], input[type="email"], textarea {
    width: 100%; border: 1px solid #d1d5db; border-radius: 0.5rem;
    padding: 0.6rem 0.75rem; font-size: 0.95rem;
  }
  input[type="file"] { width: 100%; }
  .hint { color: #6b7280; font-size: 0.85rem; margin-top: 0.25rem; }
  .actions { display:flex; gap:0.75rem; align-items:center; margin-top: 0.5rem; }
  button[type="submit"] { border: none; padding: 0.65rem 1.1rem; border-radius: 0.75rem; cursor: pointer; }
  .btn-primary { background: #111827; color: #fff; } .btn-primary:hover { opacity: .9; }
  .disclaimer { color:#6b7280; font-size:0.85rem; margin-top:0.25rem; }
  .hidden { display:none !important; }
  .error { color: #b91c1c; font-size: 0.9rem; margin-top: 0.25rem; }

  /* toast */
  .toast{
    position: fixed; right: 1rem; bottom: 1.25rem; background: #10b981; color:#fff;
    padding:.65rem 1rem; border-radius:.75rem; box-shadow:0 8px 24px rgba(16,185,129,.35);
    font-size:.95rem; opacity:0; transform: translateY(10px);
    transition: opacity .25s ease, transform .25s ease; z-index:9999; pointer-events:none;
  }
  .toast.show{ opacity:1; transform: translateY(0); }
  .toast.fade-out{ opacity:0; transform: translateY(6px); transition: opacity .6s ease, transform .6s ease; }
</style>

<p>If you prefer email: <a href="mailto:xzqtelux@gmail.com">xzqtelux@gmail.com</a></p>

<form
  class="contact-card"
  id="contactForm"
  action="https://formsubmit.co/afac8593c9c18a504deded6135c1b48f"
  method="POST"
  enctype="multipart/form-data"
  autocomplete="on"
  target="_self"
>
  <!-- FormSubmit 配置 -->
  <input type="hidden" name="_subject"  value="New message from your website contact page">
  <input type="hidden" name="_template" value="table">
  <!-- 提交成功后重定向到 /contact/?sent=1（务必是绝对 URL） -->
  <input type="hidden" name="_next"     value="{{ site_url }}{{ base }}/contact/?sent=1">
  <input type="hidden" name="_captcha"  value="false">
  <input type="text"   name="_honey" class="hidden" tabindex="-1" autocomplete="off">

  <div class="contact-grid">
    <div class="inline-two">
      <div>
        <label for="name">Your Name (optional)</label>
        <input type="text" id="name" name="name" placeholder="e.g., telux">
      </div>
      <div>
        <label for="email">Email (optional)</label>
        <input type="email" id="email" name="email" placeholder="you@example.com">
      </div>
    </div>

    <div>
      <label for="message">Message *</label>
      <textarea id="message" name="message" rows="7" placeholder="Write your message here..." required></textarea>
    </div>

    <div>
      <label for="files">Attachments (optional)</label>
      <input id="files" name="attachments" type="file" multiple>
      <div class="hint">Support to upload multiple files</div>
    </div>

    <div>
      <label>
        <input type="checkbox" id="consent" checked>
        I agree to send this information to Zhongqi for the purpose of contact.
      </label>
      <div class="disclaimer">We do not store data on the server; messages are forwarded to email via FormSubmit.</div>
    </div>

    <div id="formError" class="error hidden">Please provide at least a name or an email, and ensure consent is checked.</div>

    <div class="actions">
      <button class="btn-primary" type="submit">Send Message</button>
      <button type="reset">Reset</button>
    </div>
  </div>
</form>

<div id="toast" class="toast" role="status" aria-live="polite">Submitted Successfully</div>

<script>
  window.__CONTACT__ = {
    base: "{{ base }}",
    next: "{{ site_url }}{{ base }}/contact/?sent=1"
  };
</script>
<script src="{{ base }}/assets/js/contact.js"></script>
