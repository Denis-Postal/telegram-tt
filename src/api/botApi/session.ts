import { ACCOUNT_SLOT } from '../../util/multiaccount';

const BOT_TOKEN_STORAGE_PREFIX = 'tt_bot_token_';
const BOT_MODE_STORAGE_PREFIX = 'tt_bot_mode_';

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined';
}

export function getBotTokenStorageKey() {
  return `${BOT_TOKEN_STORAGE_PREFIX}${ACCOUNT_SLOT || 1}`;
}

function getBotModeStorageKey() {
  return `${BOT_MODE_STORAGE_PREFIX}${ACCOUNT_SLOT || 1}`;
}

let activeBotToken: string | undefined;
let isBotModeActive = false;

export function initBotSession(token?: string) {
  isBotModeActive = true;
  if (token) {
    activeBotToken = token;
  }
}

export function getBotToken() {
  return activeBotToken;
}

export function isBotSession() {
  return isBotModeActive;
}

export function ensureBotSession() {
  if (isBotModeActive) {
    return true;
  }

  if (canUseLocalStorage()) {
    loadStoredBotToken();
  }

  return isBotModeActive;
}

export function storeBotToken(token: string) {
  activeBotToken = token;
  isBotModeActive = true;

  if (canUseLocalStorage()) {
    localStorage.setItem(getBotTokenStorageKey(), token);
    localStorage.setItem(getBotModeStorageKey(), '1');
  }
}

export function loadStoredBotToken() {
  if (!canUseLocalStorage()) {
    return activeBotToken;
  }

  const isBotMode = localStorage.getItem(getBotModeStorageKey()) === '1';
  if (isBotMode) {
    isBotModeActive = true;
  }

  const token = localStorage.getItem(getBotTokenStorageKey()) || undefined;
  if (token) {
    activeBotToken = token;
    isBotModeActive = true;
  }

  return token;
}

export function loadStoredBotMode() {
  if (!canUseLocalStorage()) {
    return isBotModeActive;
  }

  return localStorage.getItem(getBotModeStorageKey()) === '1';
}

export function clearStoredBotToken() {
  activeBotToken = undefined;
  isBotModeActive = false;

  if (canUseLocalStorage()) {
    localStorage.removeItem(getBotTokenStorageKey());
    localStorage.removeItem(getBotModeStorageKey());
  }
}
