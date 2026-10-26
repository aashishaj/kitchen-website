/*
  Kitchen binary art.
  Every picture on the page is a grid of 0s and 1s. A "scene" decides which colour each cell lights up in;
  empty cells stay as a faint field of digits. Switching scenes scrambles the digits across, so one dish
  morphs into the next. Colours come from --art-* tokens in styles.css, so dark mode just re-reads them.
*/
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var TOKENS = ['ink', 'tomato', 'carrot', 'leaf', 'pasta', 'pot', 'cream', 'steam', 'field', 'mark'];
  // how strongly each colour shows; quieter colours read as "fill", louder ones as "edges"
  var STRENGTH = { ink: 0.92, tomato: 0.95, carrot: 0.9, leaf: 0.92, pasta: 0.95, pot: 0.9, cream: 0.7, steam: 0.75, mark: 1 };
  var palette = {};
  var fieldScale = 1, lift = 0;
  // phones with few cores or Data Saver on get a calmer frame rate and a still background
  var lowPower = !!(navigator.connection && navigator.connection.saveData) || (navigator.hardwareConcurrency || 8) <= 4;

  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    TOKENS.forEach(function (k) { palette[k] = cs.getPropertyValue('--art-' + k).trim() || '#888'; });
    fieldScale = parseFloat(cs.getPropertyValue('--art-field-scale')) || 1;
    lift = parseFloat(cs.getPropertyValue('--art-lift')) || 0;
  }

  /* ---------- geometry helpers (all coordinates are 0..1 inside the art square) ---------- */

  function ell(x, y, cx, cy, rx, ry) { var dx = (x - cx) / rx, dy = (y - cy) / ry; return dx * dx + dy * dy; }
  function box(x, y, x1, y1, x2, y2) { return x >= x1 && x <= x2 && y >= y1 && y <= y2; }
  function seg(x, y, x1, y1, x2, y2) {
    var C = x2 - x1, D = y2 - y1, len = C * C + D * D;
    var p = len ? Math.max(0, Math.min(1, ((x - x1) * C + (y - y1) * D) / len)) : 0;
    var dx = x - (x1 + p * C), dy = y - (y1 + p * D);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function hash(a, b) { var h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); }

  // wavy columns of bits that rise and loop: steam off a pot
  function steam(x, y, t, xs, top, bottom) {
    if (y < top || y > bottom) return null;
    for (var i = 0; i < xs.length; i++) {
      var ph = i * 2.1;
      var wx = xs[i] + Math.sin(y * 16 - t * 1.4 + ph) * 0.028 * ((bottom - y) / (bottom - top) + 0.4);
      if (Math.abs(x - wx) < 0.02) {
        var band = (y * 26 + t * 1.1 + ph) % 1;
        var fade = (y - top) / (bottom - top);
        if (band < 0.35 + fade * 0.45) return 'steam';
      }
    }
    return null;
  }

  /* ---------- the dishes ---------- */

  function pastaBowl(x, y, h, cx, cy, k) {
    var d = ell(x, y, cx, cy, 0.42 * k, 0.36 * k);
    if (d > 1) return null;
    if (d > 0.74) return 'pot';
    if (ell(x, y, cx + 0.04 * k, cy - 0.09 * k, 0.045 * k, 0.026 * k) <= 1) return 'leaf';
    if (ell(x, y, cx - 0.05 * k, cy - 0.07 * k, 0.03 * k, 0.02 * k) <= 1) return 'leaf';
    if (ell(x, y, cx, cy - 0.03 * k, 0.14 * k, 0.11 * k) <= 1) return h > 0.88 ? 'carrot' : 'tomato';
    var dx = (x - cx) / k, dy = (y - cy) / k;
    var r = Math.sqrt(dx * dx + dy * dy * 1.3), a = Math.atan2(dy, dx);
    var v = Math.sin(r * 64 + Math.sin(a * 3) * 2.2);
    if (v > 0.15) return 'pasta';
    if (v > -0.25) return h > 0.6 ? 'carrot' : 'pasta';
    return 'cream';
  }

  function pizzaPie(x, y, cx, cy, h) {
    var dx = x - cx, dy = y - cy, r = Math.sqrt(dx * dx + dy * dy);
    if (r > 0.4) return null;
    if (r > 0.34) return 'carrot';
    var pep = [[0.33, 0.38], [0.52, 0.32], [0.3, 0.62], [0.47, 0.72], [0.62, 0.6], [0.44, 0.5], [0.66, 0.42]];
    for (var i = 0; i < pep.length; i++) if (ell(x, y, pep[i][0], pep[i][1], 0.05, 0.05) <= 1) return 'tomato';
    if (ell(x, y, 0.4, 0.3, 0.032, 0.016) <= 1 || ell(x, y, 0.56, 0.7, 0.032, 0.016) <= 1 || ell(x, y, 0.26, 0.5, 0.016, 0.032) <= 1) return 'leaf';
    return h > 0.85 ? 'cream' : 'pasta';
  }

  var scenes = {
    pasta: function (x, y, t, h) { return pastaBowl(x, y, h, 0.5, 0.52, 1); },

    ramen: function (x, y, t, h) {
      var s = steam(x, y, t, [0.36, 0.5, 0.64], 0.02, 0.22);
      if (s) return s;
      if (seg(x, y, 0.6, 0.12, 0.96, 0.6) < 0.013 || seg(x, y, 0.67, 0.1, 0.99, 0.54) < 0.013) return 'ink';
      var d = ell(x, y, 0.5, 0.56, 0.41, 0.33);
      if (d > 1) return null;
      if (d > 0.75) return 'pot';
      if (ell(x, y, 0.37, 0.5, 0.09, 0.075) <= 1) return ell(x, y, 0.375, 0.5, 0.045, 0.038) <= 1 ? 'carrot' : 'cream';
      if (box(x, y, 0.57, 0.4, 0.68, 0.58)) return 'ink';
      if (y > 0.6 && Math.sin(x * 95 + Math.sin(y * 34) * 2.4) > 0.05) return 'pasta';
      if (h > 0.92) return 'leaf';
      return h > 0.45 ? 'carrot' : 'pasta';
    },

    salad: function (x, y, t, h) {
      var d = ell(x, y, 0.5, 0.53, 0.42, 0.35);
      if (d > 1) return null;
      if (d > 0.76) return 'pot';
      var toms = [[0.36, 0.45], [0.6, 0.4], [0.55, 0.64], [0.33, 0.62], [0.68, 0.56]];
      for (var i = 0; i < toms.length; i++) {
        var td = ell(x, y, toms[i][0], toms[i][1], 0.05, 0.042);
        if (td <= 1) return td < 0.25 && h > 0.6 ? 'pasta' : 'tomato';
      }
      if (seg(x, y, 0.42, 0.34, 0.5, 0.48) < 0.012 || seg(x, y, 0.62, 0.48, 0.72, 0.42) < 0.012 || seg(x, y, 0.4, 0.55, 0.46, 0.7) < 0.012) return 'carrot';
      if (box(x, y, 0.47, 0.52, 0.52, 0.56) || box(x, y, 0.26, 0.5, 0.3, 0.54) || box(x, y, 0.62, 0.66, 0.66, 0.7)) return 'cream';
      var v = Math.sin(x * 38 + Math.sin(y * 21) * 2) + Math.sin(y * 33 + x * 11);
      return v > -0.3 ? 'leaf' : (h > 0.5 ? 'leaf' : 'cream');
    },

    cake: function (x, y, t, h) {
      if (ell(x, y, 0.5, 0.31, 0.065, 0.06) <= 1) return h > 0.86 ? 'pasta' : 'tomato';
      if (ell(x, y, 0.5, 0.245, 0.05, 0.018) <= 1) return 'leaf';
      var plate = ell(x, y, 0.5, 0.8, 0.42, 0.075);
      if (box(x, y, 0.24, 0.37, 0.76, 0.77)) {
        var drip = 0.43 + Math.max(0, Math.sin(x * 46)) * 0.035;
        if (y < drip) return 'cream';
        if (y < 0.53) return 'pasta';
        if (y < 0.57) return 'tomato';
        if (y < 0.61) return 'cream';
        return 'pasta';
      }
      if (plate <= 1) return plate > 0.55 ? 'pot' : 'cream';
      return null;
    },

    plate: function (x, y, t, h) {
      var d = ell(x, y, 0.5, 0.54, 0.3, 0.3);
      if (d <= 1) {
        if (d > 0.64) return 'pot';
        if (d > 0.52) return 'cream';
        return h > 0.975 ? 'pasta' : null; // a few crumbs
      }
      // fork
      if (seg(x, y, 0.13, 0.4, 0.13, 0.86) < 0.014) return 'ink';
      if (seg(x, y, 0.1, 0.36, 0.16, 0.36) < 0.014) return 'ink';
      for (var i = -1; i <= 1; i++) if (seg(x, y, 0.13 + i * 0.026, 0.2, 0.13 + i * 0.026, 0.36) < 0.008) return 'ink';
      // knife
      if (box(x, y, 0.85, 0.2, 0.885, 0.56)) return 'steam';
      if (box(x, y, 0.85, 0.56, 0.885, 0.86)) return 'ink';
      return null;
    },

    menu: function (x, y, t, h) {
      if (!box(x, y, 0.24, 0.07, 0.76, 0.93)) return null;
      if (x < 0.258 || x > 0.742 || y < 0.088 || y > 0.912) return 'ink';
      if (box(x, y, 0.36, 0.14, 0.64, 0.19)) return 'ink';
      if (y > 0.235 && y < 0.25 && (x * 60) % 1 < 0.5) return 'tomato';
      for (var k = 0; k < 6; k++) {
        var y0 = 0.31 + k * 0.1;
        var active = k === 1;
        if (active && box(x, y, 0.28, y0 - 0.025, 0.72, y0 + 0.05)) {
          if (box(x, y, 0.32, y0, 0.58, y0 + 0.025)) return 'ink';
          return 'mark';
        }
        if (ell(x, y, 0.3, y0 + 0.012, 0.012, 0.016) <= 1) return 'leaf';
        if (box(x, y, 0.33, y0, 0.33 + 0.18 + hash(k, 3) * 0.14, y0 + 0.025)) return 'ink';
        if (box(x, y, 0.64, y0, 0.7, y0 + 0.025)) return 'carrot';
      }
      return 'cream';
    },

    ingredients: function (x, y, t, h) {
      // jar of grains
      if (box(x, y, 0.13, 0.24, 0.37, 0.3)) return 'tomato';
      if (box(x, y, 0.14, 0.3, 0.36, 0.67)) {
        if (x < 0.16 || x > 0.34 || y > 0.65) return 'pot';
        return y > 0.4 ? (h > 0.3 ? 'pasta' : 'carrot') : null;
      }
      // carrot
      var cd = seg(x, y, 0.7, 0.62, 0.87, 0.34);
      var along = Math.max(0, Math.min(1, (0.62 - y) / 0.28));
      if (cd < 0.04 * (1 - along * 0.55)) return 'carrot';
      if (seg(x, y, 0.87, 0.34, 0.9, 0.22) < 0.01 || seg(x, y, 0.87, 0.34, 0.82, 0.23) < 0.01 || seg(x, y, 0.87, 0.34, 0.95, 0.27) < 0.01) return 'leaf';
      // tomato
      if (ell(x, y, 0.55, 0.43, 0.045, 0.014) <= 1) return 'leaf';
      var td = ell(x, y, 0.55, 0.54, 0.115, 0.1);
      if (td <= 1) return ell(x, y, 0.51, 0.5, 0.03, 0.022) <= 1 ? 'cream' : 'tomato';
      // board
      if (box(x, y, 0.08, 0.67, 0.92, 0.83)) return Math.sin(y * 140 + x * 4) > 0.55 ? 'pasta' : 'carrot';
      return null;
    },

    pot: function (x, y, t, h) {
      var s = steam(x, y, t, [0.38, 0.5, 0.62], 0.03, 0.33);
      if (s) return s;
      if (ell(x, y, 0.5, 0.335, 0.03, 0.022) <= 1) return 'ink';
      if (ell(x, y, 0.5, 0.39, 0.28, 0.045) <= 1) return 'ink';
      if (box(x, y, 0.16, 0.46, 0.24, 0.5) || box(x, y, 0.76, 0.46, 0.84, 0.5)) return 'ink';
      if (box(x, y, 0.24, 0.42, 0.76, 0.75)) return box(x, y, 0.24, 0.5, 0.76, 0.52) ? 'cream' : 'pot';
      if (box(x, y, 0.2, 0.84, 0.8, 0.865)) return 'ink';
      if (y > 0.765 && y < 0.84) {
        for (var i = 0; i < 6; i++) {
          var fx = 0.3 + i * 0.08;
          var fh = 0.84 - y;
          var flick = 0.008 * Math.sin(t * 7 + i * 1.7);
          if (Math.abs(x - fx) < 0.034 - fh * 0.42 + flick) return fh < 0.025 ? 'tomato' : 'carrot';
        }
      }
      return null;
    },

    bell: function (x, y, t, h) {
      // a dinner bell that gives a small ring every few seconds
      var ring = Math.max(0, Math.sin(t * 2.2)) > 0.97 ? Math.sin(t * 40) * 0.012 : 0;
      x -= ring * (1 - y);
      if (ell(x, y, 0.5, 0.2, 0.04, 0.035) <= 1) return 'ink';
      if (box(x, y, 0.1, 0.78, 0.9, 0.82)) return 'ink';
      if (y > 0.22 && y < 0.74) {
        var half = 0.07 + Math.pow((y - 0.22) / 0.52, 0.55) * 0.3;
        if (Math.abs(x - 0.5) < half) {
          if (ell(x, y, 0.4, 0.42, 0.04, 0.12) <= 1) return 'cream';
          return y > 0.7 ? 'carrot' : 'pasta';
        }
      }
      if (y >= 0.74 && y < 0.78 && Math.abs(x - 0.5) < 0.42) return 'carrot';
      if (ring && y < 0.2 && (Math.abs(x - 0.22) < 0.01 || Math.abs(x - 0.78) < 0.01) && y > 0.08) return 'steam';
      return null;
    },

    pizza: function (x, y, t, h) {
      // a whole pie with one slice pulled out to the right
      var cx = 0.45, cy = 0.52, half = 0.42;
      var qx = x - 0.08, qy = y + 0.01; // where this point sits on the pulled-out slice
      if (Math.abs(Math.atan2(qy - cy, qx - cx) - 0.1) < half) return pizzaPie(qx, qy, cx, cy, h);
      if (Math.abs(Math.atan2(y - cy, x - cx) - 0.1) < half) return null; // the gap it left behind
      return pizzaPie(x, y, cx, cy, h);
    },

    sushi: function (x, y, t, h) {
      // three maki on a board, chopsticks resting on top
      if (seg(x, y, 0.14, 0.16, 0.86, 0.3) < 0.011 || seg(x, y, 0.14, 0.22, 0.86, 0.34) < 0.011) return 'carrot';
      var rolls = [0.21, 0.5, 0.79];
      for (var i = 0; i < rolls.length; i++) {
        var d = ell(x, y, rolls[i], 0.58, 0.135, 0.135);
        if (d <= 1) {
          if (d > 0.62) return 'ink';
          if (ell(x, y, rolls[i] - 0.025, 0.56, 0.05, 0.05) <= 1) return 'carrot';
          if (ell(x, y, rolls[i] + 0.035, 0.61, 0.032, 0.032) <= 1) return 'leaf';
          return h > 0.4 ? 'cream' : 'pasta';
        }
      }
      if (box(x, y, 0.08, 0.74, 0.92, 0.8)) return Math.sin(x * 120) > 0.6 ? 'carrot' : 'pasta';
      if (box(x, y, 0.12, 0.8, 0.18, 0.86) || box(x, y, 0.82, 0.8, 0.88, 0.86)) return 'carrot';
      return null;
    },

    coffee: function (x, y, t, h) {
      var s = steam(x, y, t, [0.4, 0.5, 0.6], 0.06, 0.3);
      if (s) return s;
      if (ell(x, y, 0.47, 0.82, 0.4, 0.06) <= 1) return ell(x, y, 0.47, 0.82, 0.3, 0.035) <= 1 ? 'cream' : 'pot';
      // handle
      var hd = ell(x, y, 0.75, 0.53, 0.09, 0.1);
      if (hd <= 1 && hd > 0.45 && x > 0.72) return 'pot';
      if (y > 0.36 && y < 0.78) {
        var half = 0.27 - (y - 0.36) * 0.12;
        if (Math.abs(x - 0.47) < half) {
          var top = ell(x, y, 0.47, 0.38, 0.27, 0.05);
          if (top <= 1) {
            // latte art: a little heart
            var hx = (x - 0.47) / 0.07, hy = (y - 0.385) / 0.05;
            var heart = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * Math.pow(-hy, 3) <= 0;
            return heart ? 'cream' : (top > 0.7 ? 'pot' : 'carrot');
          }
          return 'pot';
        }
      }
      return null;
    },

    coldbrew: function (x, y, t, h) {
      // the demo's protein cold brew: a tall glass with ice, a cream swirl, a striped straw, rising bubbles and a moon
      if (ell(x, y, 0.83, 0.15, 0.085, 0.085) <= 1 && ell(x, y, 0.865, 0.125, 0.075, 0.075) > 1) return 'pasta';
      if (seg(x, y, 0.6, 0.04, 0.52, 0.6) < 0.017) return Math.floor(y * 28) % 2 ? 'tomato' : 'cream';
      var top = 0.2, bot = 0.88;
      if (y < top || y > bot) return null;
      var half = 0.21 - (y - top) * 0.06, dx = Math.abs(x - 0.5);
      if (dx > half) return null;
      if (dx > half - 0.02 || y > bot - 0.025 || y < top + 0.015) return 'pot';
      if (y < 0.27) return null;
      var ice = [[0.42, 0.33, 0.3], [0.57, 0.35, -0.4], [0.49, 0.45, 0.15]];
      for (var i = 0; i < ice.length; i++) {
        var c = Math.cos(ice[i][2]), s = Math.sin(ice[i][2]);
        var u = (x - ice[i][0]) * c - (y - ice[i][1]) * s, v = (x - ice[i][0]) * s + (y - ice[i][1]) * c;
        var m = Math.max(Math.abs(u), Math.abs(v));
        if (m < 0.055) return m > 0.038 ? 'steam' : 'cream';
      }
      for (var b = 0; b < 6; b++) {
        var by = bot - 0.04 - ((t * 0.06 + hash(b, 7)) % 1) * 0.5;
        if (ell(x, y, 0.36 + b * 0.055 + Math.sin(t * 2 + b) * 0.01, by, 0.012, 0.009) <= 1) return 'cream';
      }
      if (y > 0.5 && y < 0.66 && Math.sin(x * 34 + y * 26 + Math.sin(y * 18) * 2) > 0.72) return 'cream';
      return y < 0.56 ? 'carrot' : (h > 0.25 ? 'tomato' : 'carrot');
    },

    burger: function (x, y, t, h) {
      var cx = 0.5;
      // top bun with sesame seeds
      if (y > 0.2 && y < 0.42) {
        var d = ell(x, y, cx, 0.42, 0.36, 0.22);
        if (d <= 1 && y < 0.42) {
          var seeds = [[0.38, 0.3], [0.5, 0.26], [0.62, 0.31], [0.44, 0.36], [0.58, 0.37]];
          for (var i = 0; i < seeds.length; i++) if (ell(x, y, seeds[i][0], seeds[i][1], 0.018, 0.01) <= 1) return 'cream';
          return 'pasta';
        }
      }
      if (y >= 0.42 && y < 0.47 && Math.abs(x - cx) < 0.4 + Math.sin(x * 70) * 0.015) return 'leaf';
      if (y >= 0.47 && y < 0.51 && Math.abs(x - cx) < 0.34) return 'tomato';
      if (y >= 0.51 && y < 0.55 && Math.abs(x - cx) < 0.37) return y < 0.53 || Math.sin(x * 40) > 0.3 ? 'pasta' : null;
      if (y >= 0.55 && y < 0.64 && Math.abs(x - cx) < 0.36) return 'ink';
      if (y >= 0.64 && y < 0.74 && Math.abs(x - cx) < 0.35 - Math.max(0, y - 0.7) * 1.2) return 'pasta';
      if (box(x, y, 0.1, 0.8, 0.9, 0.83)) return 'pot';
      return null;
    },

    chef: function (x, y, t, h) {
      // the secret menu: a chef's hat with a few sparkles around it
      var tw = Math.sin(t * 6 + h * 20) > 0.6;
      var stars = [[0.16, 0.2], [0.84, 0.18], [0.1, 0.62], [0.9, 0.58]];
      for (var i = 0; i < stars.length; i++) {
        var sx = Math.abs(x - stars[i][0]), sy = Math.abs(y - stars[i][1]);
        if ((sx < 0.008 && sy < 0.05) || (sy < 0.008 && sx < 0.05)) return tw ? 'mark' : 'pasta';
      }
      var puffs = [[0.36, 0.38, 0.15], [0.5, 0.3, 0.17], [0.64, 0.38, 0.15]];
      var best = 9;
      for (var k = 0; k < puffs.length; k++) best = Math.min(best, ell(x, y, puffs[k][0], puffs[k][1], puffs[k][2], puffs[k][2]));
      var inBand = box(x, y, 0.3, 0.46, 0.7, 0.74);
      if (best <= 1 || inBand) {
        if (inBand) {
          if (x < 0.32 || x > 0.68 || y > 0.72) return 'ink';
          return Math.abs(Math.sin(x * 60)) < 0.18 ? 'steam' : 'cream';
        }
        return best > 0.8 ? 'ink' : 'cream';
      }
      return null;
    },

    serve: function (x, y, t, h) {
      var plates = [[0.19, 0.2, 'leaf'], [0.81, 0.2, 'carrot'], [0.19, 0.8, 'tomato'], [0.81, 0.8, 'pasta']];
      for (var i = 0; i < plates.length; i++) {
        var p = plates[i], d = ell(x, y, p[0], p[1], 0.13, 0.13);
        if (d <= 1) return d > 0.62 ? 'pot' : (ell(x, y, p[0], p[1], 0.065, 0.06) <= 1 ? p[2] : 'cream');
        if (ell(x, y, p[0] + (p[0] < 0.5 ? 0.16 : -0.16), p[1] + (p[1] < 0.5 ? -0.06 : 0.06), 0.035, 0.035) <= 1) return 'steam';
      }
      var bowl = pastaBowl(x, y, h, 0.5, 0.5, 0.56);
      if (bowl) return bowl;
      if (box(x, y, 0.03, 0.04, 0.97, 0.96) && (Math.floor(x / 0.085) + Math.floor(y / 0.085)) % 2 === 0) return h > 0.5 ? 'cream' : null;
      return null;
    }
  };

  // a word set in Instrument Serif, sampled into the grid (used for the footer wordmark)
  function textScene(word) {
    var mask = null, mw = 0, mh = 0;
    return {
      fit: 'fill',
      prepare: function (w, h) {
        var c = document.createElement('canvas');
        mw = c.width = Math.max(1, Math.round(w / 2));
        mh = c.height = Math.max(1, Math.round(h / 2));
        var g = c.getContext('2d');
        var size = Math.min(mh * 1.05, mw / (word.length * 0.42));
        g.font = 'italic ' + size + 'px "Instrument Serif", Georgia, serif';
        g.textAlign = 'center';
        g.textBaseline = 'alphabetic';
        g.fillStyle = g.strokeStyle = '#000';
        g.lineWidth = size * (w < 700 ? 0.08 : 0.045); // thicken the hairlines so they survive the grid, more so on small screens
        g.lineJoin = 'round';
        g.fillText(word, mw / 2, mh * 0.5 + size * 0.3);
        g.strokeText(word, mw / 2, mh * 0.5 + size * 0.3);
        mask = g.getImageData(0, 0, mw, mh).data;
      },
      fn: function (x, y, t, h) {
        if (!mask) return null;
        var px = Math.min(mw - 1, Math.max(0, Math.floor(x * mw)));
        var py = Math.min(mh - 1, Math.max(0, Math.floor(y * mh)));
        var a = mask[(py * mw + px) * 4 + 3];
        if (a < 90) return null;
        return h > 0.965 ? 'mark' : 'ink';
      }
    };
  }

  /* ---------- the renderer ---------- */

  var arts = [];
  var running = false;
  var lastTick = 0;

  function BinaryArt(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ font: 11, field: 0.1, scale: 0.94, interactive: true }, opts || {});
    this.scene = null;
    this.prev = null;
    this.switchAt = -1e9;
    this.visible = false;
    this.started = false;
    this.pointer = { x: -1e4, y: -1e4, s: 0 };
    this.onSettle = null;
    this.settled = true;
    this.lastDraw = 0;
    this.resize();

    var self = this;
    if (this.opts.interactive) {
      canvas.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        self.pointer.x = e.clientX - r.left;
        self.pointer.y = e.clientY - r.top;
        self.pointer.s = 1;
      });
      canvas.addEventListener('pointerleave', function () { self.pointer.s = 0.999; });
    }
    arts.push(this);
  }

  BinaryArt.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // `small` asks for a finer grid on narrow screens, where a coarse one breaks letters apart
    var fs = this.opts.small && this.w < 700 ? this.opts.small
      : this.w < 220 ? 6.5 : this.w < 420 ? Math.max(8, this.opts.font - 2) : this.opts.font;
    this.fs = fs;
    this.cw = fs * 0.78;
    this.ch = fs * 1.18;
    this.cols = Math.floor(this.w / this.cw);
    this.rows = Math.floor(this.h / this.ch);
    var n = this.cols * this.rows;
    var ox = (this.w - this.cols * this.cw) / 2, oy = (this.h - this.rows * this.ch) / 2;

    var side = Math.min(this.w, this.h) * this.opts.scale;
    var sx = (this.w - side) / 2, sy = (this.h - side) / 2;
    var fill = this.scene && this.scene.fit === 'fill';

    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.nx = new Float32Array(n);
    this.ny = new Float32Array(n);
    this.seed = new Float32Array(n);
    this.delay = new Float32Array(n);
    this.digit = new Uint8Array(n);
    for (var j = 0, i = 0; j < this.rows; j++) {
      for (var c = 0; c < this.cols; c++, i++) {
        var x = ox + c * this.cw, y = oy + j * this.ch;
        this.px[i] = x;
        this.py[i] = y;
        this.nx[i] = fill ? (x + this.cw / 2) / this.w : (x + this.cw / 2 - sx) / side;
        this.ny[i] = fill ? (y + this.ch / 2) / this.h : (y + this.ch / 2 - sy) / side;
        this.seed[i] = hash(c + 0.5, j + 0.5);
        this.digit[i] = this.seed[i] > 0.38 ? 1 : 0;
      }
    }
    if (this.scene && this.scene.prepare) this.scene.prepare(this.w, this.h);
    if (this.prev && this.prev.prepare) this.prev.prepare(this.w, this.h);
    this.computeDelays();
    this.draw(performance.now() / 1000);
  };

  // a picture on a screen that isn't showing (like one step of the demo film) can sit out the animation loop
  BinaryArt.prototype.hide = function (hidden) {
    this.hidden = !!hidden;
    if (!this.hidden) wake();
  };

  BinaryArt.prototype.computeDelays = function () {
    for (var i = 0; i < this.delay.length; i++) {
      var dx = this.nx[i] - 0.5, dy = this.ny[i] - 0.5;
      this.delay[i] = Math.sqrt(dx * dx + dy * dy) * 0.7 + this.seed[i] * 0.45;
    }
  };

  // scene: a key from `scenes`, or an object { fn, fit, prepare }
  BinaryArt.prototype.setScene = function (scene, instant) {
    if (this.held) { this.pending = scene; return; } // remember it for when the hold ends
    this.applyScene(scene, instant);
  };

  BinaryArt.prototype.applyScene = function (scene, instant) {
    var next = typeof scene === 'string' ? { fn: scenes[scene] } : scene;
    var refit = (next && next.fit) !== (this.scene && this.scene.fit);
    this.prev = this.scene;
    this.scene = next;
    this.switchAt = instant || reduce.matches ? -1e9 : performance.now() / 1000;
    this.settled = false;
    if (refit) this.resize();
    else if (next && next.prepare) next.prepare(this.w, this.h);
    if (!running || reduce.matches) this.draw(performance.now() / 1000);
  };

  BinaryArt.prototype.draw = function (t) {
    var ctx = this.ctx, n = this.px.length;
    var elapsed = t - this.switchAt;
    var prevFn = this.prev && this.prev.fn, fn = this.scene && this.scene.fn;
    var p = this.pointer, R = 64, R2 = R * R, still = reduce.matches;
    var fieldA = this.opts.field * fieldScale;
    var last = '';
    this.lastDraw = t;

    ctx.clearRect(0, 0, this.w, this.h);
    ctx.font = '500 ' + this.fs + 'px "Geist Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';

    if (!still) {
      var flips = Math.ceil(n * 0.0035);
      for (var f = 0; f < flips; f++) { var k = (Math.random() * n) | 0; this.digit[k] ^= 1; }
      if (p.s > 0 && p.s < 1) p.s = Math.max(0, p.s - 0.04);
    }

    for (var i = 0; i < n; i++) {
      var x = this.nx[i], y = this.ny[i], s = this.seed[i];
      var sw = this.delay[i];
      var useNew = elapsed >= sw;
      var tok = useNew ? (fn ? fn(x, y, t, s) : null) : (prevFn ? prevFn(x, y, t, s) : null);
      var scramble = !still && elapsed > sw - 0.2 && elapsed < sw + 0.1;
      var dx = 0, dy = 0;

      if (p.s > 0) {
        var ddx = this.px[i] - p.x, ddy = this.py[i] - p.y, d2 = ddx * ddx + ddy * ddy;
        if (d2 < R2) {
          var d = Math.sqrt(d2) || 1, push = (1 - d / R) * 7 * p.s;
          dx = (ddx / d) * push;
          dy = (ddy / d) * push;
          if (Math.random() < 0.25 * p.s) scramble = true;
        }
      }

      var a;
      if (tok === null) {
        if (!fieldA) continue;
        tok = 'field';
        a = fieldA * (scramble ? 3 : 1);
      } else {
        a = (STRENGTH[tok] || 0.85) * (0.55 + lift + (0.45 - lift) * s);
        if (scramble) a *= 0.35 + Math.random() * 0.8;
      }
      var ch = scramble ? (Math.random() < 0.5 ? '0' : '1') : (this.digit[i] ? '1' : '0');

      if (tok !== last) { ctx.fillStyle = palette[tok]; last = tok; }
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.fillText(ch, this.px[i] + dx, this.py[i] + dy);
    }
    ctx.globalAlpha = 1;

    if (!this.settled && elapsed > 1.4) {
      this.settled = true;
      if (this.onSettle) this.onSettle();
    }
  };

  // ~30fps while a dish is morphing or under the pointer; once it has settled, the digits only drift,
  // so it drops to ~15fps (~10 on low-power devices)
  var IDLE = lowPower ? 0.1 : 0.066;
  function tick(now) {
    if (!arts.some(function (a) { return a.visible && !a.hidden; })) { running = false; return; }
    requestAnimationFrame(tick);
    if (now - lastTick < 33) return;
    lastTick = now;
    var t = now / 1000;
    arts.forEach(function (a) {
      if (!a.visible || a.hidden) return;
      var busy = !a.settled || a.pointer.s > 0;
      if (busy || t - a.lastDraw >= IDLE) a.draw(t);
    });
  }

  function wake() {
    if (running || reduce.matches) return;
    running = true;
    requestAnimationFrame(tick);
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var art = arts.find(function (a) { return a.canvas === e.target; });
      if (!art) return;
      art.visible = e.isIntersecting;
      if (art.visible && !art.started) {
        art.started = true;
        if (art.opts.onFirstView) art.opts.onFirstView(art);
      }
    });
    wake();
  }, { rootMargin: '80px' });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { arts.forEach(function (a) { a.resize(); }); }, 150);
  });

  /* ---------- the faint field behind the whole page, with a soft spotlight under the cursor ---------- */

  function Field(base, glow) {
    this.base = base;
    this.glow = glow;
    this.b = base.getContext('2d');
    this.g = glow.getContext('2d');
    this.mx = -1e4;
    this.my = -1e4;
    this.heat = 0;
    this.resize();
    var self = this;
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      self.mx = e.clientX;
      self.my = e.clientY;
      self.heat = 1;
      self.wake();
    }, { passive: true });
    window.addEventListener('resize', function () { self.resize(); });
    if (!reduce.matches && !lowPower) setInterval(function () { self.flicker(); }, 120);
  }

  Field.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    [this.base, this.glow].forEach(function (c) {
      c.width = Math.round(this.w * dpr);
      c.height = Math.round(this.h * dpr);
    }, this);
    this.b.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.fs = this.w < 600 ? 10 : 12;
    this.cw = this.fs * 1.25;
    this.ch = this.fs * 1.7;
    this.cols = Math.ceil(this.w / this.cw);
    this.rows = Math.ceil(this.h / this.ch);
    this.digits = new Uint8Array(this.cols * this.rows);
    for (var i = 0; i < this.digits.length; i++) this.digits[i] = Math.random() < 0.5 ? 1 : 0;
    this.paint();
  };

  Field.prototype.font = function (ctx) {
    ctx.font = this.fs + 'px "Geist Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
  };

  Field.prototype.paint = function () {
    var ctx = this.b;
    ctx.clearRect(0, 0, this.w, this.h);
    this.font(ctx);
    ctx.fillStyle = palette.field;
    ctx.globalAlpha = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--field-alpha')) || 0.07;
    for (var j = 0; j < this.rows; j++)
      for (var c = 0; c < this.cols; c++)
        ctx.fillText(this.digits[j * this.cols + c] ? '1' : '0', c * this.cw, j * this.ch);
    this.alpha = ctx.globalAlpha;
    ctx.globalAlpha = 1;
  };

  Field.prototype.flicker = function () {
    if (document.hidden) return;
    var ctx = this.b;
    this.font(ctx);
    ctx.fillStyle = palette.field;
    for (var k = 0; k < 24; k++) {
      var i = (Math.random() * this.digits.length) | 0;
      var c = i % this.cols, j = (i / this.cols) | 0;
      this.digits[i] ^= 1;
      ctx.clearRect(c * this.cw, j * this.ch, this.cw, this.ch);
      ctx.globalAlpha = this.alpha;
      ctx.fillText(this.digits[i] ? '1' : '0', c * this.cw, j * this.ch);
    }
    ctx.globalAlpha = 1;
  };

  Field.prototype.wake = function () {
    if (this.raf || reduce.matches) return;
    var self = this;
    this.raf = requestAnimationFrame(function loop() {
      self.drawGlow();
      self.heat -= 0.012;
      if (self.heat > 0) self.raf = requestAnimationFrame(loop);
      else { self.raf = 0; self.g.clearRect(0, 0, self.w, self.h); }
    });
  };

  Field.prototype.drawGlow = function () {
    var ctx = this.g, R = 150;
    ctx.clearRect(0, 0, this.w, this.h);
    this.font(ctx);
    ctx.fillStyle = palette.mark;
    var c0 = Math.max(0, Math.floor((this.mx - R) / this.cw)), c1 = Math.min(this.cols - 1, Math.ceil((this.mx + R) / this.cw));
    var r0 = Math.max(0, Math.floor((this.my - R) / this.ch)), r1 = Math.min(this.rows - 1, Math.ceil((this.my + R) / this.ch));
    for (var j = r0; j <= r1; j++) {
      for (var c = c0; c <= c1; c++) {
        var x = c * this.cw, y = j * this.ch;
        var d = Math.hypot(x - this.mx, y - this.my);
        if (d > R) continue;
        var k = 1 - d / R;
        ctx.globalAlpha = k * k * 0.9 * Math.min(1, this.heat * 1.5);
        var bit = Math.random() < 0.04 * k ? !this.digits[j * this.cols + c] : this.digits[j * this.cols + c];
        ctx.fillText(bit ? '1' : '0', x, y);
      }
    }
    ctx.globalAlpha = 1;
  };

  /* ---------- public bits ---------- */

  readPalette();
  var field = null;

  window.KitchenBinary = {
    scenes: scenes,
    textScene: textScene,
    create: function (canvas, opts) {
      var art = new BinaryArt(canvas, opts);
      io.observe(canvas);
      return art;
    },
    field: function (base, glow) { field = new Field(base, glow); return field; },
    // every picture that has started shows `scene` for `ms`, then goes back to what it was doing
    takeover: function (scene, ms) {
      arts.forEach(function (a) {
        if (!a.scene || a.held) return;
        a.restore = a.scene;
        a.pending = null;
        a.applyScene(scene);
        a.held = true;
      });
      setTimeout(function () {
        arts.forEach(function (a) {
          if (!a.held) return;
          a.held = false;
          a.applyScene(a.pending || a.restore);
          a.pending = a.restore = null;
        });
      }, ms);
    },
    refresh: function () {
      readPalette();
      if (field) field.paint();
      arts.forEach(function (a) { a.draw(performance.now() / 1000); });
    }
  };

  // fonts change glyph widths; repaint once they've arrived
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { window.KitchenBinary.refresh(); });
})();
