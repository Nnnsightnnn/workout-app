// canvas.js — Vanilla JS Figma-style design canvas
// Pan/zoom viewport with section and artboard layout. Zero dependencies.

(function() {
  'use strict';

  const CFG = {
    bg: '#f0eee9',
    grid: 'rgba(0,0,0,0.06)',
    label: 'rgba(60,50,40,0.7)',
    title: 'rgba(40,30,20,0.85)',
    subtitle: 'rgba(60,50,40,0.6)',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    minScale: 0.1,
    maxScale: 8,
  };

  // Unitless CSS properties (don't append 'px')
  const UNITLESS = new Set([
    'opacity','zIndex','fontWeight','lineHeight','flex','flexGrow','flexShrink',
    'order','orphans','widows','gridRow','gridColumn','zoom','tabSize',
  ]);

  /** Convert JS style object → inline CSS string */
  function css(obj) {
    if (!obj) return '';
    return Object.entries(obj).map(function(kv) {
      var k = kv[0], v = kv[1];
      if (v == null) return '';
      var prop = k.replace(/[A-Z]/g, function(m) { return '-' + m.toLowerCase(); });
      var val = typeof v === 'number' && !UNITLESS.has(k) ? v + 'px' : v;
      return prop + ':' + val;
    }).filter(Boolean).join(';');
  }

  /** Zero-pad number */
  function zpad(n, w) { return String(n).padStart(w || 3, '0'); }

  /** Grid SVG data URL */
  function gridSvg() {
    return 'url("data:image/svg+xml,%3Csvg width=\'120\' height=\'120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M120 0H0v120\' fill=\'none\' stroke=\'' + encodeURIComponent(CFG.grid) + '\' stroke-width=\'1\'/%3E%3C/svg%3E")';
  }

  // ─── Render canvas from SKIN object ───
  function renderCanvas(root) {
    var skin = window.SKIN;
    if (!skin) { root.textContent = 'No SKIN object defined.'; return; }

    // Viewport (captures events)
    var vp = document.createElement('div');
    vp.style.cssText = 'height:100vh;width:100vw;background:' + CFG.bg +
      ';overflow:hidden;overscroll-behavior:none;touch-action:none;position:relative;font-family:' +
      CFG.font + ';box-sizing:border-box';

    // World (transforms)
    var world = document.createElement('div');
    world.style.cssText = 'position:absolute;top:0;left:0;transform-origin:0 0;will-change:transform;' +
      'width:max-content;min-width:100%;min-height:100%;padding:60px 0 80px;' +
      'background-image:' + gridSvg() + ';background-size:120px 120px';

    var html = '';

    // Header
    if (skin.header) {
      var h = skin.header;
      html += '<div style="padding:20px 60px 40px;font-family:' + CFG.font + '">';
      if (h.tag) html += '<div style="font-size:11px;letter-spacing:0.3em;color:rgba(60,50,40,0.6);margin-bottom:8px">' + h.tag + '</div>';
      html += '<div style="font-size:64px;font-weight:600;letter-spacing:-0.03em;text-transform:uppercase;line-height:0.9;color:rgba(40,30,20,0.9)">' + h.title + '</div>';
      if (h.description) html += '<div style="margin-top:10px;max-width:720px;font-size:11px;letter-spacing:0.1em;line-height:1.7;color:rgba(60,50,40,0.7);text-transform:uppercase">' + h.description + '</div>';
      html += '</div>';
    }

    // Sections
    (skin.sections || []).forEach(function(sec) {
      var gap = sec.gap || 48;
      html += '<div style="margin-bottom:80px;position:relative">';
      html += '<div style="padding:0 60px 36px">';
      html += '<div style="font-size:22px;font-weight:600;color:' + CFG.title + ';letter-spacing:-0.3px;margin-bottom:4px">' + sec.title + '</div>';
      if (sec.subtitle) html += '<div style="font-size:14px;font-weight:400;color:' + CFG.subtitle + '">' + sec.subtitle + '</div>';
      html += '</div>';
      html += '<div style="display:flex;gap:' + gap + 'px;padding:0 60px;align-items:flex-start;width:max-content">';

      (sec.artboards || []).forEach(function(ab) {
        var w = ab.width || 402, h = ab.height || 874;
        html += '<div style="position:relative;flex-shrink:0">';
        if (ab.label) html += '<div style="position:absolute;bottom:100%;left:0;padding-bottom:8px;font-size:12px;font-weight:500;color:' + CFG.label + ';white-space:nowrap">' + ab.label + '</div>';
        html += '<div style="border-radius:2px;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 16px rgba(0,0,0,0.06);overflow:hidden;width:' + w + 'px;height:' + h + 'px;background:#fff">';
        html += (typeof ab.html === 'function' ? ab.html() : ab.html) || '';
        html += '</div></div>';
      });

      html += '</div></div>';
    });

    // Footer
    if (skin.footer) {
      html += '<div style="padding:0 60px;max-width:900px">';
      html += '<div style="font-size:11px;letter-spacing:0.14em;line-height:1.9;color:rgba(60,50,40,0.75);text-transform:uppercase;border-top:1px solid rgba(0,0,0,0.2);border-bottom:1px solid rgba(0,0,0,0.2);padding:14px 0">' + skin.footer + '</div>';
      html += '</div>';
    }

    world.innerHTML = html;
    vp.appendChild(world);
    root.appendChild(vp);
    setupPanZoom(vp, world);
  }

  // ─── Pan / Zoom ───
  function setupPanZoom(vp, world) {
    var tf = { x: 0, y: 0, scale: 1 };
    var apply = function() {
      world.style.transform = 'translate3d(' + tf.x + 'px,' + tf.y + 'px,0) scale(' + tf.scale + ')';
    };

    var zoomAt = function(cx, cy, factor) {
      var r = vp.getBoundingClientRect();
      var px = cx - r.left, py = cy - r.top;
      var next = Math.min(CFG.maxScale, Math.max(CFG.minScale, tf.scale * factor));
      var k = next / tf.scale;
      tf.x = px - (px - tf.x) * k;
      tf.y = py - (py - tf.y) * k;
      tf.scale = next;
      apply();
    };

    var isMouseWheel = function(e) {
      return e.deltaMode !== 0 ||
        (e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40);
    };

    var isGesturing = false, gsBase = 1, drag = null;

    vp.addEventListener('wheel', function(e) {
      e.preventDefault();
      if (isGesturing) return;
      if (e.ctrlKey) {
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        tf.x -= e.deltaX; tf.y -= e.deltaY; apply();
      }
    }, { passive: false });

    vp.addEventListener('gesturestart', function(e) { e.preventDefault(); isGesturing = true; gsBase = tf.scale; }, { passive: false });
    vp.addEventListener('gesturechange', function(e) { e.preventDefault(); zoomAt(e.clientX, e.clientY, (gsBase * e.scale) / tf.scale); }, { passive: false });
    vp.addEventListener('gestureend', function(e) { e.preventDefault(); isGesturing = false; }, { passive: false });

    vp.addEventListener('pointerdown', function(e) {
      var onBg = e.target === vp || e.target === vp.firstChild;
      if (!(e.button === 1 || (e.button === 0 && onBg))) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, lx: e.clientX, ly: e.clientY };
      vp.style.cursor = 'grabbing';
    });
    vp.addEventListener('pointermove', function(e) {
      if (!drag || e.pointerId !== drag.id) return;
      tf.x += e.clientX - drag.lx; tf.y += e.clientY - drag.ly;
      drag.lx = e.clientX; drag.ly = e.clientY; apply();
    });
    var endDrag = function(e) {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null; vp.style.cursor = '';
    };
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);
  }

  // Expose API
  window.DC = { css: css, zpad: zpad, renderCanvas: renderCanvas, CFG: CFG };
})();
