// Маска +375 (XX) XXX-XX-XX. Работает при вводе, вставке (в т.ч. 80291234567) и удалении.
export function localDigits(value) {
  let d = String(value).replace(/\D/g, '');
  if (d.startsWith('375')) d = d.slice(3);
  else if (d.startsWith('80')) d = d.slice(2);
  return d.slice(0, 9);
}

export function formatPhone(value) {
  const d = localDigits(value);
  if (!d) return '';
  let s = `+375 (${d.slice(0, 2)}`;
  if (d.length >= 2) s += ')';
  if (d.length > 2) s += ` ${d.slice(2, 5)}`;
  if (d.length > 5) s += `-${d.slice(5, 7)}`;
  if (d.length > 7) s += `-${d.slice(7, 9)}`;
  return s;
}

// Индекс в отформатированной строке сразу после n-й значащей цифры номера (первые три цифры — префикс 375).
const caretAfter = (s, n) => {
  let seen = 0;
  for (let i = 0; i < s.length; i++) if (/\d/.test(s[i]) && ++seen === n + 3) return i + 1;
  return s.length;
};

export function initPhoneMask(input) {
  let prev = '';
  input.addEventListener('input', (e) => {
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const atEnd = caret >= raw.length;
    let left = localDigits(raw.slice(0, caret)).length; // цифр левее каретки
    let d = localDigits(raw);
    // удалили скобку/пробел/дефис — цифры не изменились, значит убираем цифру перед кареткой
    if (String(e.inputType).startsWith('delete') && d === prev && d && left > 0) {
      d = d.slice(0, left - 1) + d.slice(left);
      left--;
    }
    input.value = formatPhone(d);
    prev = d;
    const pos = atEnd || !d ? input.value.length : caretAfter(input.value, Math.min(left, d.length));
    input.setSelectionRange(pos, pos);
  });
}
