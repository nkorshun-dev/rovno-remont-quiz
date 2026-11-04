// Квиз-калькулятор: состояние {step, answers} хранится в localStorage, расчёт — в estimate.js.
import { DATA } from './data.js';
import { calcEstimate, formatMoney, formatNumber, pluralWeeks } from './estimate.js';
import { attachForm, contactFormHtml } from './validation.js';

const KEY = 'rovno:quiz-v1';
const TOTAL = 6;
// Площадь по умолчанию 54 м²: ползунок и поле сразу показывают одно и то же, «Далее» активна.
const EMPTY = () => ({ housing: null, type: null, area: 54, baths: null, bathKind: null, options: [], start: null });

const store = {
  read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } },
  write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* приватный режим */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* ничего */ } },
};

const has = (list, id) => list.some((x) => String(x.id) === String(id));
const areaOk = (a) => Number.isInteger(a) && a >= DATA.area.min && a <= DATA.area.max;

const STEPS = [
  { title: 'Какое у вас жильё?', hint: 'От этого зависит объём подготовки стен и пола.', valid: (a) => has(DATA.housing, a.housing) },
  { title: 'Какой нужен ремонт?', hint: 'Цена указана за работы, без материалов.', valid: (a) => has(DATA.repairTypes, a.type) },
  { title: 'Какая площадь?', hint: 'Общая площадь квартиры по техпаспорту. Введите число или тяните ползунок.', valid: (a) => areaOk(a.area) },
  { title: 'Сколько санузлов?', hint: 'Санузлы считаем отдельно: плитка, гидроизоляция и сантехника.', valid: (a) => has(DATA.bathroom.counts, a.baths) && has(DATA.bathroom.kinds, a.bathKind) },
  { title: 'Что добавить к ремонту?', hint: 'Можно выбрать несколько или пропустить.', valid: (a) => Array.isArray(a.options) && a.options.every((id) => has(DATA.options, id)) },
  { title: 'Когда хотите начать?', hint: 'Это поможет спланировать замер, ни к чему не обязывает.', valid: (a) => has(DATA.start, a.start) },
];

function load() {
  const s = store.read();
  if (!s || typeof s !== 'object' || !s.answers) return { step: 0, answers: EMPTY() };
  const answers = { ...EMPTY(), ...s.answers };
  if (!areaOk(answers.area)) answers.area = null;
  answers.options = Array.isArray(answers.options) ? answers.options.filter((id) => has(DATA.options, id)) : []; // мусор в options отбрасываем
  let step = Number.isInteger(s.step) ? Math.min(Math.max(s.step, 0), TOTAL) : 0;
  const firstBad = STEPS.findIndex((st) => !st.valid(answers));
  if (firstBad !== -1 && step > firstBad) step = firstBad; // нельзя перепрыгнуть неотвеченные шаги
  return { step, answers };
}

const radio = (name, value, checked, body, cls = '') => `
  <label class="opt${cls}"><input type="radio" name="${name}" value="${value}"${checked ? ' checked' : ''}>
  <span class="opt__body">${body}</span></label>`;

