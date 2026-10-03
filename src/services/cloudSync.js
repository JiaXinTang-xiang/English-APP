import { supabase, supabaseEnabled } from './supabase';

const LEVEL = 'cet4';

export async function getCloudUser() {
  if (!supabaseEnabled) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function signUp(email, password) {
  if (!supabase) throw new Error('Supabase 尚未配置');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase 尚未配置');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function sendEmailCode(email) {
  if (!supabase) throw new Error('Supabase 尚未配置');
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true }
  });
  if (error) throw error;
}

export async function verifyEmailCode(email, token) {
  if (!supabase) throw new Error('Supabase 尚未配置');
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function pullProgress() {
  const user = await getCloudUser();
  if (!user) return null;
  const [wordsResult, daysResult, settingsResult] = await Promise.all([
    supabase.from('word_progress').select('*').eq('user_id', user.id).eq('level', LEVEL),
    supabase.from('day_progress').select('*').eq('user_id', user.id).eq('level', LEVEL),
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle()
  ]);
  for (const result of [wordsResult, daysResult, settingsResult]) if (result.error) throw result.error;
  return {
    user,
    words: wordsResult.data || [],
    days: daysResult.data || [],
    settings: settingsResult.data || null
  };
}

export async function pushProgress(progress, audio) {
  const user = await getCloudUser();
  if (!user) return false;
  const wordRows = Object.entries(progress.words || {}).map(([word, value]) => ({
    user_id: user.id, level: LEVEL, word,
    right_count: value.right || 0, wrong_count: value.wrong || 0,
    in_wrong_book: Boolean(value.inWrongBook), wrong_review_count: value.wrongReviewCount || 0,
    last_right: value.lastRight || null, last_wrong: value.lastWrong || null,
    wrong_day: value.wrongDay || null, updated_at: new Date().toISOString()
  }));
  const dayRows = Object.entries(progress.daySchedule || {}).map(([day, schedule]) => ({
    user_id: user.id, level: LEVEL, day: Number(day), learned_date: schedule.learnedDate || null,
    reviewed_days: schedule.reviewed || [],
    learned_count: progress.days?.[day] || 0, updated_at: new Date().toISOString()
  }));
  const writes = [];
  if (wordRows.length) writes.push(supabase.from('word_progress').upsert(wordRows, { onConflict: 'user_id,level,word' }));
  if (dayRows.length) writes.push(supabase.from('day_progress').upsert(dayRows, { onConflict: 'user_id,level,day' }));
  writes.push(supabase.from('user_settings').upsert({ user_id: user.id, auto_play: Boolean(audio?.auto), accent: audio?.accent || 'us', updated_at: new Date().toISOString() }, { onConflict: 'user_id' }));
  const results = await Promise.all(writes);
  const failed = results.find(result => result.error);
  if (failed) throw failed.error;
  return true;
}

export function cloudProgressToLocal(cloud) {
  const words = {};
  for (const row of cloud?.words || []) words[row.word] = {
    right: row.right_count || 0, wrong: row.wrong_count || 0,
    inWrongBook: Boolean(row.in_wrong_book), wrongReviewCount: row.wrong_review_count || 0,
    lastRight: row.last_right || undefined, lastWrong: row.last_wrong || undefined, wrongDay: row.wrong_day || undefined
  };
  const days = {}, daySchedule = {};
  for (const row of cloud?.days || []) {
    days[row.day] = row.learned_count || 0;
    daySchedule[row.day] = { learnedDate: row.learned_date, reviewed: row.reviewed_days || [] };
  }
  return { words, days, daySchedule };
}

export function mergeProgress(local = {}, cloud = {}) {
  const merged = { words: {}, days: {}, daySchedule: {} };
  const localWords = local.words || {}, cloudWords = cloud.words || {};
  for (const key of new Set([...Object.keys(localWords), ...Object.keys(cloudWords)])) {
    const first = localWords[key] || {}, second = cloudWords[key] || {};
    const inWrongBook = Boolean(first.inWrongBook || second.inWrongBook);
    const reviewCounts = [first.wrongReviewCount, second.wrongReviewCount].filter(value => value !== undefined);
    merged.words[key] = compact({
      right: Math.max(first.right || 0, second.right || 0),
      wrong: Math.max(first.wrong || 0, second.wrong || 0),
      inWrongBook,
      wrongReviewCount: reviewCounts.length
        ? (inWrongBook ? Math.min(...reviewCounts) : Math.max(...reviewCounts))
        : 0,
      lastRight: latestDate(first.lastRight, second.lastRight),
      lastWrong: latestDate(first.lastWrong, second.lastWrong),
      wrongDay: first.wrongDay ?? second.wrongDay
    });
  }

  const localDays = local.days || {}, cloudDays = cloud.days || {};
  for (const day of new Set([...Object.keys(localDays), ...Object.keys(cloudDays)])) {
    merged.days[day] = Math.max(localDays[day] || 0, cloudDays[day] || 0);
  }

  const localSchedule = local.daySchedule || {}, cloudSchedule = cloud.daySchedule || {};
  for (const day of new Set([...Object.keys(localSchedule), ...Object.keys(cloudSchedule)])) {
    const first = localSchedule[day] || {}, second = cloudSchedule[day] || {};
    merged.daySchedule[day] = {
      learnedDate: earliestDate(first.learnedDate, second.learnedDate),
      reviewed: [...new Set([...(first.reviewed || []), ...(second.reviewed || [])])].sort((a, b) => a - b)
    };
  }
  return merged;
}

function compact(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function latestDate(first, second) {
  return [first, second].filter(Boolean).sort().at(-1);
}

function earliestDate(first, second) {
  return [first, second].filter(Boolean).sort().at(0);
}
