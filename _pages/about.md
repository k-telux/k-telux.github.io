---
permalink: /
title: "Self-Introduction "
excerpt: "About me"
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

I am a first-year graduate student from [the Chemistry PhD program](https://chemistry.brown.edu/graduate) at [Brown University](https://www.brown.edu/). I will join [Yusong Bai's Group](https://www.yusongbai.org/) after the first semester rotation. You can find my academic CV [here](../assets/xzq_Resume.pdf)

## PhD Research Area
- Exciton phase transition in low dimensional materials
- Mott transition and the hidden phase in moire supperlattice
- 2D devices fabrication and stack

I have a bachelor degree of physics at [School of Physical Sciences](https://en.physics.ustc.edu.cn/), [University of Science and Technology of China (USTC)](https://en.ustc.edu.cn/), majoring in Optics and Optical Engineering.  You can find my bachelor thesis [here](../assets/bachelor_thesis.pdf).

From 2022 to 2024, I focused on Fiber Cavity QED and participated in the "Single-atom trapping technique based on movable optical lattices" project supervised by [Prof. Chuan-Feng Li](http://lqcc.ustc.edu.cn/cfli/) and associate professor [Dr. Jian Wang](https://faculty.ustc.edu.cn/wangjian1), [CAS Key Laboratory of Quantum Information](https://lqcc.ustc.edu.cn/) at USTC.

At 2024 summer, I went to Rice University for a half year internship program. I invastigated the single photon emission in few-layer transition-metal dichalcogenide (TMDC) and finished my bachlor degree thesis, which were supported by the [SCOPE lab](https://scopelab.rice.edu/) and led by [Prof. Shengxi Huang](https://profiles.rice.edu/faculty/shengxi-huang) and [Wenjing Wu](https://scholar.google.com/citations?user=lm68m7kAAAAJ) at Rice University.

## Bachelor Research History
- Fiber cavity QED with cold atoms
- Single photon emission based on defects
- Strain engineering by piezoelectric materials and neural network

## Contact Information
- [Directly Send Message](https://k-telux.github.io/contact/)
- [Email](zhongqi_xiu@brown.edu) 
- [Wechat](../images/wechat.jpg)

<html lang="zh-cn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CV</title>
  <style>
    .hidden-content { display: none; }
    .clickable { cursor: pointer; }
    /* 按钮样式 */
    .btn-music {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .55rem .9rem; border-radius: .6rem; border: 1px solid #e5e7eb;
      background: #111827; color: #fff; text-decoration: none; font-size: .95rem;
      box-shadow: 0 6px 16px rgba(0,0,0,.06);
      transition: transform .05s ease, opacity .2s ease;
    }
    .btn-music:hover { opacity: .92; }
    .btn-music:active { transform: translateY(1px); }
    .btn-wrap { margin-top: .75rem; }
  </style>
</head>
<body>
  <!-- 给标题一个 id，便于绑定事件；tabindex 让其可聚焦；aria-controls 辅助无障碍 -->
  <h2 id="toggle-title" class="clickable" tabindex="0" aria-controls="hidden-content" aria-expanded="false">
    Extracurricular Activities & Interests (Click to view)
  </h2>

  <!-- 双保险：CSS 隐藏 + hidden 属性 -->
  <div class="hidden-content" id="hidden-content" hidden>
    <ul>
      <li>Member of the Student Union (2021 - 2023)</li>
      <li>Principal player of the wind section of the School Folk Orchestra --- <a href="https://space.bilibili.com/64643274">NMOU</a> (2021 - 2023)</li>
      <li>Hobbies: music, travel, photography (especially aerial), gym, anime (also two-dimensional)</li>
      <li><a href="https://space.bilibili.com/89038571">Bilibili homepage</a> (You can find my aerial videos here)</li>
    </ul>

    <!-- 跳转音乐页按钮（不进主导航，通过此按钮访问） -->
    <div class="btn-wrap">
      <a class="btn-music" href="{{ site.baseurl | default: '' }}/music/">🎵 Open My Music</a>
      <!-- 若想新标签打开：在上面 a 标签加 target="_blank" rel="noopener" -->
    </div>
  </div>

  <script>
    // 等 DOM 就绪后再绑定，避免渲染顺序导致失效
    (function () {
      var title = document.getElementById('toggle-title');
      var content = document.getElementById('hidden-content');

      // 统一的切换函数
      function toggle() {
        var willShow = content.hasAttribute('hidden');
        if (willShow) {
          content.removeAttribute('hidden');            // 语义隐藏切换
          content.style.display = 'block';              // 兼容旧样式
          title.setAttribute('aria-expanded', 'true');
        } else {
          content.setAttribute('hidden', '');
          content.style.display = 'none';
          title.setAttribute('aria-expanded', 'false');
        }
      }

      // 点击标题切换
      title.addEventListener('click', toggle);

      // 键盘无障碍：Enter 或 Space 切换
      title.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ' || e.code === 'Space') {
          e.preventDefault();
          toggle();
        }
      });

      // 初始状态：强制隐藏（双保险）
      content.setAttribute('hidden', '');
      content.style.display = 'none';
      title.setAttribute('aria-expanded', 'false');
    })();
  </script>
</body>
</html>


