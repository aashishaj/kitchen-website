// Small client-side behaviours: theme and story/tech toggles, nav on scroll,
// the cycling status chip, and the waitlist form.

declare global {
  interface Window { track: (name: string, props?: Record<string, unknown>) => void }
}

const root = document.documentElement;

function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* private mode */ }
}

// Theme: follows the system until the visitor picks one, then remembers it.
function syncTheme() {
  const dark = root.dataset.theme === 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.querySelector('[data-theme-label]')!.textContent = dark ? 'dark' : 'light';
    b.setAttribute('aria-pressed', String(dark));
  });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#14213A' : '#6FA3DC');
}
document.querySelectorAll('[data-theme-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    save('kitchen-theme', root.dataset.theme);
    window.track('theme_toggle', { theme: root.dataset.theme });
    syncTheme();
  }),
);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  try { if (localStorage.getItem('kitchen-theme')) return; } catch { /* ignore */ }
  root.dataset.theme = e.matches ? 'dark' : 'light';
  syncTheme();
});
syncTheme();

// Story / tech: same layout, different words. No reload.
function syncMode() {
  const tech = root.dataset.mode === 'tech';
  document.querySelectorAll<HTMLButtonElement>('[data-mode-toggle]').forEach((b) => {
    b.setAttribute('aria-pressed', String(tech));
    b.querySelectorAll('[data-mode-opt]').forEach((o) =>
      o.classList.toggle('on', (o as HTMLElement).dataset.modeOpt === root.dataset.mode));
  });
}
document.querySelectorAll('[data-mode-toggle]').forEach((b) =>
  b.addEventListener('click', () => {
    root.dataset.mode = root.dataset.mode === 'tech' ? 'story' : 'tech';
    save('kitchen-mode', root.dataset.mode);
    window.track('mode_toggle', { mode: root.dataset.mode });
    syncMode();
  }),
);
syncMode();

// Nav sits in the sky, then turns paper once you scroll.
const nav = document.querySelector('.nav');
const onScroll = () => nav?.classList.toggle('scrolled', window.scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Status chips cycle kitchen words.
const words = ['brewing…', 'soaking…', 'frying…', 'simmering…', 'served ✓'];
const chips = document.querySelectorAll<HTMLElement>('[data-status-chip]');
if (chips.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let i = 0;
  setInterval(() => {
    i = (i + 1) % words.length;
    chips.forEach((c) => (c.textContent = words[i]));
  }, 1800);
}

// Demo clicks are tracked; the link itself is a placeholder in content/site.ts.
document.querySelectorAll('[data-demo]').forEach((a) =>
  a.addEventListener('click', () => window.track('demo_click', { from: (a as HTMLElement).dataset.demo })),
);

// Waitlist: posts to Netlify Forms (or the endpoint set in content/site.ts)
// and shows a thank-you state without leaving the page.
document.querySelectorAll<HTMLFormElement>('form[data-waitlist]').forEach((form) => {
  const msg = form.querySelector<HTMLElement>('[data-form-msg]')!;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (data.get('bot-field')) return;
    form.classList.add('sending');
    try {
      const action = form.getAttribute('action') || '/';
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
      });
      // Locally there is no form backend; treat that as success so the flow can be seen.
      if (!res.ok && !['localhost', '127.0.0.1'].includes(location.hostname)) throw new Error(String(res.status));
      form.classList.add('done');
      msg.textContent = form.dataset.thanks!;
      window.track('waitlist_signup');
    } catch {
      msg.textContent = form.dataset.error!;
    } finally {
      form.classList.remove('sending');
    }
  });
});

export {};
