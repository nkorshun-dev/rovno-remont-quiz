// Точка входа: рисует секции из data.js и запускает модули.
import { DATA } from './data.js';
import { calcEstimate, formatMoney, pluralWeeks } from './estimate.js';
import { initQuiz } from './quiz.js';
import { initBeforeAfter } from './before-after.js';
import { attachForm, contactFormHtml } from './validation.js';
import { initMenu, initHeader, initAccordion, initReveal, initCarousel, initRibbon, initModals, initGallery } from './ui.js';

const $ = (sel) => document.querySelector(sel);
const nn = (i) => String(i + 1).padStart(2, '0');
// srcset из одной ссылки Unsplash: подставляем нужные w и h
const srcset = (url, sizes) => sizes.map(([w, h]) => `${url.replace(/w=d+&h=d+/, `w=${w}&h=${h}`)} ${w}w`).join(', ');
const BA_SIZES = [[800, 500], [1200, 750], [1600, 1000]];
const stars = (n) => `<span class="stars" role="img" aria-label="Оценка ${n} из 5">${'★'.repeat(n)}<span class="stars__off">${'★'.repeat(5 - n)}</span></span>`;
const baCaption = (b) => `<strong>${b.district}, ${b.area} м²</strong><span>${b.type} ремонт · ${b.term}</span><span class="ba__cost">${formatMoney(b.cost)}</span>`;

function render() {
  const c = DATA.company;

  $('#facts').innerHTML = DATA.facts.map((f) => `<li><strong>${f.value}</strong> ${f.label}</li>`).join('');

  const b = DATA.beforeAfter[0];
  $('#ba-list').innerHTML = `
    <div class="ba-tabs" role="group" aria-label="Выбор объекта">${DATA.beforeAfter.map((x, i) =>
      `<button type="button" class="ba-tab" data-i="${i}" aria-pressed="${i === 0}" aria-label="${nn(i)}, ${x.district}">${nn(i)}</button>`).join('')}</div>
    <figure class="ba reveal">
      <div class="ba__frame" data-ba>
        <img class="ba__img" src="${b.after}" srcset="${srcset(b.after, BA_SIZES)}" sizes="(min-width: 1360px) 1264px, 100vw" width="1600" height="1000" loading="lazy" alt="После ремонта, ${b.district}" draggable="false">
        <img class="ba__img ba__img--before" src="${b.before}" srcset="${srcset(b.before, BA_SIZES)}" sizes="(min-width: 1360px) 1264px, 100vw" width="1600" height="1000" loading="lazy" alt="До ремонта, ${b.district}" draggable="false">
        <span class="ba__tag ba__tag--l">До</span><span class="ba__tag ba__tag--r">После</span>
        <div class="ba__handle" role="slider" tabindex="0" aria-label="Сравнение до и после, ${b.district}" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
          <span class="ba__knob" aria-hidden="true">&#8596;</span>
        </div>
      </div>
      <figcaption>${baCaption(b)}</figcaption>
    </figure>`;

  $('#portfolio-list').innerHTML = DATA.portfolio.map((p, i) => {
    const [w, h] = i % 2 ? [800, 1000] : [1200, 900];
    const src = p.photos[0].replace('w=960&h=640', `w=${w}&h=${h}`);
    return `<li class="work reveal">
      <button type="button" class="work__btn" data-gallery="${p.id}" aria-label="Открыть галерею: ${p.title}">
        <span class="work__img zoom"><img src="${src}" srcset="${srcset(src, [[w / 2, h / 2], [w * 0.75, h * 0.75], [w, h]])}" sizes="${i % 2 ? '(min-width: 650px) 400px, 62vw' : '(min-width: 720px) 560px, 78vw'}" width="${w}" height="${h}" loading="lazy" alt="${p.title}"></span>
      </button>
      <p class="work__meta">${p.district} · ${p.area} м² · ${p.term} · ${formatMoney(p.cost)}</p>
      <h3 class="work__title">${p.title}</h3>
    </li>`;
  }).join('');

  $('#price-rows').innerHTML = DATA.repairTypes.map((t) => {
    const weeks = calcEstimate({ housing: 'new', type: t.id, area: 50, baths: 1, bathKind: 'combined', options: [] }).weeks;
    return `<li class="tier reveal">
      <h3 class="tier__name">${t.label}</h3>
      <p class="tier__price">${t.pricePerM2}</p>
      <span class="tier__unit">BYN за м² работ</span>
      <ul class="tier__list" aria-label="Что входит">${t.includes.map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="tier__ex"><strong>Не входит:</strong> ${t.excludes.join(', ').toLowerCase()}</p>
      <p class="tier__term"><span>Срок для 50 м²</span><span>${pluralWeeks(weeks)}</span></p>
    </li>`;
  }).join('');

  $('#stages-list').innerHTML = DATA.stages.map((s, i) => `
    <li class="stage reveal"><span class="stage__n">${nn(i)}</span><h3>${s.title}</h3><span class="stage__term">${s.term}</span><p>${s.text}</p></li>`).join('');

  $('#why-list').innerHTML = DATA.why.map((w, i) => `<li class="why__item reveal"><span class="why__n">${nn(i)}</span><div><h3>${w.title}</h3><p>${w.text}</p></div></li>`).join('');

  $('#reviews-track').innerHTML = DATA.reviews.map((r, i) => `
    <li class="review" aria-label="Отзыв ${i + 1} из ${DATA.reviews.length}">
      <blockquote class="review__text">${r.text}</blockquote>
      <p class="review__who"><strong>${r.name}</strong> · ${r.meta}</p>
      <div class="review__head">${stars(r.rating)}<span>${r.date}</span></div>
      ${r.reply ? `<p class="review__reply"><strong>Ответ компании.</strong> ${r.reply}</p>` : ''}</li>`).join('');

  $('#faq-list').innerHTML = DATA.faq.map((f, i) => `
    <div class="acc__item"><h3><button type="button" class="acc__btn" id="faq-b${i}" aria-expanded="false" aria-controls="faq-p${i}">${f.q}<span class="acc__ico" aria-hidden="true"></span></button></h3>
    <div class="acc__panel" id="faq-p${i}" role="region" aria-labelledby="faq-b${i}" hidden><p>${f.a}</p></div></div>`).join('');

  $('#privacy-text').innerHTML = DATA.privacy.map((t) => `<p>${t}</p>`).join('');

  $('#cta-form').innerHTML = contactFormHtml('cta', { button: 'Вызвать мастера на замер', light: true });

  // Телефон декоративный (демо): только текст, без tel:
  document.querySelectorAll('[data-phone]').forEach((el) => {
    el.textContent = c.phone;
    el.setAttribute('aria-label', `Телефон ${c.phone} (в демо не активно)`);
  });
}

