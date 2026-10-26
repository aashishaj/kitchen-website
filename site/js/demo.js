/*
  The demo film: Moka Moon (a made-up coffee brand) launches a protein cold brew with three open-source apps.
  Every frame is worked out from the clock alone, so play, pause and jumping to a chapter all just set the time.
  The stage is laid out at 1200×750 and scaled to fit, so the cursor lands in the same place at any size.
*/
(function () {
  'use strict';

  var film = document.getElementById('film');
  if (!film) return;
  var KB = window.KitchenBinary;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 1200;
  var $ = function (s) { return film.querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || film).querySelectorAll(s)); };

  var frame = $('#film-frame'), stage = $('#film-stage'), cursor = $('#fx-cursor');
  var scale = 1;
  function fit() {
    scale = frame.clientWidth / W || 1;
    stage.style.setProperty('--s', scale);
  }
  fit();

  /* ---------- small helpers: every one of them is safe to call on every frame ---------- */

  function lin(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function on(el, cls, cond) { cond = !!cond; if (el.classList.contains(cls) !== cond) el.classList.toggle(cls, cond); }
  function text(el, s) { if (el.textContent !== s) el.textContent = s; }
  function type(el, s, t, a, b) { text(el, s.slice(0, Math.round(s.length * lin(t, a, b)))); }
  function prog(el, p) { el.style.setProperty('--p', p.toFixed(3)); }
  function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  /* ---------- the binary pictures on the stage ---------- */

  // thumbnails draw themselves whenever their screen appears; data-cue ones wait for the script
  var EMPTY = { fn: function () { return null; } };
  var arts = [];
  if (KB) {
    $$('canvas[data-art]').forEach(function (c) {
      var cued = c.hasAttribute('data-cue');
      var a = KB.create(c, {
        font: +c.dataset.font || 7,
        small: +c.dataset.small || (cued ? 0 : 5), // small pictures need a finer grid to stay recognisable
        field: +c.dataset.field || 0.03,
        scale: cued ? 0.9 : 0.96,
        interactive: false
      });
      a.key = c.dataset.art;
      a.cued = cued;
      a.want = null;
      a.hide(true);
      a.setScene(EMPTY, true);
      arts.push(a);
    });
  }
  function artIn(sel) {
    var el = $(sel);
    return arts.filter(function (a) { return el.contains(a.canvas); })[0] || null;
  }
  // show a cued picture (it scrambles in) or clear it, depending on the clock
  function form(a, cond) {
    if (!a) return;
    var want = cond ? a.key : null;
    if (a.want === want) return;
    a.want = want;
    a.setScene(want || EMPTY, !want);
  }
  function wakeArts(el, show) {
    arts.forEach(function (a) {
      if (!el.contains(a.canvas)) return;
      a.hide(!show);
      if (!a.cued) a.setScene(show ? a.key : EMPTY, !show);
      else if (!show) { a.want = null; a.setScene(EMPTY, true); }
    });
  }

  /* ---------- screens ---------- */

  var views = {}, cards = { intro: $('#fx-intro'), end: $('#fx-end') };
  $$('.fx-view').forEach(function (v) { views[v.dataset.v] = v; });
  var shown = { view: null, card: null };

  function setView(name) {
    if (shown.view === name) return;
    if (shown.view) { views[shown.view].classList.remove('is-on'); wakeArts(views[shown.view], false); }
    shown.view = name;
    if (name) { views[name].classList.add('is-on'); wakeArts(views[name], true); }
  }
  function setCard(name) {
    if (shown.card === name) return;
    if (shown.card) { cards[shown.card].classList.remove('is-on'); wakeArts(cards[shown.card], false); }
    shown.card = name;
    if (name) { cards[name].classList.add('is-on'); wakeArts(cards[name], true); }
  }
  function lines(card, t, times) {
    $$('[data-line]', card).forEach(function (el, i) { on(el, 'on', t >= times[i]); });
  }

  var titleEl = $('#fx-title');
  function title(s) { text(titleEl, s + ' — Kitchen'); }

  var sideItems = $$('.fx-side [data-nav]');
  function side(active) { sideItems.forEach(function (li) { on(li, 'is-on', li.dataset.nav === active); }); }

  /* ---------- what each screen does over time ---------- */

  var newApps = ['pomelli', 'opencut', 'postiz'].map(function (k) { return $('#fx-app-' + k); });
  var appCards = $$('.fx-app').map(function (el) { return { el: el, st: $$('.fx-st', el)[0], bar: $$('.fx-prog i', el)[0] }; });
  var installBtn = $('#fx-install'), installNote = $('#fx-install-note');

  // it < 0: not started yet. The three apps finish one after another.
  function installAt(it) {
    var done = 0;
    appCards.forEach(function (c, i) {
      var p = it < 0 ? 0 : lin(it, i * 0.7, i * 0.7 + 4.2);
      prog(c.bar, p);
      text(c.st, it < 0 ? 'ready to install' : p === 0 ? 'queued' : p < 0.45 ? 'soaking…' : p < 1 ? 'frying…' : 'served ✓');
      on(c.el, 'done', p >= 1);
      on(newApps[i], 'in', p > 0);
      on(newApps[i], 'ready', p >= 1);
      if (p >= 1) done++;
    });
    text(installBtn, it < 0 ? '$ install all 3' : done < 3 ? 'installing…' : 'all 3 served ✓');
    on(installBtn, 'done', done === 3);
    text(installNote, it < 0 ? '3 apps · runs on this laptop' : done < 3 ? 'installing in the background · keep working' : '3 apps ready · 0 terminals opened');
  }

  var sheet = $('#fx-sheet'), allow = $('#fx-allow');

  var url = $('#fx-url'), urlBox = $('#fx-urlbox'), extract = $('#fx-extract');
  var brand = $('#fx-brand'), chip = $('#fx-chip');
  var dna = $$('.fx-dna > div').map(function (row) {
    var dd = $$('dd', row)[0];
    return { row: row, dd: dd, full: dd.children.length ? '' : dd.textContent };
  });
  function brandAt(t) {
    on(urlBox, 'focus', t >= 1 && t < 3.6);
    type(url, 'mokamoon.coffee', t, 1.2, 2.6);
    text(extract, t < 3.5 ? 'extract →' : t < 7.9 ? 'reading…' : 'done ✓');
    on(brand, 'in', t >= 3.8);
    dna.forEach(function (d, i) {
      var a = 4.3 + i * 0.65;
      on(d.row, 'on', t >= a);
      if (d.full) type(d.dd, d.full, t, a, a + 0.5);
    });
    text(chip, t < 7.9 ? 'reading…' : 'brand saved ✓');
    on(chip, 'ok', t >= 7.9);
  }

  var goal = $('#fx-goal'), dirBox = $('#fx-dirbox'), dir = $('#fx-dir'), gen = $('#fx-gen'), wait = $('#fx-wait');
  var ideas = $$('.fx-idea');
  function campaignAt(t) {
    on(goal, 'is-on', t >= 1.2);
    on(dirBox, 'focus', t >= 2 && t < 5);
    type(dir, 'Launch our protein cold brew', t, 2.2, 4.2);
    text(gen, t < 5.1 ? 'generate 4 ideas' : t < 8.3 ? 'simmering…' : '4 ideas ✓');
    on(gen, 'done', t >= 8.3);
    on(wait, 'gone', t >= 6);
    ideas.forEach(function (el, i) { on(el, 'in', t >= 6 + i * 0.6); });
    on(ideas[0], 'hover', t >= 8.9);
  }

  var postArt = artIn('.fx-post'), phoneArt = artIn('#fx-phone'), introArt = artIn('#fx-intro'), endArt = artIn('#fx-end');
  var postBits = ['#fx-post-1', '#fx-post-2', '#fx-post-3'].map($);
  var sizes = $$('.fx-sizes li');
  var animateBtn = $('#fx-animate'), render = $('#fx-render'), renderLabel = $('#fx-render-label'), renderBar = $('#fx-render-bar');
  var phone = $('#fx-phone'), phoneZoom = $('#fx-phone-art'), phoneLine = $('#fx-phone-line');
  // pt: time into making the post; rt: time into making the reel (< 0 means not yet)
  function studioAt(pt, rt) {
    form(postArt, pt >= 0.1);
    [1.3, 1.8, 2.2].forEach(function (a, i) { on(postBits[i], 'on', pt >= a); });
    sizes.forEach(function (li, i) { on(li, 'on', pt >= 2.7 + i * 0.4); });
    on(render, 'in', rt >= 0);
    prog(renderBar, rt < 0 ? 0 : lin(rt, 0.2, 4));
    on(render, 'done', rt >= 4);
    on(renderBar.parentNode, 'done', rt >= 4);
    text(renderLabel, rt < 4 ? 'rendering · 9:16 · 5s' : 'reel served ✓');
    text(animateBtn, rt < 0 ? 'turn into a reel →' : rt < 4 ? 'rendering…' : 'reel ready ✓');
    on(animateBtn, 'done', rt >= 4);
    on(phone, 'in', rt >= 4.1);
    form(phoneArt, rt >= 4.1);
    phoneZoom.style.setProperty('--z', (1 + 0.08 * ease(lin(rt, 4.2, 8))).toFixed(4));
    on(phoneLine, 'on', rt >= 5);
  }

  var sched = $('#fx-sched'), slots = $$('.fx-slot'), calFoot = $('#fx-cal-foot');
  function postizAt(t) {
    text(sched, t < 1.6 ? '$ schedule 4 posts' : t < 4.2 ? 'scheduling…' : '4 posts scheduled ✓');
    on(sched, 'done', t >= 4.2);
    slots.forEach(function (el, i) { on(el, 'in', t >= 2 + i * 0.55); });
    on(calFoot, 'on', t >= 4.4);
  }

  // the calendar's empty grid
  (function () {
    var cal = $('#fx-cal'), days = ['Mon 26', 'Tue 27', 'Wed 28', 'Thu 29', 'Fri 30', 'Sat 31', 'Sun 1'], hours = ['8:00', '12:00', '18:00', '21:00'];
    var html = '';
    for (var r = 0; r < 5; r++) {
      for (var c = 0; c < 8; c++) {
        var label = r === 0 ? (c ? days[c - 1] : '') : (c ? '' : hours[r - 1]);
        html += '<span class="' + (r ? '' : 'r0 ') + (c ? '' : 'c0') + '" style="grid-row:' + (r + 1) + ';grid-column:' + (c + 1) + '">' + label + '</span>';
      }
    }
    cal.insertAdjacentHTML('afterbegin', html);
  })();

  /* ---------- the script ---------- */

  // path: where the cursor arrives, and when. clicks: when it presses something.
  var scenes = [
    { dur: 4.5, ch: 0, cursor: false,
      caption: "Meet Moka Moon, a small coffee brand. They're launching a protein cold brew, with no agency and no developer.",
      run: function (t) {
        setCard('intro'); setView(null); side('discover'); title('Discover'); installAt(-1);
        form(introArt, t >= 0.1 || reduce);
        lines(cards.intro, t, [0.3, 0.7, 1.6]);
      } },
    { dur: 8, ch: 0, cursor: true,
      caption: 'Pick a dish. In Kitchen, a collection bundles the open-source apps for one job, like planning social content.',
      path: [[0.5, [880, 640]], [2.3, '#fx-tab-coll'], [5.4, '#fx-coll-social']],
      clicks: [[2.4, '#fx-tab-coll'], [6.4, '#fx-coll-social']],
      run: function (t) {
        setCard(null); side('discover'); installAt(-1);
        setView(t < 2.6 ? 'discover' : t < 7 ? 'collections' : 'collection');
        title(t < 2.6 ? 'Discover' : t < 7 ? 'Collections' : 'Create and plan social content');
        on($('#fx-coll-social'), 'hover', t >= 4.9 && t < 7);
      } },
    { dur: 10, ch: 1, cursor: true,
      caption: 'We prep it. Three apps install side by side in the background. No terminal, no setup, no servers.',
      path: [[1.5, '#fx-install'], [4.6, [760, 560]], [9.1, '#fx-app-pomelli']],
      clicks: [[1.7, '#fx-install'], [9.4, '#fx-app-pomelli']],
      run: function (t) {
        setCard(null); setView('collection'); side('discover'); title('Create and plan social content');
        installAt(t - 1.9);
      } },
    { dur: 6, ch: 1, cursor: true,
      caption: 'Before an app can use AI, Kitchen asks first. Your key stays in one place, and you can take it back any time.',
      path: [[2.9, '#fx-allow'], [5.6, [700, 500]]],
      clicks: [[3.3, '#fx-allow']],
      run: function (t) {
        setCard(null); setView('pomelli'); side('pomelli'); title('Open-Pomelli'); installAt(99); brandAt(0);
        on(sheet, 'open', t >= 0.25 && t < 4.5);
        text(allow, t < 3.5 ? 'Use this connection' : 'Connected ✓');
        on(allow, 'done', t >= 3.5);
      } },
    { dur: 12, ch: 2, cursor: true,
      caption: "Paste the website. Open-Pomelli reads the brand: what it sells, who it's for and how it talks.",
      path: [[0.9, '#fx-urlbox'], [3.3, '#fx-extract'], [6.6, [930, 400]], [10.4, '#fx-newcamp']],
      clicks: [[1, '#fx-urlbox'], [3.45, '#fx-extract'], [10.8, '#fx-newcamp']],
      run: function (t) {
        setCard(null); setView('pomelli'); side('pomelli'); title('Open-Pomelli'); installAt(99);
        on(sheet, 'open', false);
        brandAt(t);
      } },
    { dur: 10, ch: 3, cursor: true,
      caption: "Pick a goal and add one line. Four campaign ideas come back, in the brand's own voice.",
      path: [[1, '#fx-goal'], [1.9, '#fx-dirbox'], [4.8, '#fx-gen'], [8.9, '#fx-idea-0']],
      clicks: [[1.1, '#fx-goal'], [2, '#fx-dirbox'], [5, '#fx-gen'], [9.5, '#fx-idea-0']],
      run: function (t) {
        setCard(null); setView('campaign'); side('pomelli'); title('Open-Pomelli'); installAt(99);
        campaignAt(t);
      } },
    { dur: 7.5, ch: 3, cursor: true,
      caption: 'Choose an idea and it makes the post, already sized for each channel.',
      path: [[1.2, [640, 610]], [6.3, '#fx-animate']],
      clicks: [[6.8, '#fx-animate']],
      run: function (t) {
        setCard(null); setView('studio'); side('pomelli'); title('Open-Pomelli'); installAt(99);
        studioAt(t, -1);
      } },
    { dur: 8, ch: 3, cursor: true,
      caption: "One more click turns the post into a short reel. OpenCut is installed too, for when you'd rather edit by hand.",
      path: [[1.4, [720, 560]], [7.4, '#fx-app-postiz']],
      clicks: [[7.7, '#fx-app-postiz']],
      run: function (t) {
        setCard(null); setView('studio'); side('pomelli'); title('Open-Pomelli'); installAt(99);
        studioAt(99, t);
      } },
    { dur: 7, ch: 4, cursor: true,
      caption: 'Serve. Postiz lines up the whole week of posts, from the same laptop.',
      path: [[1.3, '#fx-sched'], [3.8, [760, 640]]],
      clicks: [[1.5, '#fx-sched']],
      run: function (t) {
        setCard(null); setView('postiz'); side('postiz'); title('Postiz'); installAt(99);
        postizAt(t);
      } },
    { dur: 5, ch: 4, cursor: false,
      caption: "That's the whole launch: three free apps, one laptop, no developer.",
      run: function (t) {
        setCard('end'); setView('postiz'); side('postiz'); title('Postiz'); installAt(99); postizAt(99);
        form(endArt, t >= 0.1);
        lines(cards.end, t, [0.3, 0.6, 1.4]);
      } }
  ];

  var CHAPTERS = ['pick', 'prep', 'season', 'cook', 'serve'];
  var total = 0, pts = [], clicks = [];
  scenes.forEach(function (sc) {
    sc.start = total;
    (sc.path || []).forEach(function (p) { pts.push({ t: total + p[0], at: p[1] }); });
    (sc.clicks || []).forEach(function (c) { clicks.push({ t: total + c[0], at: c[1] }); });
    total += sc.dur;
  });
  var chapters = CHAPTERS.map(function (label, i) {
    var mine = scenes.filter(function (sc) { return sc.ch === i; });
    return { label: label, start: mine[0].start, end: mine[mine.length - 1].start + mine[mine.length - 1].dur };
  });

  /* ---------- the cursor ---------- */

  function where(at) {
    if (Array.isArray(at)) return { x: at[0], y: at[1] };
    var r = $(at).getBoundingClientRect(), s = stage.getBoundingClientRect();
    return { x: (r.left - s.left + r.width * 0.5) / scale, y: (r.top - s.top + r.height * 0.6) / scale };
  }
  var pressed = null;
  function drawCursor(T, sc) {
    on(cursor, 'on', sc.cursor);
    var i = 0;
    while (i < pts.length - 1 && pts[i + 1].t <= T) i++;
    var a = pts[i], b = pts[i + 1], p = where(a.at), x = p.x, y = p.y;
    if (b && T > a.t) {
      var leave = Math.max(a.t, b.t - 0.85);
      if (T > leave) {
        var q = where(b.at), k = ease(lin(T, leave, b.t)), arc = Math.sin(Math.PI * k) * 0.1;
        x = p.x + (q.x - p.x) * k - (q.y - p.y) * arc;
        y = p.y + (q.y - p.y) * k + (q.x - p.x) * arc;
      }
    }
    cursor.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';

    var down = null;
    clicks.forEach(function (c) { if (T >= c.t && T < c.t + 0.3) down = c; });
    on(cursor, 'down', down);
    var target = down ? $(down.at) : null;
    if (pressed !== target) {
      if (pressed) pressed.classList.remove('pressed');
      if (target) target.classList.add('pressed');
      pressed = target;
    }
  }

  /* ---------- playing ---------- */

  var T = 0, playing = false, ended = false, userPaused = false, started = false, last = 0, current = -1;
  var captionEl = $('#film-caption'), timeEl = $('#film-time'), toggle = $('#film-toggle');
  var over = $('#film-over'), overLabel = $('#film-replay-label');
  var list = $('#film-chapters');

  list.style.gridTemplateColumns = chapters.map(function (c) { return (c.end - c.start).toFixed(1) + 'fr'; }).join(' ');
  chapters.forEach(function (c, i) {
    var li = document.createElement('li');
    li.innerHTML = '<button type="button"><i></i><span>0' + (i + 1) + ' ' + c.label + '</span></button>';
    c.btn = li.firstChild;
    c.bar = c.btn.firstChild;
    c.btn.setAttribute('aria-label', 'Chapter ' + (i + 1) + ': ' + c.label + ', at ' + fmt(c.start));
    c.btn.addEventListener('click', function (e) { e.stopPropagation(); seek(c.start); userPaused = false; play(); });
    list.appendChild(li);
  });

  function draw() {
    var i = 0;
    while (i < scenes.length - 1 && T >= scenes[i].start + scenes[i].dur) i++;
    var sc = scenes[i];
    if (i !== current) {
      current = i;
      captionEl.innerHTML = '<span class="mono">// 0' + (sc.ch + 1) + ' ' + CHAPTERS[sc.ch] + '</span>' + sc.caption;
    }
    sc.run(T - sc.start);
    drawCursor(T, sc);

    film.classList.toggle('is-playing', playing);
    toggle.setAttribute('aria-label', playing ? 'Pause the demo' : 'Play the demo');
    chapters.forEach(function (c) {
      prog(c.bar, lin(T, c.start, c.end));
      on(c.btn, 'is-on', T >= c.start && (T < c.end || c.end >= total));
    });
    text(timeEl, fmt(T) + ' / ' + fmt(total));
    on(over, 'show', ended || (reduce && !started));
    text(overLabel, ended ? 'Watch again' : 'Play the demo · ' + fmt(total));
  }

  function loop(now) {
    if (!playing) return;
    T += Math.min(0.1, (now - last) / 1000);
    last = now;
    if (T >= total) { T = total; playing = false; ended = true; }
    draw();
    if (playing) requestAnimationFrame(loop);
  }
  function play() {
    if (playing) return;
    if (ended) { T = 0; ended = false; }
    playing = started = true;
    last = performance.now();
    requestAnimationFrame(loop);
    draw();
  }
  function pause() { playing = false; draw(); }
  function seek(t) { T = Math.max(0, Math.min(total, t)); ended = false; draw(); }

  toggle.addEventListener('click', function () {
    if (playing) { pause(); userPaused = true; }
    else { userPaused = false; play(); }
  });
  frame.addEventListener('click', function () { toggle.click(); });
  $('#film-replay').addEventListener('click', function (e) { e.stopPropagation(); userPaused = false; play(); });

  // plays by itself once it's mostly on screen, and stops when you scroll away
  new IntersectionObserver(function (entries) {
    var visible = entries[0].isIntersecting;
    if (visible && !userPaused && !ended && !reduce) play();
    else if (!visible && playing) pause();
  }, { threshold: 0.45 }).observe(frame);

  var full = $('#film-full');
  if (!document.fullscreenEnabled) full.hidden = true;
  full.addEventListener('click', function () {
    if (document.fullscreenElement) document.exitFullscreen();
    else film.requestFullscreen().catch(function () {});
  });
  document.addEventListener('fullscreenchange', function () {
    full.setAttribute('aria-label', document.fullscreenElement ? 'Leave full screen' : 'Watch full screen');
  });

  var refit;
  new ResizeObserver(function () {
    fit();
    draw();
    clearTimeout(refit);
    refit = setTimeout(function () { arts.forEach(function (a) { a.resize(); }); draw(); }, 160);
  }).observe(frame);

  // for scripts that record the film to video, one frame at a time
  window.KitchenFilm = {
    total: total,
    seek: function (t) { pause(); seek(t); },
    play: play,
    pause: pause
  };

  draw();
})();
