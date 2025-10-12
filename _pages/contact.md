---
permalink: /contact/
title: "Contact Me"
excerpt: "Get in touch"
author_profile: true
---

<style>
  /* 简洁清爽样式，兼容 Jekyll 主题 */
  form.contact-card {
    max-width: 720px;
    margin: 1.5rem auto;
    padding: 1.25rem 1.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 1rem;
    box-shadow: 0 4px 14px rgba(0,0,0,0.04);
    background: #fff;
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
  button[type="submit"] {
    border: none; padding: 0.65rem 1.1rem; border-radius: 0.75rem; cursor: pointer;
  }
  .btn-primary {
    background: #111827; color: #fff;
  }
  .btn-primary:hover { opacity: 0.9; }
  .disclaimer { color:#6b7280; font-size:0.85rem; margin-top:0.25rem; }
  .hidden { display:none !important; }
  .error { color: #b91c1c; font-size: 0.9rem; margin-top: 0.25rem; }
  .success { color: #065f46; font-size: 0.95rem; margin: 0.25rem 0; }
</style>

<p>If you prefer email directly: <a href="mailto:xzqtelux@gmail.com">xzqtelux@gmail.com</a></p>

<form
  class="contact-card"
  id="contactForm"
  action="https://formsubmit.co/xzqtelux@gmail.com"
  method="POST"
  enctype="multipart/form-data"
  autocomplete="on"
  target="_self"
>
  <!-- FormSubmit 相关隐藏字段 -->
  <input type="hidden" name="_subject" value="New message from your website contact page">
  <input type="hidden" name="_template" value="table">
  <!-- 提交成功后的跳转页面（可改为你站内任意路径） -->
  <input type="hidden" name="_next" value="https://k-telux.github.io/contact/?sent=1">
  <!-- 关闭默认验证码（可改为 'true' 开启） -->
  <input type="hidden" name="_captcha" value="false">
  <!-- 蜜罐防垃圾（不要删除） -->
  <input type="text" name="_honey" class="hidden" tabindex="-1" autocomplete="off">

  <div class="contact-grid">

    <div class="inline-two">
      <div>
        <label for="name">Your Name (optional)</label>
        <input type="text" id="name" name="name" placeholder="e.g., Alex">
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
      <div class="hint">Support to upload multiple files </div>
    </div>

    <div>
      <label>
        <input type="checkbox" id="consent" checked>
        I agree to send this information to Zhongqi for the purpose of contact.
      </label>
      <div class="disclaimer">We do not store data on the server; messages are forwarded to email via FormSubmit.</div>
    </div>

    <div id="formError" class="error hidden">Please provide at least a name or an email, and ensure consent is checked.</div>
    <div id="formSuccess" class="success hidden">Thanks! Your message was sent.</div>

    <div class="actions">
      <button class="btn-primary" type="submit">Send Message</button>
      <button type="reset">Reset</button>
    </div>
  </div>
</form>

<script>
  (function () {
    // 成功提示（根据 ?sent=1）
    const params = new URLSearchParams(window.location.search);
    if (params.get('sent') === '1') {
      const ok = document.getElementById('formSuccess');
      if (ok) ok.classList.remove('hidden');
    }

    const form = document.getElementById('contactForm');
    const err = document.getElementById('formError');

    form.addEventListener('submit', function (e) {
      // 前端校验：name 或 email 至少一个；同意勾选；message 非空
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const msg = document.getElementById('message').value.trim();
      const consent = document.getElementById('consent').checked;

      let emailValid = true;
      if (email.length > 0) {
        emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }

      if ((!name && !email) || !msg || !consent || !emailValid) {
        e.preventDefault();
        if (err) {
          err.textContent = (!emailValid)
            ? 'Please provide a valid email address.'
            : 'Please provide at least a name or an email, ensure the message is filled, and consent is checked.';
          err.classList.remove('hidden');
        }
      } else {
        if (err) err.classList.add('hidden');
      }
    });
  })();
</script>
