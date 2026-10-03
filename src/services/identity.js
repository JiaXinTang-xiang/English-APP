import { computed, ref } from 'vue';
import { getItem, removeItem, setItem } from './storage';
import { supabase, supabaseEnabled } from './supabase';

const MODE_KEY = 'cet4-user-mode-v1';
const mode = ref('unknown');
const user = ref(null);
const ready = ref(false);
let authSubscription = null;

export const identity = {
  mode,
  user,
  ready,
  isGuest: computed(() => mode.value === 'guest'),
  isAccount: computed(() => mode.value === 'account' && Boolean(user.value)),
  label: computed(() => user.value?.email || (mode.value === 'guest' ? '游客' : '未登录'))
};

export async function initializeIdentity() {
  if (ready.value) return identity;
  if (supabaseEnabled) {
    const { data } = await supabase.auth.getSession();
    user.value = data.session?.user || null;
  }
  mode.value = user.value ? 'account' : 'guest';
  if (!user.value && (await getItem(MODE_KEY)) !== 'guest') await setItem(MODE_KEY, 'guest');
  if (supabaseEnabled && !authSubscription) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user || null;
      if (user.value) {
        mode.value = 'account';
        void setItem(MODE_KEY, 'account');
      } else if (mode.value === 'account') {
        mode.value = 'unknown';
        void removeItem(MODE_KEY);
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
}

export async function chooseAccount(accountUser) {
  user.value = accountUser;
  mode.value = 'account';
  await setItem(MODE_KEY, 'account');
}

export async function clearIdentity() {
  user.value = null;
  mode.value = 'unknown';
  await removeItem(MODE_KEY);
}
