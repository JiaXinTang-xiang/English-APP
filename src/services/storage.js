import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const isNative = Capacitor.isNativePlatform();

async function nativeGet(key) {
  const { value } = await Preferences.get({ key });
  if (value !== null) return value;
  const legacyValue = localStorage.getItem(key);
  if (legacyValue !== null) await Preferences.set({ key, value: legacyValue });
  return legacyValue;
}

export async function getItem(key) {
  return isNative ? nativeGet(key) : localStorage.getItem(key);
}

export async function setItem(key, value) {
  const serialized = String(value);
  if (isNative) return Preferences.set({ key, value: serialized });
  localStorage.setItem(key, serialized);
}

export async function removeItem(key) {
  if (isNative) return Preferences.remove({ key });
  localStorage.removeItem(key);
}

export async function getJson(key, fallback) {
  try {
    const value = await getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function setJson(key, value) {
  return setItem(key, JSON.stringify(value));
}

export const storagePlatform = isNative ? 'preferences' : 'localStorage';
