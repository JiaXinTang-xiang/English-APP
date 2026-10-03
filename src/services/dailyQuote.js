import { getJson, setJson } from './storage';

const QUOTE_KEY = 'cet4-daily-quote-v1';
const quotes = [
  '前路浩浩荡荡，万事尽可期待。', '努力的意义，在于让自己有选择权。', '那些看似不起波澜的日复一日，终会让你看到坚持的意义。',
  '半山腰总是最挤的，你得去山顶看看。', '关关难过关关过，前路漫漫亦灿灿。', '所有幸运，都是努力埋下的伏笔。',
  '别怕路长，一步一步走总会抵达。', '坚持很难，但放弃会更遗憾。', '追风赶月莫停留，平芜尽处是春山。',
  '星光不问赶路人，时光不负有心人。', '生活原本沉闷，但跑起来就有风。', '不必和别人比，只和过去的自己较量。',
  '道阻且长，行则将至；行而不辍，未来可期。', '厚积薄发，静候花开。', '沉下心打磨自己，时间会给出答案。',
  '保持热爱，奔赴山海。', '越努力，越幸运。', '停止内耗，专注当下。', '耕耘当下，收获来日。', '心有所期，全力以赴。'
];

export async function getDailyQuote() {
  const date = localDate();
  const saved = await getJson(QUOTE_KEY, null);
  if (saved?.date === date && quotes[saved.index]) return quotes[saved.index];
  const index = Math.floor(Math.random() * quotes.length);
  await setJson(QUOTE_KEY, { date, index });
  return quotes[index];
}

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
