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

    /* 新增：按钮样式（简洁、主题友好） */
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
  <h2 class="clickable" onclick="toggleVisibility()">Extracurricular Activities & Interests (Click to view)</h2>

  <div class="hidden-content" id="hidden-content">
    <ul>
      <li>Member of the Student Union (2021 - 2023)</li>
      <li>Principal player of the wind section of the School Folk Orchestra --- <a href="https://space.bilibili.com/64643274">NMOU</a> (2021 - 2023)</li>
      <li>Hobbies: music, travel, photography(especially aerial), gym, anime (also two-dimensional)</li>
      <li><a href="https://space.bilibili.com/89038571">Bilibili homepage</a> (You can find my aerial videos here)<br></li>
    </ul>

    <!-- 新增：跳转按钮（不加入顶部导航，通过按钮访问 /music/） -->
    <div class="btn-wrap">
      <!-- 方法A：a标签当按钮（推荐） -->
      <a id="musicLink" class="btn-music" href="#">🎵 Open My Music</a>

      <!-- 方法B（可选）：button版。若只保留A，上面这一段可以删除）
      <button class="btn-music" type="button" onclick="goMusic()">🎵 Open My Music</button>
      -->
    </div>
  </div>

  <script>
    // 展开/收起
    function toggleVisibility() {
      var hiddenContent = document.getElementById('hidden-content');
      if (hiddenContent.style.display === 'none' || hiddenContent.style.display === '') {
        hiddenContent.style.display = 'block';
      } else {
        hiddenContent.style.display = 'none';
      }
    }

    // 计算 baseurl（Jekyll 会在构建时替换；本地纯HTML打开时退化为空字符串）
    var BASE = "{{ site.baseurl | default: '' }}";

    // 方法A：给 a 标签注入正确的 href
    var musicLink = document.getElementById('musicLink');
    if (musicLink) {
      musicLink.href = BASE + "/music/";   // 你的音乐子页面固定是 /music/
    }

    // 方法B（若使用 button）
    function goMusic() {
      window.location.href = BASE + "/music/";
    }
  </script>
</body>
</html>

