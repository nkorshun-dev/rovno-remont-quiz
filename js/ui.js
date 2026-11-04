// Интерфейс: меню, шапка, аккордеон, появление при скролле, слайдер отзывов, лента портфолио, модальные окна.

export function initMenu() {
  const btn = document.getElementById('burger');
  const nav = document.getElementById('nav');
  const mq = window.matchMedia('(min-width: 1100px)');
  const header = document.querySelector('.header');
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('no-scroll', open);
    header.classList.toggle('is-menu', open);
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => e.target.closest('a') && set(false));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true' && (set(false), btn.focus()));
  document.addEventListener('click', (e) => {
    if (btn.getAttribute('aria-expanded') === 'true' && !nav.contains(e.target) && !btn.contains(e.target)) set(false);
  });
  mq.addEventListener('change', () => set(false));
}

/** Шапка прозрачная над hero, после прокрутки — светлая с линией. */
export function initHeader() {
  const header = document.querySelector('.header');
  const update = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  window.addEventListener('scroll', update, { passive: true });
  update();
}

export function initAccordion(root) {
  root.addEventListener('click', (e) => {
    const b = e.target.closest('.acc__btn');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open));
    document.getElementById(b.getAttribute('aria-controls')).hidden = !open;
  });
}

export function initReveal() {
  const items = document.querySelectorAll('.reveal, .reveal-img');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  items.forEach((el) => io.observe(el));
}

/** Слайдер отзывов на scroll-snap: стрелки, счётчик «3 / 8», свайп. Таймеров нет — дублироваться нечему. */
export function initCarousel(root) {
  const track = root.querySelector('.carousel__track');
  const slides = [...track.children];
  const count = root.querySelector('.carousel__count');
  const prev = root.querySelector('[data-dir="-1"]');
  const nextB = root.querySelector('[data-dir="1"]');
  const step = () => slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0);
  const index = () => Math.round(track.scrollLeft / step());

  const update = () => {
    const i = index();
    const max = track.scrollWidth - track.clientWidth - 2;
    const txt = `${i + 1} / ${slides.length}`;
    if (count.textContent !== txt) count.textContent = txt;
    prev.disabled = track.scrollLeft <= 2;
    nextB.disabled = track.scrollLeft >= max;
  };
  const to = (i) => track.scrollTo({ left: i * step(), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

  prev.addEventListener('click', () => to(index() - 1));
  nextB.addEventListener('click', () => to(index() + 1));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); to(index() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); to(index() - 1); }
  });
  window.addEventListener('resize', update);
  update();
}

/**
 * Лента портфолио.
 * Десктоп (≥1024, мышь, без reduced-motion): секция закреплена (sticky), лента едет вбок
 * на столько же пикселей, на сколько прокручена страница внутри секции. Колесо не перехватываем.
 * Тач, планшет, reduced-motion: обычная лента со свайпом и snap.
 */
