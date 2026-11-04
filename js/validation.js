// Валидация и демо-отправка форм. Данные никуда не уходят.
import { DATA } from './data.js';
import { initPhoneMask } from './phone-mask.js';

const NAME_RE = /^\p{L}[\p{L}\s-]*$/u;
const PHONE_RE = /^\+375 \((25|29|33|44)\) \d{3}-\d{2}-\d{2}$/;

export function validateField(input) {
  const v = input.value.trim();
  if (input.name === 'name') {
    if (v.length < 2 || !NAME_RE.test(v)) return 'Введите имя: от 2 букв, без цифр';
  }
  if (input.name === 'phone' && !PHONE_RE.test(input.value)) return 'Введите телефон полностью: +375 (29) 123-45-67. Коды: 25, 29, 33, 44';
  if (input.name === 'consent' && !input.checked) return 'Нужно согласие на обработку данных';
  return '';
}

function setError(input, msg) {
  const err = document.getElementById(`${input.id}-err`);
  if (err) err.textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

/** HTML формы. prefix делает id уникальными. */
export function contactFormHtml(prefix, { time = false, button = 'Отправить', light = false } = {}) {
  const f = (name, label, attrs) => `
    <div class="field">
      <label for="${prefix}-${name}">${label}</label>
      <input id="${prefix}-${name}" name="${name}" ${attrs} aria-describedby="${prefix}-${name}-err" required>
      <p class="field__error" id="${prefix}-${name}-err" aria-live="polite"></p>
    </div>`;
  return `<form class="form${light ? ' form--light' : ''}" novalidate>
    ${f('name', 'Ваше имя', 'type="text" autocomplete="given-name" placeholder="Иван"')}
    ${f('phone', 'Телефон', 'type="tel" inputmode="tel" autocomplete="tel" placeholder="+375 (29) 123-45-67"')}
    ${time ? `<div class="field">
      <label for="${prefix}-time">Удобное время звонка</label>
      <select id="${prefix}-time" name="time">${DATA.callTimes.map((t) => `<option>${t}</option>`).join('')}</select>
    </div>` : ''}
    <div class="field field--check">
      <label class="check"><input type="checkbox" id="${prefix}-consent" name="consent" aria-describedby="${prefix}-consent-err" required>
        <span>Согласен на обработку данных (<button type="button" class="link" data-open-privacy>политика конфиденциальности</button>)</span></label>
      <p class="field__error" id="${prefix}-consent-err" aria-live="polite"></p>
    </div>
    <button class="btn btn--primary btn--block" type="submit">${button}</button>
    <p class="form__demo">Демо-режим: данные никуда не отправляются</p>
  </form>`;
}

export function attachForm(form, { extra } = {}) {
  const fields = [...form.querySelectorAll('input[name], select')];
  const checked = fields.filter((el) => el.name === 'name' || el.name === 'phone' || el.name === 'consent');
  const phone = form.elements.phone;
  if (phone) initPhoneMask(phone);

  fields.forEach((el) => {
    const clear = () => el.getAttribute('aria-invalid') === 'true' && !validateField(el) && setError(el, '');
    el.addEventListener('input', clear);
    el.addEventListener('change', clear);
    el.addEventListener('blur', () => el.name !== 'consent' && el.value && setError(el, validateField(el)));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.dataset.busy) return; // защита от двойной отправки
    let first = null;
    checked.forEach((el) => {
      const msg = validateField(el);
      setError(el, msg);
      if (msg && !first) first = el;
    });
    if (first) return first.focus();

    form.dataset.busy = '1';
    const btn = form.querySelector('[type="submit"]');
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Отправляем…';
    await new Promise((r) => setTimeout(r, 900));

    const id = `Р-${10000 + Math.floor(Math.random() * 90000)}`;
    const payload = { id, ...Object.fromEntries(new FormData(form)), ...(extra ? extra() : {}) };
    console.info('[DEMO] Заявка (никуда не отправлена):', payload);

    const ok = document.createElement('div');
    ok.className = 'success';
    ok.setAttribute('role', 'status');
    ok.tabIndex = -1;
    ok.innerHTML = `<p class="success__title">Заявка ${id} принята</p>
      <p>Перезвоним в течение 20 минут в рабочее время.</p>
      <p class="form__demo">Демо-режим: данные никуда не отправляются</p>
      <button type="button" class="btn btn--ghost" data-again>Отправить ещё одну заявку</button>`;
    ok.querySelector('[data-again]').addEventListener('click', () => {
      form.reset();
      fields.forEach((el) => setError(el, ''));
      delete form.dataset.busy;
      btn.disabled = false;
      btn.textContent = label;
      ok.replaceWith(form);
      form.elements.name.focus();
    });
    form.replaceWith(ok);
    ok.focus();
  });
}
