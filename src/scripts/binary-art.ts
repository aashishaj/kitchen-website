// Canvas renderer for binary food art. Each `.art[data-src]` element gets one
// canvas: digits are pre-rendered per palette color into an offscreen atlas and
// stamped with drawImage. Colors come from CSS tokens, so a theme switch only
// recolors; the image itself never changes.

type Art = {
  cols: number;
  rows: number;
  tokens: string[];
  c: string;
  k: string;
  o: string;
  e: string;
};

type Cell = {
  x: number; // grid position
  y: number;
  ch: number; // 0 or 1
  tok: number;
  alpha: number;
  edge: boolean;
  sx: number; // load-in start offset (px)
  sy: number;
  ox: number; // hover offset (px)
  oy: number;
};

type Bit = { x: number; y: number; age: number; life: number; ch: number; drift: number; phase: number };

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const FPS = 30;
const LOAD_MS = 1200;
const PUSH_RADIUS = 60;
const STEAM_ROWS = 14;

const cache = new Map<string, Promise<Art>>();
function load(src: string) {
  if (!cache.has(src)) cache.set(src, fetch(src).then((r) => r.json()));
  return cache.get(src)!;
}

function tokenColors(el: HTMLElement, tokens: string[]) {
  const css = getComputedStyle(el);
  return tokens.map((t) => (css.getPropertyValue(`--art-${t}`) || css.getPropertyValue(`--${t}`)).trim() || '#888');
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

class BinaryArt {
  el: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  status: HTMLElement | null;
  art!: Art;
  cells: Cell[] = [];
  bits: Bit[] = [];
  steam: boolean;
  atlas!: HTMLCanvasElement;
  colors: string[] = [];
  cw = 8; // cell width / height in css px
  ch = 13;
  dpr = 1;
  top = 0; // extra rows above the image for steam
  visible = false;
  started = 0; // load-in start time, 0 = not yet
  last = 0;
  raf = 0;
  pointer: { x: number; y: number } | null = null;
  flipDebt = 0;

  constructor(el: HTMLElement) {
    this.el = el;
    this.canvas = el.querySelector('canvas')!;
    this.ctx = this.canvas.getContext('2d')!;
    this.status = el.querySelector('.art-status');
    this.steam = el.dataset.steam !== undefined;
    this.top = this.steam ? STEAM_ROWS : 0;
    this.init(el.dataset.src!);
  }

  async init(src: string) {
    this.art = await load(src);
    const { cols, rows, c, k, o, e } = this.art;
    for (let i = 0; i < cols * rows; i++) {
      if (c[i] === ' ') continue;
      const edge = e[i] === '1';
      this.cells.push({
        x: i % cols,
        y: Math.floor(i / cols) + this.top,
        ch: c[i] === '1' ? 1 : 0,
        tok: +k[i],
        alpha: edge ? 1 : 0.35 + (+o[i] / 9) * 0.55,
        edge,
        sx: 0, sy: 0, ox: 0, oy: 0,
      });
    }
    this.layout();
    new ResizeObserver(() => this.layout()).observe(this.el);
    new MutationObserver(() => { this.buildAtlas(); this.draw(performance.now()); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) {
        if (!this.started) this.begin();
        this.loop();
      }
    }, { rootMargin: '80px' }).observe(this.el);

    this.canvas.addEventListener('pointermove', (ev) => {
      const r = this.canvas.getBoundingClientRect();
      this.pointer = { x: ev.clientX - r.left, y: ev.clientY - r.top };
    });
    this.canvas.addEventListener('pointerleave', () => (this.pointer = null));
  }

  layout() {
    const { cols, rows } = this.art;
    const width = this.el.clientWidth;
    if (!width) return;
    this.cw = width / cols;
    this.ch = this.cw / 0.6;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    const h = (rows + this.top) * this.ch;
    this.canvas.width = Math.round(width * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.aspectRatio = `${width} / ${h}`;
    this.buildAtlas();
    this.draw(performance.now());
  }

  // One glyph per (token, digit), drawn once and stamped from then on.
  buildAtlas() {
    this.colors = tokenColors(this.el, this.art.tokens);
    const dark = this.el.closest('.dark') !== null ||
      (document.documentElement.dataset.theme === 'dark' && !this.el.closest('.light'));
    const gw = Math.ceil(this.cw * this.dpr) + 4;
    const gh = Math.ceil(this.ch * this.dpr) + 4;
    const atlas = document.createElement('canvas');
    atlas.width = gw * 2;
    atlas.height = gh * this.colors.length;
    const a = atlas.getContext('2d')!;
    a.textAlign = 'center';
    a.textBaseline = 'middle';
    a.font = `500 ${this.ch * 0.88 * this.dpr}px 'IBM Plex Mono', ui-monospace, monospace`;
    this.colors.forEach((color, t) => {
      a.fillStyle = color;
      if (dark) { a.shadowColor = color; a.shadowBlur = 3 * this.dpr; }
      ['0', '1'].forEach((d, i) => a.fillText(d, i * gw + gw / 2, t * gh + gh / 2));
    });
    this.atlas = atlas;
  }

  begin() {
    this.started = performance.now();
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;
    for (const c of this.cells) {
      c.sx = (Math.random() - 0.5) * w * 0.9;
      c.sy = (Math.random() - 0.5) * h * 0.9;
    }
    if (reduceMotion.matches) this.started = 1; // no load-in
    this.setStatus('brewing…');
  }

  setStatus(text: string) {
    if (this.status && this.status.textContent !== text) this.status.textContent = text;
  }

  loop = () => {
    cancelAnimationFrame(this.raf);
    if (!this.visible) return;
    if (reduceMotion.matches) { this.setStatus('served ✓'); this.draw(performance.now()); return; }
    const tick = (now: number) => {
      if (!this.visible) return;
      this.raf = requestAnimationFrame(tick);
      if (now - this.last < 1000 / FPS) return;
      const dt = this.last ? Math.min(now - this.last, 100) : 33;
      this.last = now;
      this.update(now, dt);
      this.draw(now);
    };
    this.raf = requestAnimationFrame(tick);
  };

  update(now: number, dt: number) {
    // Idle flicker: about 1.5% of cells flip each second. Edges stay put.
    this.flipDebt += this.cells.length * 0.015 * (dt / 1000);
    while (this.flipDebt >= 1) {
      const c = this.cells[(Math.random() * this.cells.length) | 0];
      if (!c.edge) c.ch ^= 1;
      this.flipDebt--;
    }

    // Hover: digits near the pointer push out and flip, then settle back.
    const p = this.pointer;
    for (const c of this.cells) {
      let tx = 0, ty = 0;
      if (p) {
        const cx = (c.x + 0.5) * this.cw, cy = (c.y + 0.5) * this.ch;
        const dx = cx - p.x, dy = cy - p.y;
        const d = Math.hypot(dx, dy);
        if (d < PUSH_RADIUS && d > 0.01) {
          const f = (1 - d / PUSH_RADIUS) * 14;
          tx = (dx / d) * f; ty = (dy / d) * f;
          if (Math.random() < 0.05) c.ch ^= 1;
        }
      }
      c.ox += (tx - c.ox) * 0.18;
      c.oy += (ty - c.oy) * 0.18;
    }

    if (this.steam) this.updateSteam(dt);
    if (now - this.started > LOAD_MS) this.setStatus('served ✓');
  }

  // Steam: small columns of bits rise from the cup, sway, fade and loop.
  steamSources() {
    // Mug rim spans roughly the left 20%..60% of the grid in the hero source.
    return [0.27, 0.4, 0.53].map((f) => f * this.art.cols);
  }

  updateSteam(dt: number) {
    const sources = this.steamSources();
    while (this.bits.length < 36) {
      const sx = sources[(Math.random() * sources.length) | 0];
      this.bits.push({
        x: sx + (Math.random() - 0.5) * 2,
        y: this.top + 1 + Math.random(),
        age: Math.random() * 2000,
        life: 2600 + Math.random() * 1800,
        ch: Math.random() < 0.6 ? 1 : 0,
        drift: (Math.random() - 0.5) * 0.6,
        phase: Math.random() * Math.PI * 2,
      });
    }
    for (const b of this.bits) {
      b.age += dt;
      b.y -= dt * 0.0045;
      if (Math.random() < 0.01) b.ch ^= 1;
    }
    this.bits = this.bits.filter((b) => b.age < b.life && b.y > 0);
  }

  frozenSteam() {
    if (this.bits.length) return;
    const sources = this.steamSources();
    for (let i = 0; i < 30; i++) {
      this.bits.push({
        x: sources[i % 3], y: this.top - (i / 3) * 1.2, age: 1200, life: 3000,
        ch: i % 2, drift: 0.3, phase: i,
      });
    }
  }

  draw(now: number) {
    if (!this.atlas || !this.art) return;
    const { ctx, cw, ch, dpr } = this;
    const gw = Math.ceil(cw * dpr) + 4;
    const gh = Math.ceil(ch * dpr) + 4;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const static_ = reduceMotion.matches;
    if (!this.started && !static_) return; // nothing until it scrolls into view
    const t = static_ ? 1 : Math.min(1, (now - this.started) / LOAD_MS);
    const k = 1 - easeOut(t);
    const settling = k > 0.001;

    for (const c of this.cells) {
      const digit = settling && Math.random() < k ? (Math.random() < 0.5 ? 0 : 1) : c.ch;
      const x = c.x * cw + c.sx * k + c.ox;
      const y = c.y * ch + c.sy * k + c.oy;
      ctx.globalAlpha = c.alpha * (0.4 + 0.6 * (1 - k));
      ctx.drawImage(this.atlas, digit * gw, c.tok * gh, gw, gh, (x * dpr) - 2, (y * dpr) - 2, gw, gh);
    }

    if (this.steam) {
      if (static_) this.frozenSteam();
      const sky = this.art.tokens.indexOf('sky');
      for (const b of this.bits) {
        const life = b.age / b.life;
        const sway = Math.sin(b.age / 500 + b.phase) * 1.2 + b.drift * life * 4;
        ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, life)) * 0.8 * (1 - k);
        ctx.drawImage(this.atlas, b.ch * gw, sky * gh, gw, gh,
          ((b.x + sway) * cw * dpr) - 2, (b.y * ch * dpr) - 2, gw, gh);
      }
    }
    ctx.globalAlpha = 1;
  }
}

function mount() {
  document.querySelectorAll<HTMLElement>('.art[data-src]').forEach((el) => {
    if (!el.dataset.mounted) {
      el.dataset.mounted = '1';
      new BinaryArt(el);
    }
  });
}

// Wait for the mono font so the glyph atlas uses it.
document.fonts?.ready.then(mount) ?? mount();
