// Слайдер «до/после»: мышь, касание (pointer events) и клавиши ←/→, Home/End.
export function initBeforeAfter(root = document) {
  root.querySelectorAll('[data-ba]').forEach((frame) => {
    const handle = frame.querySelector('[role="slider"]');
    let pos = 50;

    const set = (v) => {
      pos = Math.min(100, Math.max(0, v));
      frame.style.setProperty('--pos', `${pos}%`);
      handle.setAttribute('aria-valuenow', Math.round(pos));
      handle.setAttribute('aria-valuetext', `Показано «до»: ${Math.round(pos)}%`);
    };
    const fromEvent = (e) => {
      const r = frame.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };

    frame.addEventListener('pointerdown', (e) => {
      frame.setPointerCapture(e.pointerId);
      frame.classList.add('is-drag');
      fromEvent(e);
      handle.focus({ preventScroll: true });
    });
    frame.addEventListener('pointermove', (e) => frame.hasPointerCapture(e.pointerId) && fromEvent(e));
    const end = (e) => { frame.classList.remove('is-drag'); frame.hasPointerCapture(e.pointerId) && frame.releasePointerCapture(e.pointerId); };
    frame.addEventListener('pointerup', end);
    frame.addEventListener('pointercancel', end);

    handle.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 5;
      const map = { ArrowLeft: pos - step, ArrowDown: pos - step, ArrowRight: pos + step, ArrowUp: pos + step, Home: 0, End: 100 };
      if (!(e.key in map)) return;
      e.preventDefault();
      set(map[e.key]);
    });

    set(50);
  });
}
