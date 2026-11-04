// Чистые функции расчёта сметы: без DOM, без localStorage, без побочных эффектов.
import { DATA } from './data.js';

const byId = (list, id, what) => {
  const item = list.find((x) => String(x.id) === String(id));
  if (!item) throw new Error(`Неизвестное значение (${what}): ${id}`);
  return item;
};
const roundTo = (n, step) => Math.round(n / step) * step;

export function formatNumber(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
export const formatMoney = (n, data = DATA) => `${formatNumber(n)} ${data.currency}`;

export function pluralWeeks(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} неделя`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} недели`;
  return `${n} недель`;
}

/** answers: { housing, type, area, baths (1|2|3), bathKind, options: [id] } */
export function calcEstimate(answers, data = DATA) {
  const area = Number(answers.area);
  if (!(area >= data.area.min && area <= data.area.max)) throw new Error(`Некорректная площадь: ${answers.area}`);
  const type = byId(data.repairTypes, answers.type, 'вид ремонта');
  const house = byId(data.housing, answers.housing, 'тип жилья');
  const baths = Number(answers.baths);
  byId(data.bathroom.counts, baths, 'санузлы');
  byId(data.bathroom.kinds, answers.bathKind, 'вид санузла');

  const works = Math.round(area * type.pricePerM2 * house.coef);
  const perBath = data.bathroom.price + (answers.bathKind === 'separate' ? data.bathroom.separateExtra : 0);
  const bathrooms = baths * perBath;
  const options = (answers.options || []).map((id) => {
    const o = byId(data.options, id, 'опция');
    return { id: o.id, label: o.label, sum: Math.round(o.perM2 ? o.perM2 * area : o.fixed), weeks: o.weeks };
  });
  const optionsSum = options.reduce((s, o) => s + o.sum, 0);
  const total = works + bathrooms + optionsSum;
  const weeksRaw = type.weeks.base + area * type.weeks.perM2 + baths * data.bathroom.weeksEach
    + options.reduce((s, o) => s + o.weeks, 0);

  return {
    works, bathrooms, options, optionsSum, total,
    min: roundTo(total * (1 - data.range), 10),
    max: roundTo(total * (1 + data.range), 10),
    weeks: Math.max(1, Math.ceil(weeksRaw)),
  };
}
