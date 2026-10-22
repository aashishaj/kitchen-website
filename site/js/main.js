/* Kitchen landing page: theme + story/tech toggles, landscapes, status chip, waitlist. */

const CONFIG = {
  // Calendar booking page for every "book a demo" link.
  demoUrl: '#chefs-table',
};

// Code that grows in the field rows of every landscape.
const FIELD_ROWS = [
  { size: 17, op: 0.95, dur: 140, text: 'python3 -m pip install -r requirements.txt  ·  export OPENAI_API_KEY=sk-•••••  ·  git clone github.com/you/app && cd app  ·  ' },
  { size: 12, op: 0.7, dur: 190, text: 'npm install --silent # soaking…  ·  ✓ served on localhost:3000  ·  cp .env.example .env # keys sorted  ·  ' },
  { size: 14, op: 0.85, dur: 165, text: 'kitchen share --team # one click  ·  psql -c "create database app" # frying…  ·  docker compose up -d # simmering…  ·  ' },
  { size: 12, op: 0.6, dur: 210, text: 'brew install postgres  ·  export DATABASE_URL=postgres://localhost/app  ·  pnpm dev  ·  ✓ served  ·  ' },
];

const STATUS_WORDS = ['brewing…', 'soaking…', 'frying…', 'simmering…', 'served ✓'];

/* Analytics: pushes to dataLayer, so any tag manager / analytics tool can pick it up. */
function track(event, props = {}) {
  (window.dataLayer = window.dataLayer || []).push({ event, ...props });
}

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

/* ---------- theme: follows the system until the visitor picks one ---------- */
const sysDark = window.matchMedia('(prefers-color-scheme: dark)');
function setTheme(theme, remember) {
  root.dataset.theme = theme;
  document.querySelectorAll('[data-theme-name]').forEach((el) => { el.textContent = theme; });
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.setAttribute('aria-label', `theme: ${theme}. switch to ${theme === 'dark' ? 'light' : 'dark'}`);
  if (remember) { store.set('kitchen-theme', theme); root.dataset.themeLocked = '1'; }
}
setTheme(root.dataset.theme || (sysDark.matches ? 'dark' : 'light'));
sysDark.addEventListener('change', (e) => { if (!root.dataset.themeLocked) setTheme(e.matches ? 'dark' : 'light'); });
document.getElementById('theme-toggle')?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(next, true);
  track('theme_toggle', { theme: next });
});

