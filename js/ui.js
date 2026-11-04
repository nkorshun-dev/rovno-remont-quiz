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

/** Лента портфолио: скролл колесом, тачем и стрелками, snap, полоса прогресса. */
export function initRibbon(root) {
  const track = root.querySelector('.ribbon__track');
  const items = [...track.children];
  const bar = root.querySelector('.ribbon__bar span');
  const prev = root.querySelector('[data-rib="-1"]');
  const nextB = root.querySelector('[data-rib="1"]');
  const smooth = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');
  const pos = (li) => li.offsetLeft - items[0].offsetLeft;
  const max = () => track.scrollWidth - track.clientWidth;
  const index = () => items.reduce((best, li, k) => (Math.abs(pos(li) - track.scrollLeft) < Math.abs(pos(items[best]) - track.scrollLeft) ? k : best), 0);
  const to = (i) => track.scrollTo({ left: pos(items[Math.min(Math.max(i, 0), items.length - 1)]), behavior: smooth() });

  const update = () => {
    const m = max();
    const w = m > 0 ? (track.clientWidth / track.scrollWidth) * 100 : 100;
    const p = m > 0 ? track.scrollLeft / m : 0;
    bar.style.width = `${w}%`;
    bar.style.transform = `translateX(${p * (100 / w - 1) * 100}%)`;
    prev.disabled = track.scrollLeft <= 2;
    nextB.disabled = track.scrollLeft >= m - 2;
  };

  prev.addEventListener('click', () => to(index() - 1));
  nextB.addEventListener('click', () => to(index() + 1));
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); to(index() + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); to(index() - 1); }
  });
  // Колесо мыши: вертикальный жест листает ленту, у края — снова страницу
  let lock = 0;
  track.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const dir = Math.sign(e.deltaY);
    if ((dir < 0 && track.scrollLeft <= 2) || (dir > 0 && track.scrollLeft >= max() - 2)) return;
    e.preventDefault();
    if (Date.now() < lock) return;
    lock = Date.now() + 450;
    to(index() + dir);
  }, { passive: false });
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
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