export function initRibbon(root) {
  const track = root.querySelector('.ribbon__track');
  const pin = root.querySelector('.ribbon__pin');
  const items = [...track.children];
  const bar = root.querySelector('.ribbon__bar span');
  const prev = root.querySelector('[data-rib="-1"]');
  const nextB = root.querySelector('[data-rib="1"]');
  const header = document.querySelector('.header');
  const mq = matchMedia('(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  let pinned = false, path = 0, pinTop = 0, raf = 0;

  const pos = (li) => li.offsetLeft - items[0].offsetLeft;
  const max = () => (pinned ? path : track.scrollWidth - track.clientWidth);
  // Текущий сдвиг ленты. Позицию секции берём каждый раз: квиз выше меняет высоту страницы.
  const cur = () => (pinned ? clamp(pinTop - root.getBoundingClientRect().top, 0, path) : track.scrollLeft);
  const go = (x) => {
    if (!pinned) return track.scrollTo({ left: x, behavior: smooth() });
    const start = root.getBoundingClientRect().top + window.scrollY - pinTop;
    window.scrollTo({ top: start + clamp(x, 0, path) }); // 1 px прокрутки = 1 px сдвига
  };
  const index = () => { const x = cur(); return items.reduce((best, li, k) => (Math.abs(pos(li) - x) < Math.abs(pos(items[best]) - x) ? k : best), 0); };
  const to = (i) => go(pos(items[clamp(i, 0, items.length - 1)]));

  const update = () => {
    raf = 0;
    const m = max(), x = cur();
    if (pinned) track.style.transform = `translate3d(${-x}px, 0, 0)`;
    const w = m > 0 ? (track.clientWidth / (track.clientWidth + m)) * 100 : 100;
    bar.style.width = `${w}%`;
    bar.style.transform = `translateX(${(m > 0 ? x / m : 0) * (100 / w - 1) * 100}%)`;
    prev.disabled = x <= 2;
    nextB.disabled = x >= m - 2;
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };

  const measure = () => {
    root.classList.toggle('is-pinned', mq.matches); // класс уменьшает фото под высоту окна — мерим уже с ним
    pinned = false;
    if (mq.matches) {
      const last = items[items.length - 1];
      path = Math.max(0, last.offsetLeft + last.offsetWidth + parseFloat(getComputedStyle(track).paddingRight) - track.clientWidth);
      const free = window.innerHeight - header.offsetHeight - pin.offsetHeight;
      // Закрепляем, только если лента целиком влезает под шапку и есть куда ехать
      if (path > 0 && free >= 16) {
        pinTop = header.offsetHeight + free / 2;
        root.style.setProperty('--pin-top', `${pinTop}px`);
        root.style.height = `${pin.offsetHeight + path}px`;
        pinned = true;
      } else root.classList.remove('is-pinned');
    }
    if (!pinned) { root.style.height = ''; track.style.transform = ''; }
    update();
  };

  prev.addEventListener('click', () => to(index() - 1));
  nextB.addEventListener('click', () => to(index() + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); to(index() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); to(index() - 1); }
  });
  // Tab по карточкам: в закреплённом режиме браузер не видит сдвиг — докручиваем страницу сами
  track.addEventListener('focusin', (e) => {
    const li = e.target.closest('.work');
    if (!pinned || !li) return;
    requestAnimationFrame(() => {
      const r = li.getBoundingClientRect(), t = pin.getBoundingClientRect(); // pin не сдвигается, в отличие от track
      const padL = parseFloat(getComputedStyle(track).paddingLeft);
      if (r.left < t.left + padL - 1 || r.right > t.right - padL + 1) go(pos(li));
    });
  });
  track.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('scroll', () => pinned && schedule(), { passive: true });
  window.addEventListener('resize', measure);
  mq.addEventListener('change', measure);
  track.addEventListener('load', measure, true); // load не всплывает — ловим на погружении
  document.fonts?.ready.then(measure);
  measure();
}

/** Модалки на <dialog>: фокус внутри, Esc, клик по фону. */
export function initModals() {
  const dialogs = document.querySelectorAll('dialog.modal');
  dialogs.forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target !== d && !e.target.closest('[data-close]')) return;
      d.close();
    });
  });
  const open = (d) => d.showModal(); // скролл блокирует CSS: body:has(dialog[open])

  const privacy = document.getElementById('modal-privacy');
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-privacy]')) open(privacy);
  });

  return { open };
}

/** Галерея портфолио в модалке. */
export function initGallery(items, { open }) {
  const dlg = document.getElementById('modal-gallery');
  const img = dlg.querySelector('.gallery__img');
  const cap = dlg.querySelector('.gallery__cap');
  const count = dlg.querySelector('.gallery__count');
  let item = null, i = 0;
  const show = (n) => {
    i = (n + item.photos.length) % item.photos.length;
    img.src = item.photos[i];
    img.alt = `${item.title}, фото ${i + 1}`;
    count.textContent = `${i + 1} / ${item.photos.length}`;
  };
  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-gallery]');
    if (!card) return;
    item = items.find((p) => p.id === card.dataset.gallery);
    cap.textContent = `${item.title}. ${item.area} м², ${item.type.toLowerCase()} ремонт, ${item.term}`;
    dlg.querySelector('h3').textContent = item.title;
    show(0);
    open(dlg);
  });
  dlg.querySelector('[data-g="-1"]').addEventListener('click', () => show(i - 1));
  dlg.querySelector('[data-g="1"]').addEventListener('click', () => show(i + 1));
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
}
