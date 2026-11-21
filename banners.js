(function () {
  'use strict';
  function initialize(root) {
    if (root.dataset.initialized === 'true') return;
    var slides = Array.prototype.slice.call(root.querySelectorAll('.ab-slide'));
    var track = root.querySelector('.ab-track');
    if (!track || slides.length < 2) return;
    var dots = Array.prototype.slice.call(root.querySelectorAll('.ab-dot'));
    var toggle = root.querySelector('.ab-toggle');
    var count = root.querySelector('.ab-count');
    var live = root.querySelector('.ab-live');
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var current = 0;
    var paused = motion.matches;
    var hover = false;
    var focused = false;
    var visible = true;
    var timer = null;
    var startX = null;
    var interval = Number(root.dataset.interval) || 6500;

    function stop() { if (timer !== null) { clearTimeout(timer); timer = null; } }
    function schedule() {
      stop();
      var running = !paused && !hover && !focused && !document.hidden && visible;
      root.dataset.running = String(running);
      if (running) timer = setTimeout(function () { show(current + 1, false); }, interval);
    }
    function updateToggle() {
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', paused ? 'Start automatic banner rotation' : 'Pause automatic banner rotation');
      toggle.setAttribute('aria-pressed', String(paused));
    }
    function show(index, manual) {
      current = (index + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      slides.forEach(function (slide, i) {
        var active = i === current;
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
        slide.querySelectorAll('a,button,[tabindex]').forEach(function (element) {
          if (active) element.removeAttribute('tabindex'); else element.setAttribute('tabindex', '-1');
        });
      });
      dots.forEach(function (dot, i) { dot.setAttribute('aria-current', String(i === current)); });
      count.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
      root.dataset.active = String(current);
      if (manual) live.textContent = 'Banner ' + (current + 1) + ' of ' + slides.length + ': ' + slides[current].dataset.title;
      schedule();
    }
    root.querySelector('.ab-prev').addEventListener('click', function () { show(current - 1, true); });
    root.querySelector('.ab-next').addEventListener('click', function () { show(current + 1, true); });
    dots.forEach(function (dot, i) { dot.addEventListener('click', function () { show(i, true); }); });
    toggle.addEventListener('click', function () {
      paused = !paused;
      if (!paused) { focused = false; hover = false; }
      updateToggle(); schedule();
    });
    if (window.matchMedia('(hover: hover)').matches) {
      root.addEventListener('mouseenter', function () { hover = true; schedule(); });
      root.addEventListener('mouseleave', function () { hover = false; schedule(); });
    }
    root.addEventListener('focusin', function () { focused = true; schedule(); });
    root.addEventListener('focusout', function () {
      setTimeout(function () { focused = root.contains(document.activeElement); schedule(); }, 0);
    });
    root.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1), true);
      }
    });
    root.addEventListener('touchstart', function (event) { startX = event.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (event) {
      if (startX === null) return;
      var distance = event.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(distance) > 50) show(current + (distance < 0 ? 1 : -1), true);
    }, { passive: true });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting; schedule();
      }, { threshold: 0.08 }).observe(root);
    }
    if (motion.addEventListener) motion.addEventListener('change', function (event) {
      if (event.matches) { paused = true; updateToggle(); schedule(); }
    });
    root.dataset.initialized = 'true';
    root.classList.add('ab-ready');
    updateToggle(); show(0, false);
  }
  function initializeAll() { document.querySelectorAll('.ab-rotator').forEach(initialize); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeAll); else initializeAll();
})();