/* ---------- story / tech: same layout, different words ---------- */
function setMode(mode, remember) {
  root.dataset.mode = mode;
  document.querySelectorAll('[data-mode-btn]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.modeBtn === mode)));
  if (remember) store.set('kitchen-mode', mode);
}
setMode(root.dataset.mode || 'story');
document.querySelectorAll('[data-mode-btn]').forEach((b) => b.addEventListener('click', () => {
  if (root.dataset.mode === b.dataset.modeBtn) return;
  setMode(b.dataset.modeBtn, true);
  track('mode_toggle', { mode: b.dataset.modeBtn });
}));

/* ---------- printed landscapes ---------- */
const tpl = document.getElementById('landscape-tpl');
document.querySelectorAll('[data-landscape]').forEach((slot) => {
  if (!tpl) return;
  slot.append(tpl.content.cloneNode(true));
  const field = slot.querySelector('.field');
  FIELD_ROWS.forEach((r, i) => {
    const row = document.createElement('div');
    row.className = `code-row${i % 2 ? ' rev' : ''}`;
    row.style.cssText = `--dur:${r.dur}s;font-size:${r.size}px;opacity:${r.op}`;
    for (let n = 0; n < 2; n++) {
      const span = document.createElement('span');
      span.textContent = r.text.repeat(3);
      row.append(span);
    }
    field.append(row);
  });
});

/* ---------- night sky: * stars, placed the same way every visit ---------- */
document.querySelectorAll('[data-night] .night').forEach((layer, li) => {
  let seed = 11 + li * 97;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = layer.dataset.stars ? Number(layer.dataset.stars) : 30;
  const minX = Number(layer.dataset.starsFrom || 0); // keep stars clear of text on the left
  for (let i = 0; i < stars; i++) {
    const s = document.createElement('span');
    s.className = `star${rnd() < 0.3 ? ' twinkle' : ''}`;
    s.textContent = rnd() < 0.75 ? '*' : '·';
    s.style.cssText = `left:${(minX + rnd() * (100 - minX)).toFixed(1)}%;top:${(rnd() * 62).toFixed(1)}%;font-size:${(9 + rnd() * 8).toFixed(0)}px;--o:${(0.45 + rnd() * 0.5).toFixed(2)};animation-delay:${(rnd() * -6).toFixed(1)}s`;
    layer.append(s);
  }
});

/* ---------- nav sits in the sky, turns paper once you scroll ---------- */
const nav = document.getElementById('nav');
const hero = document.getElementById('top');
if (nav && hero) {
  const navBar = nav.querySelector('.nav-inner');
  const onScroll = () => nav.classList.toggle('solid', window.scrollY > hero.offsetHeight - navBar.offsetHeight - 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---------- course strip: highlight the course you're reading ---------- */
const courseLinks = [...document.querySelectorAll('[data-course]')];
if (courseLinks.length) {
  const strip = courseLinks[0].parentElement;
  const byId = new Map(courseLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const setCurrent = (link) => {
    courseLinks.forEach((a) => a.setAttribute('aria-current', String(a === link)));
    if (link && strip.scrollWidth > strip.clientWidth) {
      // keep the active course visible on the phone strip without moving the page
      strip.scrollTo({ left: link.offsetLeft - strip.clientWidth / 2 + link.offsetWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  };
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setCurrent(byId.get(en.target.id)); });
  }, { rootMargin: '-40% 0px -55% 0px' });
  byId.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  courseLinks.forEach((a) => a.addEventListener('click', () => track('course_click', { course: a.textContent })));
}

/* ---------- status chip cycles kitchen words ---------- */
const chips = document.querySelectorAll('[data-status-chip]');
if (chips.length && !reduceMotion) {
  let i = 0;
  setInterval(() => {
    i = (i + 1) % STATUS_WORDS.length;
    chips.forEach((c) => { c.textContent = STATUS_WORDS[i]; });
  }, 1900);
}

/* ---------- book a demo ---------- */
document.querySelectorAll('[data-demo]').forEach((a) => {
  a.setAttribute('href', CONFIG.demoUrl);
  a.addEventListener('click', () => track('demo_click', { where: a.dataset.demo || 'unknown' }));
});
document.querySelectorAll('[data-track]').forEach((a) => a.addEventListener('click', () => track(a.dataset.track)));

/* ---------- waitlist (Netlify Forms) ---------- */
const ROLES = ['lawyer', 'finance', 'ops', 'developer', 'something else'];
const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

// Netlify Forms takes a urlencoded POST to any page. Locally there's no Netlify, so just pretend.
async function sendForm(fields) {
  if (isLocal) { console.info('[kitchen] would submit', fields); return; }
  const res = await fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
  if (!res.ok) throw new Error(String(res.status));
}

function askRole(form, email) {
  const box = document.createElement('div');
  box.className = 'waitlist-role';
  box.innerHTML = '<p class="label">// one question: what do you do?</p>';
  const row = document.createElement('div');
  row.className = 'role-chips';
  ROLES.forEach((role) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pill'; b.textContent = role;
    b.addEventListener('click', async () => {
      row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
      b.setAttribute('aria-pressed', 'true');
      try { await sendForm({ 'form-name': 'waitlist-role', email, role }); } catch { /* the signup already landed */ }
      track('waitlist_role', { role });
      box.querySelector('.label').textContent = '// noted. thanks, see you at the table.';
    });
    row.append(b);
  });
  box.append(row);
  form.append(box);
}

document.querySelectorAll('form[data-waitlist]').forEach((form) => {
  const input = form.querySelector('input[type="email"]');
  const btn = form.querySelector('button[type="submit"]');
  const msg = form.querySelector('.waitlist-msg');
  const say = (text, ok) => { msg.textContent = text; msg.classList.toggle('ok', !!ok); };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = input.value.trim();
    if (!email || !input.checkValidity()) { say('that email looks half-baked. try again?'); input.focus(); return; }
    btn.disabled = true;
    say('brewing…');
    try {
      const fields = Object.fromEntries(new FormData(form));
      await sendForm({ ...fields, email });
      track('waitlist_signup', { source: form.dataset.waitlist, mode: root.dataset.mode });
      form.classList.add('done');
      say('✓ table reserved. we’ll ring the dinner bell when it’s ready.', true);
      askRole(form, email);
    } catch {
      say('that didn’t cook. give it another go?');
      btn.disabled = false;
    }
  });
});

document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
