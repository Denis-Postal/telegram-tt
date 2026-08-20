import type { BotApiResponse, BotApiUpdate, BotApiUser } from './types';

import { BOT_FILE_URL_PREFIX } from './types';
import { getBotToken } from './session';

const BOT_API_BASE = 'https://api.telegram.org/bot';
const GET_UPDATES_LIMIT = 100;

let updateOffset = 0;
let isPolling = false;
let shouldStopPolling = false;

async function parseBotApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json() as BotApiResponse<T>;
  if (!data.ok) {
    throw new Error(data.description || 'Bot API error');
  }

  return data.result;
}

async function callBotApi<T>(method: string, params?: Record<string, unknown>): Promise<T> {
  const token = getBotToken();
  if (!token) {
    throw new Error('Bot token is not set');
  }

  const response = await fetch(`${BOT_API_BASE}${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });

  return parseBotApiResponse<T>(response);
}

async function callBotApiFormData<T>(method: string, formData: FormData): Promise<T> {
  const token = getBotToken();
  if (!token) {
    throw new Error('Bot token is not set');
  }

  const response = await fetch(`${BOT_API_BASE}${token}/${method}`, {
    method: 'POST',
    body: formData,
  });

  return parseBotApiResponse<T>(response);
}

export async function botApiGetMe(): Promise<BotApiUser> {
  return callBotApi<BotApiUser>('getMe');
}

export async function botApiDeleteWebhook() {
  try {
    await callBotApi<boolean>('deleteWebhook', { drop_pending_updates: false });
  } catch {
    // Ignore webhook cleanup errors
  }
}

export async function botApiGetChat(chatId: string) {
  return callBotApi<import('./types').BotApiChatFull>('getChat', { chat_id: chatId });
}

export async function botApiGetUserProfilePhotos(userId: string, offset = 0, limit = 100) {
  return callBotApi<import('./types').BotApiUserProfilePhotos>('getUserProfilePhotos', {
    user_id: userId,
    offset,
    limit,
  });
}

export async function botApiGetFile(fileId: string) {
  return callBotApi<import('./types').BotApiFile>('getFile', { file_id: fileId });
}

export function buildBotFileUrl(fileId: string) {
  return `${BOT_FILE_URL_PREFIX}${fileId}`;
}

export async function fetchBotFileBlob(fileId: string): Promise<Blob | undefined> {
  const token = getBotToken();
  if (!token) return undefined;

  try {
    const file = await botApiGetFile(fileId);
    if (!file.file_path) return undefined;

    const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
    if (!response.ok) return undefined;

    return response.blob();
  } catch {
    return undefined;
  }
}

export async function botApiSendMessage(chatId: string, text: string) {
  return callBotApi<import('./types').BotApiMessage>('sendMessage', {
    chat_id: chatId,
    text,
  });
}

export async function botApiSendPhoto(
  chatId: string,
  photo: Blob,
  filename: string,
  caption?: string,
) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', photo, filename);
  if (caption) {
    formData.append('caption', caption);
  }

  return callBotApiFormData<import('./types').BotApiMessage>('sendPhoto', formData);
}

export async function botApiSendDocument(
  chatId: string,
  document: Blob,
  filename: string,
  caption?: string,
) {
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', document, filename);
  if (caption) {
    formData.append('caption', caption);
  }

  return callBotApiFormData<import('./types').BotApiMessage>('sendDocument', formData);
}

export async function syncBotUpdates(onUpdate: (update: BotApiUpdate) => void) {
  while (true) {
    const updates = await callBotApi<BotApiUpdate[]>('getUpdates', {
      offset: updateOffset,
      limit: GET_UPDATES_LIMIT,
    });

    if (!updates.length) {
      break;
    }

    updates.forEach((update) => {
      updateOffset = update.update_id + 1;
      onUpdate(update);
    });
  }
}

export function startBotUpdatesPolling(onUpdate: (update: BotApiUpdate) => void) {
  if (isPolling) {
    shouldStopPolling = true;
    isPolling = false;
  }

  isPolling = true;
  shouldStopPolling = false;

  void pollLoop(onUpdate);
}

export function stopBotUpdatesPolling() {
  shouldStopPolling = true;
  isPolling = false;
}

async function pollLoop(onUpdate: (update: BotApiUpdate) => void) {
  while (!shouldStopPolling && getBotToken()) {
    try {
      const updates = await callBotApi<BotApiUpdate[]>('getUpdates', {
        offset: updateOffset,
        timeout: 0,
        allowed_updates: ['message', 'edited_message'],
      });

      updates.forEach((update) => {
        updateOffset = update.update_id + 1;
        try {
          onUpdate(update);
        } catch {
          // Ignore update processing errors to keep polling alive
        }
      });
    } catch {
      await new Promise((resolve) => {
        setTimeout(resolve, 3000);
      });
    }
  }

  isPolling = false;
}

export async function drainBotUpdates(onUpdate: (update: BotApiUpdate) => void) {
  while (true) {
    let updates: BotApiUpdate[];
    try {
      updates = await callBotApi<BotApiUpdate[]>('getUpdates', {
        offset: updateOffset,
        timeout: 0,
        allowed_updates: ['message', 'edited_message'],
      });
    } catch {
      break;
    }

    if (!updates.length) {
      break;
    }

    updates.forEach((update) => {
      updateOffset = update.update_id + 1;
      try {
        onUpdate(update);
      } catch {
        // Ignore update processing errors
      }
    });
  }
}

export function resetBotUpdateOffset() {
  updateOffset = 0;
}

export function getBotUpdateOffset() {
  return updateOffset;
}

export function setBotUpdateOffset(offset: number) {
  updateOffset = offset;
}

export function isBotFileUrl(url: string) {
  return url.startsWith(BOT_FILE_URL_PREFIX);
}

export function getBotFileIdFromUrl(url: string) {
  return url.slice(BOT_FILE_URL_PREFIX.length);
}
