import { computed, ref } from 'vue';
import { getItem, getJson, removeItem, setItem, setJson } from './storage';
import { supabase, supabaseEnabled } from './supabase';

const MODE_KEY = 'cet4-user-mode-v1';
const PROFILE_GUEST_KEY = 'vocab-profile-guest-v1';
const mode = ref('unknown');
const user = ref(null);
const profile = ref(emptyProfile());
const ready = ref(false);
let authSubscription = null;

export const identity = {
  mode,
  user,
  profile,
  ready,
  isGuest: computed(() => mode.value === 'guest'),
  isAccount: computed(() => mode.value === 'account' && Boolean(user.value)),
  label: computed(() => profile.value.displayName || profile.value.nickname || user.value?.email || (mode.value === 'guest' ? '游客' : '未登录'))
};

export async function initializeIdentity() {
  if (ready.value) return identity;
  if (supabaseEnabled) {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user || null;
  }
  mode.value = user.value ? 'account' : 'guest';
  if (!user.value && (await getItem(MODE_KEY)) !== 'guest') await setItem(MODE_KEY, 'guest');
  await loadProfile();
  if (supabaseEnabled && !authSubscription) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null;
      if (user.value) {
        mode.value = 'account';
        void setItem(MODE_KEY, 'account');
        void loadProfile();
      } else if (mode.value === 'account') {
        mode.value = 'unknown';
        void removeItem(MODE_KEY);
        profile.value = emptyProfile();
      }
    });
    authSubscription = data.subscription;
  }
  ready.value = true;
  return identity;
}

export async function chooseGuest() {
  if (supabaseEnabled && user.value) await supabase.auth.signOut();
  user.value = null;
  mode.value = 'guest';
  await setItem(MODE_KEY, 'guest');
  await loadProfile();
}

export async function chooseAccount(accountUser) {
  user.value = accountUser;
  mode.value = 'account';
  await setItem(MODE_KEY, 'account');
  await loadProfile();
}

export async function clearIdentity() {
  user.value = null;
  mode.value = 'unknown';
  profile.value = emptyProfile();
  await removeItem(MODE_KEY);
}

export async function saveProfile(value) {
  const next = normalizeProfile(value);
  profile.value = next;
  await setJson(profileStorageKey(), next);
  if (!user.value || !supabaseEnabled) return next;

  const payload = {
    id: user.value.id,
    nickname: next.nickname || null,
    display_name: next.displayName || null,
    gender: next.gender || 'secret'
  };
  let result = await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
  if (result.error && /display_name|gender|column/i.test(result.error.message || '')) {
    result = await supabase.from('profiles').upsert({ id: user.value.id, nickname: next.nickname || null }, { onConflict: 'id' });
  }
  if (result.error) throw result.error;
  return next;
}

async function loadProfile() {
  const cached = await getJson(profileStorageKey(), null);
  profile.value = normalizeProfile(cached);
  if (!user.value || !supabaseEnabled) return profile.value;

  let result = await supabase.from('profiles').select('id,nickname,display_name,gender').eq('id', user.value.id).maybeSingle();
  if (result.error && /display_name|gender|column/i.test(result.error.message || '')) {
    result = await supabase.from('profiles').select('id,nickname').eq('id', user.value.id).maybeSingle();
  }
  if (result.error) return profile.value;
  if (result.data) {
    profile.value = normalizeProfile(result.data);
    await setJson(profileStorageKey(), profile.value);
  }
  return profile.value;
}

function profileStorageKey() {
  return user.value?.id ? `vocab-profile-${user.value.id}` : PROFILE_GUEST_KEY;
}

function emptyProfile() {
  return { displayName: '', nickname: '', gender: 'secret' };
}

function normalizeProfile(value) {
  return {
    displayName: String(value?.displayName ?? value?.display_name ?? '').trim().slice(0, 40),
    nickname: String(value?.nickname ?? '').trim().slice(0, 40),
    gender: ['male', 'female', 'secret'].includes(value?.gender) ? value.gender : 'secret'
  };
}