function stepHtml(i, a) {
  const legend = `<legend class="quiz__title visually-hidden" id="quiz-title" tabindex="-1">${STEPS[i].title}</legend>`;
  const tile = (img, body) => `<span class="opt__img"><img src="${img}" srcset="${img.replace('w=480&h=360', 'w=240&h=180')} 240w, ${img} 480w" sizes="(min-width: 560px) 260px, 112px" width="480" height="360" alt="" loading="lazy"><span class="opt__check"></span></span>${body}`;
  if (i === 0) {
    return `<fieldset class="quiz__fs">${legend}<div class="opts opts--tiles">${DATA.housing.map((h) =>
      radio('housing', h.id, a.housing === h.id, tile(h.photo, `<strong>${h.label}</strong><small>${h.hint}</small>`), ' opt--tile')).join('')}</div></fieldset>`;
  }
  if (i === 1) {
    return `<fieldset class="quiz__fs">${legend}<div class="opts opts--tiles">${DATA.repairTypes.map((t) =>
      radio('type', t.id, a.type === t.id, tile(t.photo, `<strong>${t.label}</strong><small>${t.desc}</small><em>${t.pricePerM2} BYN/м² работ</em>`), ' opt--tile')).join('')}</div></fieldset>`;
  }
  if (i === 2) {
    const { min, max, step } = DATA.area;
    const v = a.area ?? 54;
    return `<fieldset class="quiz__fs">${legend}
      <div class="area">
        <label class="area__num" for="area-num">Площадь, м²</label>
        <div class="area__val"><input id="area-num" type="number" inputmode="numeric" min="${min}" max="${max}" step="${step}" value="${a.area ?? ''}" placeholder="54"><span aria-hidden="true">м²</span></div>
        <input id="area-range" type="range" min="${min}" max="${max}" step="${step}" value="${v}" aria-label="Площадь, ползунок">
        <div class="area__scale"><span>${min} м²</span><span>${max} м²</span></div>
        <p class="field__error" id="area-err" aria-live="polite"></p>
      </div></fieldset>`;
  }
  if (i === 3) {
    const grp = (name, list, cur, label) => `<div class="quiz__group"><p class="quiz__sub" id="g-${name}">${label}</p>
      <div class="opts opts--rows opts--inline" role="radiogroup" aria-labelledby="g-${name}">${list.map((c) => radio(name, c.id, String(cur) === String(c.id), `<strong>${c.label}</strong>`)).join('')}</div></div>`;
    return `<fieldset class="quiz__fs">${legend}${grp('baths', DATA.bathroom.counts, a.baths, 'Количество')}${grp('bathKind', DATA.bathroom.kinds, a.bathKind, 'Тип')}</fieldset>`;
  }
  if (i === 4) {
    return `<fieldset class="quiz__fs">${legend}<div class="opts opts--rows">${DATA.options.map((o) => `
      <label class="opt opt--check"><input type="checkbox" name="options" value="${o.id}"${a.options.includes(o.id) ? ' checked' : ''}>
      <span class="opt__body"><strong>${o.label}</strong><small>${o.hint}</small><em>${o.perM2 ? `${o.perM2} BYN/м²` : formatMoney(o.fixed)}</em></span></label>`).join('')}</div></fieldset>`;
  }
  return `<fieldset class="quiz__fs">${legend}<div class="opts opts--rows">${DATA.start.map((s) =>
    radio('start', s.id, a.start === s.id, `<strong>${s.label}</strong>`)).join('')}</div></fieldset>`;
}

function resultHtml(a, est) {
  const type = DATA.repairTypes.find((t) => t.id === a.type);
  const house = DATA.housing.find((h) => h.id === a.housing);
  const rows = [
    [`Работы: ${type.label.toLowerCase()} ремонт, ${a.area} м², ${house.label.toLowerCase()}`, est.works],
    [`Санузлы: ${a.baths}${a.baths === 3 ? '+' : ''}, ${a.bathKind === 'separate' ? 'раздельные' : 'совмещённые'}`, est.bathrooms],
    ...est.options.map((o) => [o.label, o.sum]),
  ];
  return `<div class="result"><div class="result__grid">
    <div class="result__left">
    <p class="label">Ваша смета</p>
    <h3 class="result__title" tabindex="-1" id="quiz-title">Ориентировочная стоимость</h3>
    <div class="result__total" aria-live="polite" aria-atomic="true">
      <span class="result__range">от ${formatNumber(est.min)} до ${formatMoney(est.max)}</span>
      <span class="result__weeks">Срок работ: примерно ${pluralWeeks(est.weeks)}</span>
    </div>
    </div>
    <div class="result__right">
    <table class="result__table"><caption class="visually-hidden">Разбивка сметы по позициям</caption><tbody>
      ${rows.map(([l, s]) => `<tr><th scope="row">${l}</th><td>${formatMoney(s)}</td></tr>`).join('')}
      <tr class="result__sum"><th scope="row">Итого (расчётная цена)</th><td>${formatMoney(est.total)}</td></tr>
    </tbody></table>
    <p class="result__note">Ориентировочный расчёт. Точную смету составим после бесплатного замера.</p>
    </div></div>
    <div class="result__form"><h4>Получить точную смету</h4>${contactFormHtml('quiz', { time: true, button: 'Получить точную смету' })}</div>
    <div class="result__actions"><button type="button" class="btn btn--ghost" data-act="edit">Изменить ответы</button>
    <button type="button" class="btn btn--ghost" data-act="restart">Начать заново</button></div>
  </div>`;
}

