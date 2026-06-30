/* ============================================
   FUSTAR — 暗夜美学 品牌视觉网站
   Interactions: Gallery, Lightbox, Scroll, Nav
   ============================================ */

(function () {
  'use strict';

  /* ---------- IMAGE CATEGORIES ---------- */
  const imageDir = '视觉图片';
  const categories = [
    { name: '正肩 001', folder: '正肩001', files: ['2621d7ce4e83d78aea1aa2035fe183f8.jpg', 'dd1ce073b7e0cef5dca5542e32e768d7.jpg'] },
    { name: '辅料内容', folder: '辅料内容', files: ['19dd32152901f423b31a6c89b9587399.jpg', '34f8f164bbc4b6b1cc0b15da8260cec6.jpg', '4d5098cc576f7df6f42716237042e856.jpg', '7a617555324ea2e142a72a041a461979.jpg', '837875d082f8cc8bc6de64f6179053ba.jpg'] }
  ];

  /* ---------- GALLERY BROWSER ---------- */
  const browser = document.getElementById('galleryBrowser');
  const browserTabs = document.getElementById('browserTabs');
  const browserGrid = document.getElementById('browserGrid');
  const browserClose = document.getElementById('browserClose');
  const enterBtn = document.getElementById('galleryEnter');
  let activeCat = categories[0]; // default "全部"

  // Detail viewer
  const bv = document.getElementById('browserViewer');
  const bvImg = document.getElementById('bvImg');
  const bvCat = document.getElementById('bvCat');
  const bvIndex = document.getElementById('bvIndex');
  const bvClose = document.getElementById('bvClose');
  const bvPrev = document.getElementById('bvPrev');
  const bvNext = document.getElementById('bvNext');
  let bvCurrent = 0;
  let bvFiles = [];

  function buildTabs() {
    browserTabs.innerHTML = '';
    categories.forEach((cat, i) => {
      const tab = document.createElement('button');
      tab.className = 'browser-tab' + (i === 0 ? ' active' : '');
      tab.innerHTML = `${cat.name}<span class="tab-count">${cat.files.length}</span>`;
      tab.addEventListener('click', () => {
        browserTabs.querySelectorAll('.browser-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCat = categories[i];
        buildGrid(activeCat);
      });
      browserTabs.appendChild(tab);
    });
  }

  function buildGrid(cat) {
    browserGrid.innerHTML = '';
    cat.files.forEach((file, i) => {
      const path = `${imageDir}/${cat.folder}/${file}`;
      const item = document.createElement('div');
      item.className = 'browser-item';
      item.innerHTML = `
        <img src="${path}" alt="${cat.name} ${i + 1}" loading="lazy" decoding="async">
        <span class="item-num">0${i + 1}</span>
      `;
      const img = item.querySelector('img');
      const onLoad = () => {
        img.classList.add('loaded');
        item.classList.add('loaded');
      };
      img.addEventListener('load', onLoad);
      if (img.complete) onLoad();
      item.addEventListener('click', () => openBv(cat, i));
      browserGrid.appendChild(item);
    });
  }

  function openBv(cat, index) {
    bvCurrent = index;
    bvFiles = cat.files;
    bvImg.src = `${imageDir}/${cat.folder}/${bvFiles[bvCurrent]}`;
    bvCat.textContent = cat.name;
    bvIndex.textContent = `0${bvCurrent + 1} / 0${bvFiles.length}`;
    bv.classList.add('active');
  }

  function closeBv() {
    bv.classList.remove('active');
  }

  function prevBv() {
    bvCurrent = (bvCurrent - 1 + bvFiles.length) % bvFiles.length;
    bvImg.src = `${imageDir}/${activeCat.folder}/${bvFiles[bvCurrent]}`;
    bvIndex.textContent = `0${bvCurrent + 1} / 0${bvFiles.length}`;
  }

  function nextBv() {
    bvCurrent = (bvCurrent + 1) % bvFiles.length;
    bvImg.src = `${imageDir}/${activeCat.folder}/${bvFiles[bvCurrent]}`;
    bvIndex.textContent = `0${bvCurrent + 1} / 0${bvFiles.length}`;
  }

  bvClose.addEventListener('click', closeBv);
  bvPrev.addEventListener('click', prevBv);
  bvNext.addEventListener('click', nextBv);
  bv.addEventListener('click', (e) => { if (e.target === bv) closeBv(); });

  // Wheel on viewer → switch images
  bv.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (e.deltaY > 15) nextBv();
    else if (e.deltaY < -15) prevBv();
  }, { passive: false });

  // Wheel inside browser → block completely, never scroll the page
  // Use capture phase to intercept before window gets it
  browser.addEventListener('wheel', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }, { passive: false, capture: true });

  document.addEventListener('keydown', (e) => {
    const lbOverlay = document.getElementById('luckybagOverlay');
    // Luckybag overlay takes priority
    if (lbOverlay && lbOverlay.classList.contains('active')) {
      if (e.key === 'Escape') {
        lbOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
      return;
    }
    if (!bv.classList.contains('active') && !browser.classList.contains('active')) return;
    if (bv.classList.contains('active')) {
      if (e.key === 'Escape') closeBv();
      if (e.key === 'ArrowLeft') prevBv();
      if (e.key === 'ArrowRight') nextBv();
    } else if (browser.classList.contains('active')) {
      if (e.key === 'Escape') closeBrowser();
    }
  });

  // Enter button
  enterBtn.addEventListener('click', () => {
    activeCat = categories[0];
    buildTabs();
    buildGrid(activeCat);
    browser.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  });

  function closeBrowser() {
    browser.classList.remove('active');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    bv.classList.remove('active');
  }

  browserClose.addEventListener('click', closeBrowser);
  browser.addEventListener('click', (e) => {
    if (e.target === browser) closeBrowser();
  });

  /* ---------- SMART SCROLL SNAP ---------- */
  const snapSections = document.querySelectorAll('#hero, #gallery, #about, #membership, #luckybag, #contact');
  let snapIndex = 0;
  let isSnapping = false;
  let snapTimeout = null;

  function getCurrentSectionIndex() {
    const scrollCenter = window.scrollY + window.innerHeight / 2;
    let closest = 0;
    let closestDist = Infinity;
    snapSections.forEach((sec, i) => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      const center = (top + bottom) / 2;
      const dist = Math.abs(scrollCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    return closest;
  }

  function snapTo(index) {
    if (index < 0 || index >= snapSections.length) return;
    snapIndex = index;
    isSnapping = true;
    snapSections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    clearTimeout(snapTimeout);
    snapTimeout = setTimeout(() => {
      isSnapping = false;
      snapIndex = getCurrentSectionIndex();
    }, 900);
  }

  // Strict page-by-page: one scroll gesture = one page
  let wheelLocked = false;

  window.addEventListener('wheel', (e) => {
    const bv = document.getElementById('browserViewer');
    const browser = document.getElementById('galleryBrowser');
    const lbOverlay = document.getElementById('luckybagOverlay');
    if ((bv && bv.classList.contains('active')) || (browser && browser.classList.contains('active')) || (lbOverlay && lbOverlay.classList.contains('active'))) return;

    e.preventDefault();
    if (isSnapping || wheelLocked) return;

    const current = getCurrentSectionIndex();
    if (e.deltaY > 15 && current < snapSections.length - 1) {
      wheelLocked = true;
      snapTo(current + 1);
      setTimeout(() => { wheelLocked = false; }, 1000);
    } else if (e.deltaY < -15 && current > 0) {
      wheelLocked = true;
      snapTo(current - 1);
      setTimeout(() => { wheelLocked = false; }, 1000);
    }
  }, { passive: false });

  // Touch: one swipe = one page
  let touchStartY = 0;
  let touchLocked = false;

  window.addEventListener('touchstart', (e) => {
    if (touchLocked || isSnapping) return;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    const bv = document.getElementById('browserViewer');
    const browser = document.getElementById('galleryBrowser');
    const lbOverlay = document.getElementById('luckybagOverlay');
    if ((bv && bv.classList.contains('active')) || (browser && browser.classList.contains('active')) || (lbOverlay && lbOverlay.classList.contains('active'))) return;
    if (touchLocked || isSnapping) return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    const current = getCurrentSectionIndex();
    if (diff > 30 && current < snapSections.length - 1) {
      touchLocked = true;
      snapTo(current + 1);
      setTimeout(() => { touchLocked = false; }, 1000);
    } else if (diff < -30 && current > 0) {
      touchLocked = true;
      snapTo(current - 1);
      setTimeout(() => { touchLocked = false; }, 1000);
    }
  });

  // Keyboard arrow support for full-page nav
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      // Only if no viewer/browser is open
      const bv = document.getElementById('browserViewer');
      const browser = document.getElementById('galleryBrowser');
      const lbOverlay = document.getElementById('luckybagOverlay');
      if ((bv && bv.classList.contains('active')) || (browser && browser.classList.contains('active')) || (lbOverlay && lbOverlay.classList.contains('active'))) return;
      e.preventDefault();
      const current = getCurrentSectionIndex();
      if (e.key === 'ArrowDown' && current < snapSections.length - 1) {
        snapTo(current + 1);
      } else if (e.key === 'ArrowUp' && current > 0) {
        snapTo(current - 1);
      }
    }
  });

  // Update snapIndex on manual scroll (e.g. nav click)
  window.addEventListener('scroll', () => {
    if (!isSnapping) {
      snapIndex = getCurrentSectionIndex();
    }
  }, { passive: true });

  /* ---------- BREATHING GLOW + EMBER PARTICLES ---------- */
  const breathingConfig = {
    gallery:    { glow: 'rgba(240,45,45,0.08) 0%, rgba(200,30,30,0.04) 25%, transparent 55%', size: '70% 55%', pos: '50% 50%', duration: '7s' },
    about:      { glow: 'rgba(240,45,45,0.07) 0%, rgba(200,30,30,0.03) 35%, transparent 60%', size: '85% 70%', pos: '60% 50%', duration: '9s' },
    membership: { glow: 'rgba(240,45,45,0.07) 0%, rgba(200,30,30,0.03) 35%, transparent 60%', size: '80% 65%', pos: '50% 45%', duration: '10s' },
    luckybag:   { glow: 'rgba(240,45,45,0.06) 0%, rgba(200,30,30,0.03) 35%, transparent 60%', size: '75% 60%', pos: '40% 50%', duration: '8s' },
    contact:    { glow: 'rgba(240,45,45,0.06) 0%, rgba(200,30,30,0.03) 35%, transparent 60%', size: '70% 55%', pos: '50% 55%', duration: '8.5s' }
  };

  Object.entries(breathingConfig).forEach(([sectionId, config]) => {
    const section = document.getElementById(sectionId);
    if (!section) return;

    // Breathing glow overlay
    const breathDiv = document.createElement('div');
    breathDiv.className = 'section-breath-overlay';
    breathDiv.style.cssText = `
      background: radial-gradient(ellipse ${config.size} at ${config.pos}, ${config.glow});
      animation: sectionBreathOpacity ${config.duration} ease-in-out infinite;
    `;
    section.appendChild(breathDiv);

    // Ember particles (skip contact)
    if (sectionId !== 'contact') {
      const embersContainer = document.createElement('div');
      embersContainer.className = 'gallery-embers-container';
      const count = sectionId === 'gallery' ? 12 : 6;
      for (let i = 0; i < count; i++) {
        const ember = document.createElement('span');
        ember.className = 'ember';
        embersContainer.appendChild(ember);
      }
      section.appendChild(embersContainer);
    }
  });

  /* ---------- SIDE SECTION DOTS ---------- */
  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'section-dots';
  const sectionNames = ['hero', 'gallery', 'about', 'membership', 'luckybag', 'contact'];
  sectionNames.forEach(id => {
    const dot = document.createElement('span');
    dot.className = 'section-dot';
    dot.setAttribute('data-section', id);
    dot.addEventListener('click', () => {
      document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
  });
  document.body.appendChild(dotsContainer);

  /* ---------- NAV SCROLL EFFECT ---------- */
  const navbar = document.getElementById('navbar');
  let ticking = false;

  function updateNav() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-links a');
    let currentSection = '';
    snapSections.forEach(sec => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (window.scrollY + window.innerHeight / 3 >= top && window.scrollY + window.innerHeight / 3 < bottom) {
        currentSection = sec.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + currentSection) {
        link.classList.add('active');
      }
    });

    // Update side dots
    document.querySelectorAll('.section-dot').forEach(dot => {
      dot.classList.remove('active');
      if (dot.getAttribute('data-section') === currentSection) {
        dot.classList.add('active');
      }
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateNav);
      ticking = true;
    }
  });

  /* ---------- SCROLL REVEAL ANIMATION ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -60px 0px',
    threshold: 0.1
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealEls.forEach(el => revealObserver.observe(el));

  // Observe any reveal elements still in the DOM
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      revealObserver.observe(el);
    });
  }, 100);

  /* ---------- HERO FULL-PAGE WATER RIPPLE EFFECT ---------- */
  const heroSection = document.getElementById('hero');
  const rippleCanvas = document.getElementById('heroRipple');

  if (rippleCanvas && heroSection) {
    const ctx = rippleCanvas.getContext('2d');
    let ripples = [];
    let mouseX = -999;
    let mouseY = -999;
    let animId = null;
    let rippleActive = false;
    let lastSpawnTime = 0;
    const SPAWN_COOLDOWN = 350; // ms — one ripple cluster per ~1/3 second

    function resizeCanvas() {
      const rect = heroSection.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      rippleCanvas.width = rect.width * dpr;
      rippleCanvas.height = rect.height * dpr;
      rippleCanvas.style.width = rect.width + 'px';
      rippleCanvas.style.height = rect.height + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function getCanvasPos(e) {
      const rect = rippleCanvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    // Spawn a single water-drop ripple cluster
    function spawnRippleCluster(x, y) {
      const ringCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < ringCount; i++) {
        ripples.push({
          x, y,
          radius: 2 + i * 14,
          maxRadius: 250 + Math.random() * 180 + i * 60,
          opacity: 0.45 - i * 0.08,
          life: 1.0,
          speed: 0.55 - i * 0.06,
          deceleration: 0.9992,
          lineWidth: 1.6 - i * 0.2
        });
      }
      while (ripples.length > 60) ripples.shift();
    }

    function animate() {
      ctx.clearRect(0, 0, rippleCanvas.width, rippleCanvas.height);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.speed *= r.deceleration;
        r.radius += r.speed;
        r.life -= 0.0018;
        r.opacity *= 0.9993;
        const progress = r.radius / r.maxRadius;

        if (r.life <= 0 || r.opacity < 0.008 || progress > 1.0) {
          ripples.splice(i, 1);
          continue;
        }

        const alpha = r.opacity * r.life;

        // Main ring
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(210, 45, 45, ${alpha * 0.65})`;
        ctx.lineWidth = r.lineWidth * r.life;
        ctx.stroke();

        // Inner echo
        if (progress < 0.6) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 0.75, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(240, 60, 55, ${alpha * 0.35 * (1 - progress)})`;
          ctx.lineWidth = r.lineWidth * 0.6 * r.life;
          ctx.stroke();
        }

        // Outer halo
        if (progress > 0.15 && progress < 0.85) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius * 1.2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(160, 25, 25, ${alpha * 0.18})`;
          ctx.lineWidth = r.lineWidth * 1.8 * r.life * (1 - progress);
          ctx.stroke();
        }
      }

      // Ambient glow
      if (rippleActive && mouseX > 0 && mouseY > 0) {
        const glow = ctx.createRadialGradient(mouseX, mouseY, 20, mouseX, mouseY, 280);
        glow.addColorStop(0, 'rgba(180, 30, 30, 0.045)');
        glow.addColorStop(0.3, 'rgba(150, 20, 20, 0.025)');
        glow.addColorStop(0.6, 'rgba(100, 10, 10, 0.008)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, rippleCanvas.width, rippleCanvas.height);
      }

      animId = requestAnimationFrame(animate);
    }

    function handleMouseMove(e) {
      if (!rippleActive) return;
      const pos = getCanvasPos(e);
      mouseX = pos.x;
      mouseY = pos.y;
      const now = performance.now();
      if (now - lastSpawnTime > SPAWN_COOLDOWN) {
        spawnRippleCluster(pos.x, pos.y);
        lastSpawnTime = now;
      }
    }

    function handleMouseLeave() {
      mouseX = -999;
      mouseY = -999;
    }

    function handleMouseEnter() {
      lastSpawnTime = performance.now();
    }

    // Only active when hero is visible
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          rippleActive = true;
          if (!animId) {
            resizeCanvas();
            animId = requestAnimationFrame(animate);
          }
        } else {
          rippleActive = false;
          ripples = [];
          mouseX = -999;
          mouseY = -999;
        }
      });
    }, { threshold: 0.2 });

    heroObserver.observe(heroSection);

    // Entire hero section is interactive
    heroSection.addEventListener('mousemove', handleMouseMove);
    heroSection.addEventListener('mouseenter', handleMouseEnter);
    heroSection.addEventListener('mouseleave', handleMouseLeave);

    heroSection.addEventListener('touchmove', (e) => {
      if (!rippleActive) return;
      const pos = getCanvasPos(e.touches[0]);
      mouseX = pos.x;
      mouseY = pos.y;
      const now = performance.now();
      if (now - lastSpawnTime > SPAWN_COOLDOWN) {
        spawnRippleCluster(pos.x, pos.y);
        lastSpawnTime = now;
      }
    }, { passive: true });

    heroSection.addEventListener('touchend', () => {
      mouseX = -999;
      mouseY = -999;
    });

    window.addEventListener('resize', () => {
      if (rippleActive || animId) resizeCanvas();
    });

    resizeCanvas();
    animId = requestAnimationFrame(animate);
  }

  /* ---------- MEMBER JOIN ---------- */
  const joinBtn = document.querySelector('.member-join-btn');
  if (joinBtn) {
    // Store used IDs to avoid duplicates (session only)
    const usedIds = new Set();

    function generateUniqueId() {
      let id;
      do {
        id = 'FS' + String(Math.floor(1000 + Math.random() * 9000));
      } while (usedIds.has(id));
      usedIds.add(id);
      return id;
    }

    joinBtn.addEventListener('click', () => {
      const id = generateUniqueId();
      navigator.clipboard.writeText(id).then(() => {
        // Also try fallback
      }).catch(() => {});

      // Create in-page notification
      const notice = document.createElement('div');
      notice.className = 'member-notice';
      notice.innerHTML = `
        <div class="member-notice-card">
          <span class="notice-close">&times;</span>
          <div class="notice-icon">◆</div>
          <h3>股东身份确认</h3>
          <p class="notice-id-label">你的股东 ID</p>
          <p class="notice-id">${id}</p>
          <p class="notice-tip">已自动复制到剪贴板<br>请妥善保存，此 ID 是你的股东证明<br>参与专属购买活动时需出示<br>积分将存入此 ID 名下</p>
        </div>
      `;
      document.body.appendChild(notice);

      // Close handlers
      const closeBtn = notice.querySelector('.notice-close');
      closeBtn.addEventListener('click', () => notice.remove());
      notice.addEventListener('click', (e) => {
        if (e.target === notice) notice.remove();
      });

      // Auto-remove after 30s
      setTimeout(() => {
        if (notice.parentNode) notice.remove();
      }, 30000);
    });
  }

  /* ---------- LUCKY BAG REVEAL ---------- */
  const luckybagBtn = document.getElementById('luckybagBtn');
  const luckybagOverlay = document.getElementById('luckybagOverlay');
  const luckybagOverlayClose = document.getElementById('luckybagOverlayClose');
  if (luckybagBtn && luckybagOverlay) {
    luckybagBtn.addEventListener('click', () => {
      luckybagOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
    luckybagOverlayClose.addEventListener('click', () => {
      luckybagOverlay.classList.remove('active');
      document.body.style.overflow = '';
    });
    luckybagOverlay.addEventListener('click', (e) => {
      if (e.target === luckybagOverlay) {
        luckybagOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- WEIXIN COPY ---------- */
  const weixinBtn = document.getElementById('weixinBtn');
  if (weixinBtn) {
    weixinBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const wxId = 'hyp1213016856';
      navigator.clipboard.writeText(wxId).then(() => {
        weixinBtn.setAttribute('data-tip', '已复制 ✓');
        setTimeout(() => {
          weixinBtn.setAttribute('data-tip', wxId);
        }, 1500);
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = wxId;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        weixinBtn.setAttribute('data-tip', '已复制 ✓');
        setTimeout(() => {
          weixinBtn.setAttribute('data-tip', wxId);
        }, 1500);
      });
    });
  }

})();
