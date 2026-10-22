/* BinaryArt: kitchen and food subjects drawn out of 0s and 1s.
 *
 * Usage: <canvas class="binary" data-art="mug" role="img" aria-label="…"></canvas>
 *        optional sibling <figcaption class="art-label"> gets "brewing…" then "served ✓".
 *
 * Each subject is painted once onto a hidden canvas (palette token in the red channel,
 * brightness in green), sampled into a grid of cells, then stamped from a glyph atlas.
 * Colors come from CSS custom properties (--art-ink, --art-coral, …) on the canvas, so a
 * theme switch only re-colors; the image is never re-generated.
 */
(() => {
  const TOKENS = ['ink', 'sky', 'field', 'coral', 'cloud', 'tree'];
  const TAU = Math.PI * 2;
  const SAMPLE = 0.5; // offscreen paint resolution vs CSS px
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const STILL = new URLSearchParams(window.location.search).has('still');

  /* ---------- paint helpers (subjects draw in a 100-unit tall box) ---------- */
  const use = (c, token, b) => {
    const v = `rgb(${TOKENS.indexOf(token) * 40 + 20},${Math.round(b * 255)},0)`;
    c.fillStyle = v;
    c.strokeStyle = v;
  };
  const ell = (c, x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fill(); };
  const circ = (c, x, y, r) => ell(c, x, y, r, r);
  const rect = (c, x, y, w, h, r = 0) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };

  /* ---------- subjects ---------- */
  const SUBJECTS = {
    // Hero: a steaming coffee mug on a saucer.
    mug: {
      aspect: 1,
      steam: { x0: 34, x1: 62, y: 38, token: 'cloud' },
      draw(c) {
        use(c, 'cloud', 0.9);
        c.lineWidth = 4.5; c.lineCap = 'round';
        for (const x of [37, 49, 61]) {
          c.beginPath(); c.moveTo(x, 37);
          c.bezierCurveTo(x - 7, 30, x + 7, 23, x, 16);
          c.bezierCurveTo(x - 6, 10, x + 5, 6, x + 1, 2);
          c.stroke();
        }
        use(c, 'sky', 0.7); ell(c, 50, 88, 42, 7);
        use(c, 'coral', 0.72); rect(c, 26, 44, 44, 44, 7);
        c.lineWidth = 6; c.beginPath(); c.arc(70, 64, 11, -1.3, 1.3); c.stroke();
        use(c, 'coral', 0.45); rect(c, 58, 47, 11, 39, 4);
        use(c, 'coral', 1); rect(c, 31, 52, 5, 28, 2);
        use(c, 'ink', 0.85); ell(c, 48, 44, 22, 4.5);
      },
    },

    // How it works, pick: a bowl of fruit.
    bowl: {
      aspect: 1,
      draw(c) {
        use(c, 'coral', 0.5); circ(c, 50, 38, 9);
        use(c, 'field', 0.62); circ(c, 62, 46, 12);
        use(c, 'field', 1); circ(c, 58, 41, 2.6);
        use(c, 'coral', 0.72); circ(c, 37, 48, 13);
        use(c, 'coral', 1); circ(c, 33, 43, 3.2);
        use(c, 'tree', 0.7);
        for (const [x, y] of [[70, 52], [76, 50], [73, 56], [79, 56], [67, 57], [76, 61]]) circ(c, x, y, 4);
        use(c, 'ink', 0.8); c.lineWidth = 2; c.lineCap = 'round';
        c.beginPath(); c.moveTo(62, 34); c.lineTo(64, 27); c.stroke();
        use(c, 'field', 0.8); ell(c, 69, 28, 6, 2.6, -0.5);
        use(c, 'sky', 0.6); c.beginPath(); c.ellipse(50, 58, 40, 30, 0, 0, Math.PI); c.fill();
        use(c, 'sky', 0.88); ell(c, 50, 58, 40, 3.5);
        use(c, 'sky', 0.4); rect(c, 40, 86, 20, 5, 2);
      },
    },

    // How it works, prep: a knife and a chopping board.
    board: {
      aspect: 1.2,
      draw(c) {
        use(c, 'coral', 0.45); rect(c, 10, 44, 92, 42, 8); rect(c, 98, 56, 16, 18, 7);
        c.globalCompositeOperation = 'destination-out'; circ(c, 108, 65, 3.5);
        c.globalCompositeOperation = 'source-over';
        use(c, 'coral', 0.3); rect(c, 14, 80, 84, 5, 2);
        use(c, 'field', 0.72);
        for (const [x, y] of [[28, 60], [37, 67], [25, 71], [43, 58], [33, 53]]) circ(c, x, y, 4.4);
        use(c, 'field', 1); circ(c, 27, 59, 1.4); circ(c, 42, 57, 1.4);
        use(c, 'coral', 0.85); circ(c, 64, 70, 6.5); circ(c, 77, 66, 5.5);
        use(c, 'coral', 0.55); circ(c, 64, 70, 3); circ(c, 77, 66, 2.5);
        c.save(); c.translate(64, 30); c.rotate(-0.16);
        use(c, 'sky', 0.8);
        c.beginPath(); c.moveTo(-46, 4); c.quadraticCurveTo(-38, -7, -20, -7);
        c.lineTo(26, -7); c.lineTo(26, 5); c.closePath(); c.fill();
        use(c, 'sky', 1); rect(c, -28, -7, 52, 2.2, 1);
        use(c, 'ink', 0.72); rect(c, 26, -5.5, 28, 10, 4);
        c.restore();
      },
    },

    // How it works, serve: a plated dish from above.
    plate: {
      aspect: 1.3,
      draw(c) { drawPlate(c, true); },
    },

    // 404: an empty plate with a few crumbs.
    emptyPlate: {
      aspect: 1.3,
      draw(c) {
        drawPlate(c, false);
        use(c, 'coral', 0.8);
        for (const [x, y, r] of [[56, 44, 1.8], [72, 58, 1.4], [61, 61, 2.2], [78, 46, 1.2], [50, 55, 1.2]]) circ(c, x, y, r);
        use(c, 'ink', 0.7); circ(c, 66, 50, 1.2); circ(c, 54, 63, 1);
      },
    },

    // Who's at the table: a long table with four plates, from above.
    table: {
      aspect: 2,
      draw(c) {
        use(c, 'ink', 0.32);
        for (const x of [52, 132]) { rect(c, x, 7, 16, 10, 3); rect(c, x, 83, 16, 10, 3); }
        use(c, 'coral', 0.4); rect(c, 12, 22, 176, 56, 10);
        for (const [x, y] of [[60, 37], [140, 37], [60, 63], [140, 63]]) {
          use(c, 'sky', 0.55); circ(c, x, y, 11);
          use(c, 'sky', 0.85); circ(c, x, y, 7.5);
          use(c, 'coral', 0.78); circ(c, x - 1.5, y, 3.8);
          use(c, 'field', 0.75); ell(c, x + 3, y - 2, 2.6, 1.6, 0.5);
          use(c, 'sky', 1); circ(c, x + (x < 100 ? -17 : 17), y + (y < 50 ? -5 : 5), 2.6);
        }
        use(c, 'field', 0.62); circ(c, 100, 50, 9);
        use(c, 'field', 1); circ(c, 97, 47, 2.4);
        use(c, 'coral', 0.9); circ(c, 103, 52, 2.4);
      },
    },

    // House rules: a jar with a sealed, locked lid.
    jar: {
      aspect: 1,
      draw(c) {
        use(c, 'sky', 0.45); rect(c, 28, 30, 44, 60, 9);
        use(c, 'coral', 0.7); rect(c, 32, 50, 36, 36, 6);
        use(c, 'coral', 0.95); rect(c, 36, 55, 4, 24, 2);
        use(c, 'sky', 0.95); rect(c, 32, 34, 3, 13, 1.5);
        use(c, 'ink', 0.75); rect(c, 26, 20, 48, 12, 3);
        use(c, 'ink', 0.45); rect(c, 26, 29, 48, 3, 1);
        use(c, 'ink', 0.9); rect(c, 43, 9, 14, 10, 2);
        c.lineWidth = 2.6; c.beginPath(); c.arc(50, 9, 4.6, Math.PI, 0); c.stroke();
      },
    },

    // Reserve a table: a dinner (service) bell.
    bell: {
      aspect: 1,
      draw(c) {
        use(c, 'sky', 0.55); ell(c, 50, 80, 40, 7);
        use(c, 'coral', 0.7); c.beginPath(); c.ellipse(50, 76, 30, 32, 0, Math.PI, TAU); c.fill();
        use(c, 'coral', 0.45);
        c.beginPath(); c.moveTo(50, 76); c.ellipse(50, 76, 30, 32, 0, 1.68 * Math.PI, TAU); c.closePath(); c.fill();
        use(c, 'coral', 1); c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.ellipse(50, 76, 22, 24, 0, 1.15 * Math.PI, 1.4 * Math.PI); c.stroke();
        use(c, 'coral', 0.58); rect(c, 18, 73, 64, 5, 2);
        use(c, 'ink', 0.7); rect(c, 47, 37, 6, 9, 2); circ(c, 50, 35, 5);
      },
    },
  };

  function drawPlate(c, withFood) {
    use(c, 'ink', 0.6);
    rect(c, 10, 30, 4, 50, 2); rect(c, 7.5, 16, 9, 16, 3);
    rect(c, 116, 16, 5, 64, 2.5);
    use(c, 'sky', 0.5); circ(c, 65, 50, 40);
    use(c, 'sky', 0.82); circ(c, 65, 50, 29);
    if (!withFood) return;
    use(c, 'coral', 0.72); ell(c, 58, 53, 14, 10, -0.3);
    use(c, 'coral', 1); ell(c, 54, 49, 5, 2.4, -0.3);
    use(c, 'field', 0.72); ell(c, 76, 44, 7, 3.5, 0.6); ell(c, 75, 57, 6, 3, -0.5); ell(c, 81, 50, 5, 3, 0);
    use(c, 'ink', 0.9);
    for (const [x, y] of [[50, 60], [62, 44], [66, 58], [55, 46]]) circ(c, x, y, 1.1);
  }

  /* ---------- renderer ---------- */
  class BinaryArt {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.subject = SUBJECTS[canvas.dataset.art];
      this.label = canvas.parentElement.querySelector('.art-label');
      this.mouse = { x: 0, y: 0, on: false };
      this.parts = [];
      this.spawn = 0;
      this.flickerAcc = 0;
      this.started = false;
      this.running = false;
      this.served = false;
      this.width = 0;

      canvas.addEventListener('pointermove', (e) => { this.mouse = { x: e.offsetX, y: e.offsetY, on: true }; });
      canvas.addEventListener('pointerdown', (e) => { this.mouse = { x: e.offsetX, y: e.offsetY, on: true }; });
      canvas.addEventListener('pointerleave', () => { this.mouse.on = false; });

      this.layout();
    }

    // ?still renders the finished art with no motion (used to capture og.png)
    get motion() { return !reduceMotion.matches && !STILL; }

    layout() {
      const r = this.canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      this.width = r.width;
      this.w = r.width; this.h = r.height;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(this.w * this.dpr);
      this.canvas.height = Math.round(this.h * this.dpr);

      // aim for ~72 columns so the subject reads, within 8–11px digits
      let fs = Math.round(Math.max(8, Math.min(11, this.w / (72 * 0.62))));
      const cellsFor = (f) => Math.floor(this.w / (f * 0.62)) * Math.floor(this.h / (f * 1.18));
      while (cellsFor(fs) > 12000) fs += 1;
      this.fs = fs; this.cw = fs * 0.62; this.ch = fs * 1.18;
      const cols = Math.floor(this.w / this.cw), rows = Math.floor(this.h / this.ch);
      // centre the grid
      this.gx = (this.w - cols * this.cw) / 2; this.gy = (this.h - rows * this.ch) / 2;

      // paint the subject offscreen
      const ow = Math.ceil(this.w * SAMPLE), oh = Math.ceil(this.h * SAMPLE);
      const off = document.createElement('canvas'); off.width = ow; off.height = oh;
      const oc = off.getContext('2d', { willReadFrequently: true });
      const a = this.subject.aspect || 1;
      const s = Math.min(ow / (100 * a), oh / 100) * 0.94;
      this.fit = { ox: (ow - 100 * a * s) / 2, oy: (oh - 100 * s) / 2, s };
      oc.setTransform(s, 0, 0, s, this.fit.ox, this.fit.oy);
      this.subject.draw(oc);
      const data = oc.getImageData(0, 0, ow, oh).data;

      // sample into cells
      const grid = new Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const px = Math.min(ow - 1, Math.floor((this.gx + (i + 0.5) * this.cw) * SAMPLE));
          const py = Math.min(oh - 1, Math.floor((this.gy + (j + 0.5) * this.ch) * SAMPLE));
          const k = (py * ow + px) * 4;
          if (data[k + 3] < 110) continue;
          const t = Math.max(0, Math.min(TOKENS.length - 1, Math.round((data[k] - 20) / 40)));
          grid[j * cols + i] = { t, b: data[k + 1] / 255 };
        }
      }

      this.cells = []; this.fill = [];
      const at = (i, j) => (i < 0 || j < 0 || i >= cols || j >= rows ? null : grid[j * cols + i]);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const g = at(i, j);
          const x = this.gx + i * this.cw, y = this.gy + j * this.ch;
          const start = { sx: Math.random() * this.w, sy: Math.random() * this.h, ox: 0, oy: 0 };
          if (!g) {
            // a few faint stray digits around the subject
            if (Math.random() < 0.005) this.cells.push({ x, y, t: 0, c: Math.random() < 0.5 ? 0 : 1, a: 0.16, ...start });
            continue;
          }
          const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([di, dj]) => {
            const n = at(i + di, j + dj); return !n || n.t !== g.t;
          });
          const cell = edge
            ? { x, y, t: g.t, c: 1, a: 1, ...start }
            : { x, y, t: g.t, c: Math.random() < 0.25 + g.b * 0.6 ? 1 : 0, a: g.b > 0.95 ? 1 : 0.45 + 0.5 * g.b, ...start };
          this.cells.push(cell);
          if (!edge) this.fill.push(cell);
        }
      }
      this.buildAtlas();
    }

    buildAtlas() {
      const cs = getComputedStyle(this.canvas);
      const dark = document.documentElement.dataset.theme === 'dark';
      const pad = dark ? 4 : 1;
      const dpr = this.dpr;
      const sw = Math.ceil((this.cw + pad * 2) * dpr), sh = Math.ceil((this.ch + pad * 2) * dpr);
      const c = document.createElement('canvas');
      c.width = sw * TOKENS.length * 2; c.height = sh;
      const g = c.getContext('2d');
      g.font = `500 ${this.fs * dpr}px "IBM Plex Mono", ui-monospace, monospace`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      TOKENS.forEach((t, i) => {
        const col = cs.getPropertyValue(`--art-${t}`).trim() || '#888';
        g.fillStyle = col;
        if (dark) { g.shadowColor = col; g.shadowBlur = 3 * dpr; } // a very soft glow, never neon
        for (const d of [0, 1]) g.fillText(String(d), (i * 2 + d) * sw + sw / 2, sh / 2 + 0.5 * dpr);
      });
      this.atlas = { c, sw, sh, pad, dw: sw / dpr, dh: sh / dpr };
    }

    stamp(t, d, x, y) {
      const A = this.atlas;
      this.ctx.drawImage(A.c, (t * 2 + d) * A.sw, 0, A.sw, A.sh, x - A.pad, y - A.pad, A.dw, A.dh);
    }

    setLabel(text) { if (this.label) this.label.textContent = text; }

    frame(now) {
      const { ctx, cw, ch } = this;
      if (!this.cells) return;
      const motion = this.motion;
      const dt = Math.min(64, now - (this.last || now)); this.last = now;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);

      const p = motion && this.t0 != null ? Math.min(1, (now - this.t0) / 1200) : 1;
      const e = 1 - Math.pow(1 - p, 3);
      if (p >= 1 && !this.served) { this.served = true; this.setLabel('served ✓'); }

      // idle flicker: ~1.5% of fill cells flip per second, the shape never changes
      if (motion && p >= 1 && this.fill.length) {
        this.flickerAcc += this.fill.length * 0.015 * dt / 1000;
        while (this.flickerAcc >= 1) { this.flickerAcc -= 1; this.fill[(Math.random() * this.fill.length) | 0].c ^= 1; }
      }

      const m = this.mouse, hover = motion && m.on;
      for (const k of this.cells) {
        let x = k.x, y = k.y, a = k.a, d = k.c;
        if (e < 1) {
          x = k.sx + (x - k.sx) * e; y = k.sy + (y - k.sy) * e; a *= 0.3 + 0.7 * e;
          if (Math.random() < (1 - e) * 0.3) d = Math.random() < 0.5 ? 0 : 1;
        }
        if (hover || k.ox || k.oy) {
          let tx = 0, ty = 0;
          if (hover) {
            const dx = k.x + cw / 2 - m.x, dy = k.y + ch / 2 - m.y, dist = Math.hypot(dx, dy);
            if (dist < 60 && dist > 0.01) {
              const f = (1 - dist / 60) * 12; tx = (dx / dist) * f; ty = (dy / dist) * f;
              if (Math.random() < 0.08) d ^= 1;
            }
          }
          k.ox += (tx - k.ox) * 0.16; k.oy += (ty - k.oy) * 0.16;
          if (!tx && !ty && Math.abs(k.ox) < 0.05 && Math.abs(k.oy) < 0.05) k.ox = k.oy = 0;
          x += k.ox; y += k.oy;
        }
        ctx.globalAlpha = a;
        this.stamp(k.t, d, x, y);
      }

      // steam: small columns of bits rise, drift sideways, fade and loop
      const st = this.subject.steam;
      if (st && motion && p > 0.6) {
        const { ox, oy, s } = this.fit;
        const tok = TOKENS.indexOf(st.token);
        this.spawn += dt;
        while (this.spawn > 110) {
          this.spawn -= 110;
          const u = st.x0 + Math.random() * (st.x1 - st.x0);
          this.parts.push({
            x: (ox + u * s) / SAMPLE, y: (oy + st.y * s) / SAMPLE,
            vy: 0.02 + Math.random() * 0.02, ph: Math.random() * TAU,
            life: 0, max: 2400 + Math.random() * 1800, d: Math.random() < 0.6 ? 1 : 0,
          });
        }
        this.parts = this.parts.filter((q) => (q.life += dt) < q.max);
        for (const q of this.parts) {
          q.y -= q.vy * dt;
          q.x += Math.sin(q.ph + q.life / 520) * 0.02 * dt;
          if (Math.random() < 0.01) q.d ^= 1;
          ctx.globalAlpha = Math.sin((Math.PI * q.life) / q.max) * 0.75;
          this.stamp(tok, q.d, q.x, q.y);
        }
      }
      ctx.globalAlpha = 1;
    }

    start() {
      if (this.running) return;
      if (!this.started) {
        this.started = true;
        if (this.motion) { this.t0 = performance.now(); this.setLabel('brewing…'); }
      }
      if (!this.motion) { this.frame(performance.now()); return; }
      this.running = true;
      let lastPaint = 0;
      const loop = (now) => {
        if (!this.running) return;
        if (now - lastPaint >= 33) { lastPaint = now; this.frame(now); } // ~30fps
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    stop() { this.running = false; cancelAnimationFrame(this.raf); this.last = null; }

    recolor() { this.buildAtlas(); if (!this.running) this.frame(performance.now()); }
  }

  /* ---------- boot ---------- */
  function boot() {
    const arts = [...document.querySelectorAll('canvas.binary')]
      .filter((c) => SUBJECTS[c.dataset.art])
      .map((c) => new BinaryArt(c));

    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        const art = arts.find((a) => a.canvas === en.target);
        if (en.isIntersecting) art.start(); else art.stop();
      }
    }, { threshold: 0.15 });
    arts.forEach((a) => io.observe(a.canvas));

    new MutationObserver(() => arts.forEach((a) => a.recolor()))
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const ro = new ResizeObserver((entries) => {
      for (const en of entries) {
        const art = arts.find((a) => a.canvas === en.target);
        if (Math.abs(en.contentRect.width - art.width) > 1) { art.layout(); if (!art.running) art.frame(performance.now()); }
      }
    });
    arts.forEach((a) => ro.observe(a.canvas));
  }

  const fontsReady = document.fonts ? document.fonts.load('500 11px "IBM Plex Mono"').catch(() => {}) : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1500))]).then(boot);
})();
