import { sendApiUpdate, sendImmediateApiUpdate } from '../gramjs/updates/apiUpdateEmitter';
import {
  buildApiChatFromBotApi,
  buildApiMessageFromBotApi,
  buildApiUserFromBotApi,
  buildApiUserFromBotApiChat,
} from './converters';
import {
  botApiDeleteWebhook,
  botApiGetChat,
  botApiGetMe,
  drainBotUpdates,
  resetBotUpdateOffset,
  setBotUpdateOffset,
  stopBotUpdatesPolling,
  syncBotUpdates,
} from './client';
import { scheduleSaveBotCache } from './persist';
import {
  clearStoredBotToken,
  ensureBotSession,
  getBotToken,
  initBotSession,
  isBotSession,
  loadStoredBotMode,
  loadStoredBotToken,
  storeBotToken,
} from './session';
import {
  getBotId,
  getBotStoreUser,
  getBotUser,
  importBotStoreSnapshot,
  processBotApiUpdate,
  resetBotStore,
  setBotInfo,
  upsertBotUser,
} from './store';
import type { BotApiUpdate } from './types';
import type { BotStoreSnapshot } from './store';

export {
  isBotSession,
  ensureBotSession,
  getBotToken,
  getBotUser,
  initBotSession,
  loadStoredBotToken,
  loadStoredBotMode,
  storeBotToken,
  clearStoredBotToken,
};

export { botFetchChats, botFetchPinnedDialogs } from './methods/chats';
export { botFetchFullChat, botFetchPeerSettings, botSearchChats } from './methods/chatInfo';
export { botFetchMessages, botSendMessage } from './methods/messages';
export { downloadBotMedia } from './methods/media';
export {
  botFetchFullUser,
  botFetchUsers,
  botFetchProfilePhotos,
  botFetchCommonChats,
  botFetchContactList,
  botFetchNearestCountry,
} from './methods/users';
export { isBotFileUrl } from './client';
export type { BotStoreSnapshot } from './store';

async function enrichBotUserPhoto(userId: string) {
  const storedUser = getBotStoreUser(userId);
  if (storedUser && !storedUser.isMin) {
    return;
  }

  try {
    const chatInfo = await botApiGetChat(userId);
    const user = buildApiUserFromBotApiChat(chatInfo);
    upsertBotUser(user);

    sendApiUpdate({
      '@type': 'updateUser',
      id: userId,
      user,
    });
  } catch {
    // Ignore missing chats
  }
}

function emitBotApiUpdate(update: Parameters<typeof sendApiUpdate>[0]) {
  sendImmediateApiUpdate(update);
}

function emitBotIncomingUpdate(update: BotApiUpdate, botId: string) {
  const message = update.message || update.edited_message;
  if (!message) return;

  processBotApiUpdate(update);
  scheduleSaveBotCache();

  const apiMessage = buildApiMessageFromBotApi(message, botId);
  const chat = buildApiChatFromBotApi(message.chat);

  emitBotApiUpdate({
    '@type': 'updateChat',
    id: chat.id,
    chat,
  });

  if (message.from) {
    const user = buildApiUserFromBotApi(message.from);
    upsertBotUser(user);

    emitBotApiUpdate({
      '@type': 'updateUser',
      id: String(message.from.id),
      user,
    });

    void enrichBotUserPhoto(String(message.from.id));
  }

  if (message.chat.type === 'private') {
    const user = buildApiUserFromBotApi({
      id: message.chat.id,
      first_name: message.chat.first_name || chat.title,
      last_name: message.chat.last_name,
      username: message.chat.username,
      is_bot: false,
    });
    upsertBotUser(user);

    emitBotApiUpdate({
      '@type': 'updateUser',
      id: String(message.chat.id),
      user,
    });

    void enrichBotUserPhoto(String(message.chat.id));
  }

  if (update.edited_message) {
    emitBotApiUpdate({
      '@type': 'updateMessage',
      chatId: apiMessage.chatId,
      id: apiMessage.id,
      message: apiMessage,
      isFull: true,
    });
    return;
  }

  emitBotApiUpdate({
    '@type': 'newMessage',
    chatId: apiMessage.chatId,
    id: apiMessage.id,
    message: apiMessage,
  });

  emitBotApiUpdate({
    '@type': 'botMessagesUpdated',
    chatId: apiMessage.chatId,
  });
}

export async function pollBotUpdates() {
  if (!ensureBotSession()) {
    return;
  }

  const botId = getBotId();
  if (!botId) {
    return;
  }

  await drainBotUpdates((update) => {
    emitBotIncomingUpdate(update, botId);
  });
}

export async function initBotApi(token: string, botCache?: BotStoreSnapshot) {
  initBotSession(token);
  stopBotUpdatesPolling();

  if (botCache) {
    importBotStoreSnapshot(botCache);
    setBotUpdateOffset(botCache.updateOffset);
  } else {
    resetBotStore();
    resetBotUpdateOffset();
  }

  const botUser = await botApiGetMe();
  setBotInfo(botUser);

  const botId = String(botUser.id);

  await botApiDeleteWebhook();

  await syncBotUpdates((update) => {
    emitBotIncomingUpdate(update, botId);
  });

  scheduleSaveBotCache();

  const currentUser = buildApiUserFromBotApi(botUser, true);
  sendApiUpdate({
    '@type': 'updateCurrentUser',
    currentUser,
    currentUserFullInfo: {
      botInfo: {
        botId: currentUser.id,
        menuButton: { type: 'commands' },
      },
    },
  });

  if (botCache) {
    Object.keys(botCache.usersById).forEach((userId) => {
      void enrichBotUserPhoto(userId);
    });
  }
}

export function destroyBotApi(shouldClearToken?: boolean) {
  stopBotUpdatesPolling();
  resetBotStore();
  resetBotUpdateOffset();

  if (shouldClearToken) {
    clearStoredBotToken();
    sendApiUpdate({ '@type': 'clearBotCache' });
  }
}
