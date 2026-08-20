import { ACCOUNT_SLOT } from '../../util/multiaccount';

import type { BotStoreSnapshot } from './store';

const BOT_CACHE_STORAGE_PREFIX = 'tt_bot_cache_';

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

export function getBotCacheStorageKey() {
  return `${BOT_CACHE_STORAGE_PREFIX}${ACCOUNT_SLOT || 1}`;
}

export function loadBotCacheFromStorage(): BotStoreSnapshot | undefined {
  if (!canUseLocalStorage()) {
    return undefined;
  }

  try {
    const raw = localStorage.getItem(getBotCacheStorageKey());
    if (!raw) {
      return undefined;
    }

    return JSON.parse(raw) as BotStoreSnapshot;
  } catch {
    return undefined;
  }
}

export function saveBotCacheToStorage(snapshot: BotStoreSnapshot) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    localStorage.setItem(getBotCacheStorageKey(), JSON.stringify(snapshot));
  } catch {
    // Ignore quota errors
  }
}

export function clearBotCacheFromStorage() {
  if (!canUseLocalStorage()) {
    return;
  }

  localStorage.removeItem(getBotCacheStorageKey());
}
