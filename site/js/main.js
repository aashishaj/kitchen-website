/* Kitchen landing page: theme, entrances, the recipe scroll story, and the seat form. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = /[?&]still\b/.test(location.search); // ?still keeps the hero on one dish, for scripts/make-og.sh
  if (still) doc.classList.add('still');
  var KB = window.KitchenBinary;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- theme: follows the system until you pick one, then remembers ---------- */

  var themeBtn = $('#theme-toggle');
  function applyTheme(t, save) {
    doc.dataset.theme = t;
    if (save) { try { localStorage.setItem('kitchen-theme', t); } catch (e) {} }
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#14213a' : '#faefe0');
    if (themeBtn) themeBtn.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    if (KB) requestAnimationFrame(KB.refresh);
  }
  applyTheme(doc.dataset.theme || 'light');
  if (themeBtn) themeBtn.addEventListener('click', function () { applyTheme(doc.dataset.theme === 'dark' ? 'light' : 'dark', true); });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem('kitchen-theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'dark' : 'light');
  });

  /* ---------- background field ---------- */

  if (KB && $('#field-base')) KB.field($('#field-base'), $('#field-glow'));

  /* ---------- hero headline: split into words that rise in ---------- */

  $$('[data-split]').forEach(function (el) {
    var i = 0;
    function words(text, parent) {
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { parent.appendChild(document.createTextNode(' ')); return; }
        var w = document.createElement('span'), wi = document.createElement('span');
        w.className = 'w';
        wi.className = 'wi';
        wi.style.setProperty('--i', i++);
        wi.textContent = part;
        w.appendChild(wi);
        parent.appendChild(w);
      });
    }
    var nodes = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    nodes.forEach(function (n) {
      if (n.nodeType === 3) words(n.textContent, el);
      else { var clone = n.cloneNode(false); words(n.textContent, clone); el.appendChild(clone); }
    });
  });

  function ready() { document.body.classList.add('loaded'); }
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]).then(ready);
  } else ready();

  /* ---------- nav: border, reading progress, current section ---------- */

  var nav = $('#nav'), bar = $('#progress');
  function onScroll() {
    var y = window.scrollY, max = doc.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', y > 8);
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    scrub();
    pickStep();
  }

  var navLinks = $$('.nav-links a');
  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) { a.classList.toggle('active', !!e.target.id && a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  // watch every section, so the highlight clears in the ones the nav doesn't list
  $$('main > section').forEach(function (s) { sectionIO.observe(s); });

  /* ---------- reveal on scroll ---------- */

  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealIO.unobserve(e.target);
      // once it has arrived, hovers shouldn't wait for the entrance stagger
      setTimeout(function () { e.target.style.transitionDelay = '0s'; }, 1400);
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  $$('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* ---------- "the catch": words light up as you read down ---------- */

  var scrubEl = $('[data-scrub]'), scrubWords = [];
  if (scrubEl) {
    var text = scrubEl.textContent.trim();
    scrubEl.textContent = '';
    text.split(/\s+/).forEach(function (w, i, all) {
      var s = document.createElement('span');
      s.className = 'sw';
      s.textContent = w;
      scrubEl.appendChild(s);
      if (i < all.length - 1) scrubEl.appendChild(document.createTextNode(' '));
      scrubWords.push(s);
    });
  }
  var litCount = -1;
  function scrub() {
    if (!scrubEl || reduce) return;
    var r = scrubEl.getBoundingClientRect(), vh = window.innerHeight;
    var p = (vh * 0.82 - r.top) / (r.height + vh * 0.3);
    var n = Math.round(Math.max(0, Math.min(1, p)) * scrubWords.length);
    if (n === litCount) return;
    litCount = n;
    scrubWords.forEach(function (w, i) { w.classList.toggle('lit', i < n); });
  }

  /* ---------- hero: today's special, cycling dishes ---------- */

  // the first four take turns on their own; the rest come out when you pick them from the menu strip
  var dishes = [
    { key: 'outline', scene: 'pasta', food: 'Pasta', app: 'A team wiki, from Outline', verb: 'brewing…' },
    { key: 'twenty', scene: 'ramen', food: 'Ramen', app: 'A sales CRM, from Twenty', verb: 'simmering…' },
    { key: 'plane', scene: 'salad', food: 'Salad', app: 'Project planning, from Plane', verb: 'tossing…' },
    { key: 'documenso', scene: 'cake', food: 'Cake', app: 'Contract signing, from Documenso', verb: 'baking…' },
    { key: 'listmonk', scene: 'coffee', food: 'Coffee', app: 'Newsletters, from Listmonk', verb: 'pouring…' },
    { key: 'appsmith', scene: 'pizza', food: 'Pizza', app: 'Internal dashboards, from Appsmith', verb: 'firing the oven…' },
    { key: 'tooljet', scene: 'sushi', food: 'Sushi', app: 'Admin panels, from ToolJet', verb: 'rolling…' },
    { key: 'espocrm', scene: 'burger', food: 'Burger', app: 'Customer records, from EspoCRM', verb: 'grilling…' }
  ];
  var CYCLE = 4;
  var DWELL = 5200;
  var dishEl = $('#dish'), heroCanvas = $('#hero-art');
  if (KB && heroCanvas) {
    var status = $('#dish-status'), statusText = $('span', status);
    var nameEl = $('.dish-name'), foodEl = $('#dish-food'), appEl = $('#dish-app');
    var dots = $$('.dish-dots button');
    var current = 0, timer = 0, startedAt = 0, remaining = DWELL, paused = false;
    dishEl.style.setProperty('--dwell', DWELL + 'ms');

    var hero = KB.create(heroCanvas, {
      font: 10,
      field: 0.09,
      onFirstView: function (art) { show(0, true); }
    });
    hero.onSettle = function () { status.classList.remove('cooking'); statusText.textContent = 'served ✓'; };

    function show(i, first, dwell) {
      current = i;
      var d = dishes[current];
      hero.setScene(d.scene, still);
      status.classList.add('cooking');
      statusText.textContent = d.verb;
      if (still) hero.onSettle();
      $$('.strip [data-dish]').forEach(function (b) { b.classList.toggle('is-cooking', b.dataset.dish === d.key); });
      dots.forEach(function (b, k) { b.setAttribute('aria-selected', k === current ? 'true' : 'false'); });
      if (!first) {
        foodEl.textContent = d.food;
        appEl.textContent = d.app;
        nameEl.classList.remove('swap');
        void nameEl.offsetWidth;
        nameEl.classList.add('swap');
      }
      schedule(dwell || DWELL);
    }
    function schedule(ms) {
      clearTimeout(timer);
      remaining = ms;
      startedAt = performance.now();
      if (!paused && !reduce && !still) timer = setTimeout(function () { show(current + 1 < CYCLE ? current + 1 : 0); }, ms);
    }
    dots.forEach(function (b, k) { b.addEventListener('click', function () { show(k); }); });

    // pick a dish: an app in the menu strip sends its dish to the hero
    $$('.strip [data-dish]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = dishes.findIndex(function (d) { return d.key === b.dataset.dish; });
        if (k < 0) return;
        var r = dishEl.getBoundingClientRect();
        var inView = r.top > -r.height * 0.3 && r.bottom < window.innerHeight + r.height * 0.3;
        if (!inView) dishEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        setTimeout(function () { show(k, false, DWELL * 2); }, inView || reduce ? 0 : 450);
      });
    });
    dishEl.addEventListener('mouseenter', function () {
      paused = true;
      clearTimeout(timer);
      remaining -= performance.now() - startedAt;
      dishEl.classList.add('paused');
    });
    dishEl.addEventListener('mouseleave', function () {
      paused = false;
      dishEl.classList.remove('paused');
      schedule(Math.max(400, remaining));
    });
  }

  /* ---------- the recipe: one sticky dish that changes as you read each step ---------- */

  var steps = $$('.step'), activeStep = -1, recipeArt = null;
  var recipeCanvas = $('#recipe-art');
  if (KB && recipeCanvas) {
    recipeArt = KB.create(recipeCanvas, {
      font: 11,
      field: 0.08,
      onFirstView: function (art) { if (activeStep < 0) setStep(0); }
    });
  }
  // the typed lines start empty and type themselves when their step comes up
  $$('.step .type').forEach(function (el) { if (!reduce) el.textContent = ''; });

  function typeOut(el) {
    var full = el.dataset.type || '';
    clearInterval(el._t);
    if (reduce) { el.textContent = full; return; }
    var i = 0;
    el.textContent = '';
    setTimeout(function () {
      el._t = setInterval(function () {
        el.textContent = full.slice(0, ++i);
        if (i >= full.length) clearInterval(el._t);
      }, full.length > 10 ? 34 : 140);
    }, 350);
  }

  function setStep(i) {
    if (i === activeStep || !steps[i]) return;
    activeStep = i;
    steps.forEach(function (s, k) { s.classList.toggle('is-active', k === i); });
    var s = steps[i];
    $$('.type', s).forEach(typeOut);
    if (recipeArt) recipeArt.setScene(s.dataset.scene);
    $('#step-num').textContent = '0' + (i + 1);
    $('#step-dish').textContent = s.dataset.dish;
    $('#recipe-bar').style.width = ((i + 1) / steps.length) * 100 + '%';
  }

  function pickStep() {
    if (!steps.length) return;
    var line = window.innerHeight * (window.innerWidth <= 860 ? 0.62 : 0.5), best = 0, bestD = Infinity;
    steps.forEach(function (s, k) {
      var r = s.getBoundingClientRect();
      var d = r.top > line ? r.top - line : (r.bottom < line ? line - r.bottom : 0);
      if (d < bestD) { bestD = d; best = k; }
    });
    var rr = steps[0].parentNode.getBoundingClientRect();
    if (rr.bottom > 0 && rr.top < window.innerHeight) setStep(best);
  }

  /* ---------- off the menu: a link gets pasted, the pot cooks it, a dish comes out ---------- */

  var om = $('#om');
  if (KB && om) {
    var omArt = KB.create($('#om-art'), { font: 10, field: 0.07 });
    var repoEl = $('#om-repo'), cookEl = $('#om-cook'), logRows = $$('#om-log li');
    var REPOS = [['your-team/handmade-crm', 'burger'], ['someone-brilliant/tiny-wiki', 'sushi'], ['you/the-app-you-found', 'pizza']];
    var omRun = 0, omVisible = false, omTimers = [];
    var later = function (ms, fn) { omTimers.push(setTimeout(fn, ms)); };

    var cookOnce = function () {
      omTimers.forEach(clearTimeout);
      omTimers = [];
      var pick = REPOS[omRun++ % REPOS.length], name = pick[0];
      omArt.setScene('plate');
      repoEl.textContent = '';
      logRows.forEach(function (li) { li.classList.remove('on', 'done'); });
      if (reduce) {
        repoEl.textContent = name;
        logRows.forEach(function (li) { li.classList.add('on', 'done'); });
        omArt.setScene(pick[1], true);
        return;
      }
      for (var i = 1; i <= name.length; i++) (function (n) { later(500 + n * 45, function () { repoEl.textContent = name.slice(0, n); }); })(i);
      var t = 600 + name.length * 45;
      later(t, function () { cookEl.classList.add('pressed'); });
      later(t + 260, function () { cookEl.classList.remove('pressed'); omArt.setScene('pot'); logRows[0].classList.add('on'); });
      later(t + 1300, function () { logRows[0].classList.add('done'); logRows[1].classList.add('on'); });
      later(t + 2500, function () { logRows[1].classList.add('done'); logRows[2].classList.add('on'); omArt.setScene(pick[1]); });
      later(t + 3600, function () { logRows[2].classList.add('done'); });
      later(t + 7200, function () { if (omVisible) cookOnce(); });
    };
    new IntersectionObserver(function (entries) {
      var v = entries[0].isIntersecting;
      if (v && !omVisible) cookOnce();
      if (!v) { omTimers.forEach(clearTimeout); omTimers = []; }
      omVisible = v;
    }, { threshold: 0.35 }).observe(om);
  }

  /* ---------- receipt counters ---------- */

  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      $$('[data-count]', e.target).forEach(function (el, k) {
        var to = +el.dataset.count;
        if (reduce) { el.textContent = to; return; }
        var t0 = performance.now() + k * 180;
        (function step(now) {
          var p = Math.max(0, Math.min(1, (now - t0) / 1100));
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    });
  }, { threshold: 0.4 });
  var receipt = $('.receipt');
  if (receipt) countIO.observe(receipt);

  /* ---------- seats: tiers, form, thank-you ---------- */

  var form = $('#join-form'), thanks = $('#thanks');
  var LABELS = { waitlist: 'Join the waitlist', team: 'Request early access', partner: 'Apply as a design partner' };
  var THANKS = {
    waitlist: ["You're on the list.", "We'll ring the dinner bell the moment there's a seat for you."],
    team: ['Table request received.', "One of us will email you to find a time. Bring the tool you've been putting off."],
    partner: ["Welcome to the chef's table.", "Both of us read every one of these. Expect a note from a founder, not a robot."]
  };

  function choose(kind, scroll) {
    var radio = form && form.querySelector('input[name="kind"][value="' + kind + '"]');
    if (!radio) return;
    radio.checked = true;
    syncForm();
    if (scroll) {
      $('.booking').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      setTimeout(function () { form.email.focus({ preventScroll: true }); }, reduce ? 0 : 700);
    }
  }
  function syncForm() {
    var kind = form.kind.value;
    $('#submit-label').textContent = LABELS[kind];
    $$('[data-for]', form).forEach(function (el) { el.hidden = el.dataset.for.split(' ').indexOf(kind) < 0; });
    $$('.tier').forEach(function (t) { t.classList.toggle('is-chosen', t.dataset.tier === kind); });
  }

  if (form) {
    syncForm();
    $$('input[name="kind"]', form).forEach(function (r) { r.addEventListener('change', syncForm); });
    $$('[data-choose]').forEach(function (b) { b.addEventListener('click', function () { choose(b.dataset.choose, true); }); });
    $$('[data-choice-link]').forEach(function (a) { a.addEventListener('click', function () { choose(a.dataset.choiceLink, false); }); });

    var err = $('#form-error'), submit = $('#submit');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        err.textContent = email ? "That email doesn't look quite right." : 'We just need an email to save your seat.';
        form.email.focus();
        form.classList.remove('shake');
        void form.offsetWidth;
        form.classList.add('shake');
        return;
      }
      err.textContent = '';
      var kind = form.kind.value;
      submit.disabled = true;
      $('#submit-label').textContent = 'cooking…';
      // Preview build: nothing is sent. Hook the real waitlist tool in here.
      setTimeout(function () {
        $('#thanks-title').textContent = THANKS[kind][0];
        $('#thanks-text').textContent = THANKS[kind][1];
        form.hidden = true;
        thanks.hidden = false;
        thanks.focus();
        submit.disabled = false;
      }, reduce ? 0 : 900);
    });
    $('#again').addEventListener('click', function () {
      form.reset();
      syncForm();
      thanks.hidden = true;
      form.hidden = false;
      form.email.focus();
    });
  }

  /* ---------- the dinner bell and the footer wordmark ---------- */

  if (KB && $('#bell-art')) {
    KB.create($('#bell-art'), { font: 9, field: 0.06, onFirstView: function (a) { a.setScene('bell'); } });
  }
  if (KB && $('#wordmark-art')) {
    KB.create($('#wordmark-art'), {
      font: 8,
      small: 5.5,
      field: 0.06,
      onFirstView: function (a) {
        var go = function () { a.setScene(KB.textScene('kitchen')); };
        if (document.fonts && document.fonts.load) document.fonts.load('italic 100px "Instrument Serif"').then(go, go);
        else go();
      }
    });
  }

  /* ---------- the secret menu: type "chef" (or tap the footer wordmark five times) ---------- */

  if (KB) {
    var typed = '', toast = null, toastTimer = 0, taps = [];
    var unlock = function () {
      KB.takeover('chef', 4200);
      if (!toast) {
        toast = document.createElement('p');
        toast.className = 'secret-toast mono';
        toast.setAttribute('role', 'status');
        document.body.appendChild(toast);
      }
      toast.innerHTML = '<span>✳</span> secret menu unlocked. the chef says hi.';
      toast.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 3600);
    };
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if (e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-4);
      if (typed === 'chef') { typed = ''; unlock(); }
    });
    var wm = $('#wordmark-art');
    if (wm) wm.addEventListener('click', function () {
      var now = Date.now();
      taps = taps.filter(function (t) { return now - t < 1600; });
      taps.push(now);
      if (taps.length >= 5) { taps = []; unlock(); }
    });
  }

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // at most one layout read per frame, however fast the scroll events arrive
  var scrollQueued = false;
  function queueScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(function () { scrollQueued = false; onScroll(); });
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll);
  onScroll();
})();