// Переключатель объектов «01 02 03» над слайдером до/после
function initBaTabs() {
  const root = $('#ba-list');
  const frame = root.querySelector('[data-ba]');
  const [after, before] = frame.querySelectorAll('.ba__img');
  const handle = frame.querySelector('[role="slider"]');
  root.querySelector('.ba-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.ba-tab');
    if (!btn || btn.getAttribute('aria-pressed') === 'true') return;
    const b = DATA.beforeAfter[Number(btn.dataset.i)];
    root.querySelectorAll('.ba-tab').forEach((t) => t.setAttribute('aria-pressed', String(t === btn)));
    frame.classList.add('is-swap');
    after.addEventListener('load', () => frame.classList.remove('is-swap'), { once: true });
    after.srcset = srcset(b.after, BA_SIZES); after.src = b.after; after.alt = `После ремонта, ${b.district}`;
    before.srcset = srcset(b.before, BA_SIZES); before.src = b.before; before.alt = `До ремонта, ${b.district}`;
    handle.setAttribute('aria-label', `Сравнение до и после, ${b.district}`);
    root.querySelector('figcaption').innerHTML = baCaption(b);
  });
}

render();
initMenu();
initHeader();
initReveal();
initQuiz($('#quiz-root'));
initBeforeAfter();
initBaTabs();
initRibbon($('#ribbon'));
initAccordion($('#faq-list'));
initCarousel($('#reviews'));
const modals = initModals();
initGallery(DATA.portfolio, modals);
attachForm($('#cta-form form'));