export function initQuiz(root) {
  let { step, answers } = load();
  const save = () => store.write({ step, answers });

  root.innerHTML = `
    <p class="quiz__counter visually-hidden" id="quiz-counter" aria-live="polite"></p>
    <div class="quiz__grid">
      <div class="quiz__side">
        <p class="quiz__num" aria-hidden="true"><span id="quiz-n"></span><small>/ ${String(TOTAL).padStart(2, '0')}</small></p>
        <p class="quiz__name" id="quiz-name" aria-hidden="true"></p>
        <div class="progress" role="progressbar" aria-label="Прогресс квиза" aria-valuemin="0" aria-valuemax="${TOTAL}"><span></span></div>
        <p class="quiz__hint" id="quiz-hint"></p>
        <button type="button" class="link quiz__restart" data-act="restart">Начать заново</button>
      </div>
      <div class="quiz__main">
        <div class="quiz__body" id="quiz-body"></div>
        <div class="quiz__nav" id="quiz-nav">
          <button type="button" class="btn btn--ghost" data-act="back">Назад</button>
          <button type="button" class="btn btn--primary" data-act="next"><span class="next__t">Далее</span> <span class="arr" aria-hidden="true">→</span></button>
        </div>
      </div>
    </div>`;

  const body = root.querySelector('#quiz-body');
  const counter = root.querySelector('#quiz-counter');
  const bar = root.querySelector('.progress');
  const nav = root.querySelector('#quiz-nav');
  const next = root.querySelector('[data-act="next"]');
  const back = root.querySelector('[data-act="back"]');
  const nextT = next.querySelector('.next__t');
  const num = root.querySelector('#quiz-n');
  const name = root.querySelector('#quiz-name');
  const hint = root.querySelector('#quiz-hint');

  const syncNext = () => { next.disabled = !STEPS[step].valid(answers); };

  function render(focus) {
    const done = step >= TOTAL;
    counter.textContent = done ? 'Расчёт готов' : `Шаг ${step + 1} из ${TOTAL}`;
    bar.setAttribute('aria-valuenow', Math.min(step + (done ? 0 : 1), TOTAL));
    bar.firstElementChild.style.width = `${(done ? 100 : ((step + 1) / TOTAL) * 100)}%`;
    nav.hidden = done;
    root.classList.toggle('is-done', done);
    if (!done) { num.textContent = String(step + 1).padStart(2, '0'); name.textContent = STEPS[step].title; hint.textContent = STEPS[step].hint; }
    if (done) {
      body.innerHTML = resultHtml(answers, calcEstimate(answers));
      attachForm(body.querySelector('form'), { extra: () => ({ answers, estimate: calcEstimate(answers) }) });
    } else {
      body.innerHTML = stepHtml(step, answers);
      back.disabled = step === 0;
      nextT.textContent = step === TOTAL - 1 ? 'Показать смету' : 'Далее';
      syncNext();
    }
    if (focus) body.querySelector('#quiz-title')?.focus({ preventScroll: false });
    save();
  }

  const go = (n) => { root.dataset.dir = n < step ? 'back' : 'fwd'; step = n; render(true); };

  body.addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'options') answers.options = [...body.querySelectorAll('[name="options"]:checked')].map((x) => x.value);
    else if (el.name === 'baths') answers.baths = Number(el.value);
    else if (['housing', 'type', 'bathKind', 'start'].includes(el.name)) answers[el.name] = el.value;
    else return;
    save(); syncNext();
  });

  // Ползунок и поле площади синхронизированы
  body.addEventListener('input', (e) => {
    if (e.target.id !== 'area-range' && e.target.id !== 'area-num') return;
    const num = body.querySelector('#area-num'), range = body.querySelector('#area-range'), err = body.querySelector('#area-err');
    const v = Number(e.target.value);
    if (e.target.id === 'area-range') num.value = v;
    const ok = areaOk(v) && e.target.value !== '';
    answers.area = ok ? v : null;
    if (ok) range.value = v;
    err.textContent = ok || e.target.value === '' ? '' : `Введите площадь от ${DATA.area.min} до ${DATA.area.max} м²`;
    save(); syncNext();
  });

  root.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'next' && STEPS[step].valid(answers)) go(step + 1);
    else if (act === 'back' && step > 0) go(step - 1);
    else if (act === 'edit') go(TOTAL - 1);
    else if (act === 'restart') { store.clear(); answers = EMPTY(); go(0); }
  });

  // Enter на выбранной карточке — к следующему шагу
  body.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.matches('input:not([type="submit"])') && !e.target.closest('form') && STEPS[step]?.valid(answers)) {
      e.preventDefault(); go(step + 1);
    }
  });

  render(false);
}
