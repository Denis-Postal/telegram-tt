import type { ApiChat } from '../types/chats';
import type { ApiMessage } from '../types/messages';
import type { ApiUser } from '../types/users';

import {
  buildApiChatFromBotApi,
  buildApiMessageFromBotApi,
  buildApiUserFromBotApi,
} from './converters';
import type { BotApiMessage, BotApiUpdate, BotApiUser } from './types';
import { BOT_FILE_URL_PREFIX } from './types';

function stripBotAvatarPhotoId(user: ApiUser): ApiUser {
  if (!user.avatarPhotoId?.startsWith(BOT_FILE_URL_PREFIX)) {
    return user;
  }

  return {
    ...user,
    avatarPhotoId: undefined,
  };
}

export type BotStoreSnapshot = {
  updateOffset: number;
  botId?: string;
  botUser?: ApiUser;
  chatsById: Record<string, ApiChat>;
  usersById: Record<string, ApiUser>;
  messagesByChatId: Record<string, ApiMessage[]>;
  lastMessageDateByChatId: Record<string, number>;
  sortedChatIds: string[];
};

type BotStoreState = Omit<BotStoreSnapshot, 'updateOffset'>;

const store: BotStoreState = {
  chatsById: {},
  usersById: {},
  messagesByChatId: {},
  lastMessageDateByChatId: {},
  sortedChatIds: [],
};

export function resetBotStore() {
  store.botId = undefined;
  store.botUser = undefined;
  store.chatsById = {};
  store.usersById = {};
  store.messagesByChatId = {};
  store.lastMessageDateByChatId = {};
  store.sortedChatIds = [];
}

export function exportBotStoreSnapshot(updateOffset: number): BotStoreSnapshot {
  return {
    updateOffset,
    botId: store.botId,
    botUser: store.botUser,
    chatsById: store.chatsById,
    usersById: store.usersById,
    messagesByChatId: store.messagesByChatId,
    lastMessageDateByChatId: store.lastMessageDateByChatId,
    sortedChatIds: store.sortedChatIds,
  };
}

export function importBotStoreSnapshot(snapshot: BotStoreSnapshot) {
  store.botId = snapshot.botId;
  store.botUser = snapshot.botUser ? stripBotAvatarPhotoId(snapshot.botUser) : undefined;
  store.chatsById = snapshot.chatsById;
  store.usersById = Object.fromEntries(
    Object.entries(snapshot.usersById).map(([id, user]) => [id, stripBotAvatarPhotoId(user)]),
  );
  store.messagesByChatId = snapshot.messagesByChatId;
  store.lastMessageDateByChatId = snapshot.lastMessageDateByChatId;
  store.sortedChatIds = snapshot.sortedChatIds;
}

export function setBotInfo(botUser: BotApiUser) {
  store.botId = String(botUser.id);
  store.botUser = buildApiUserFromBotApi(botUser, true);
  store.usersById[store.botId] = store.botUser;
}

export function getBotId() {
  return store.botId;
}

export function getBotUser() {
  return store.botUser;
}

export function getBotStoreUser(userId: string) {
  return store.usersById[userId];
}

export function getBotStoreChat(chatId: string) {
  return store.chatsById[chatId];
}

export function upsertBotUser(user: ApiUser) {
  store.usersById[user.id] = user;
}

export function upsertBotChat(chat: ApiChat) {
  store.chatsById[chat.id] = chat;
}

function upsertChat(chatId: string, chat: ApiChat) {
  store.chatsById[chatId] = chat;
}

function upsertUser(user: ApiUser) {
  store.usersById[user.id] = user;
}

function upsertMessage(message: ApiMessage) {
  const { chatId } = message;
  const existingMessages = store.messagesByChatId[chatId] || [];
  const existingIndex = existingMessages.findIndex((m) => m.id === message.id);

  if (existingIndex >= 0) {
    existingMessages[existingIndex] = message;
  } else {
    existingMessages.push(message);
    existingMessages.sort((a, b) => a.id - b.id);
  }

  store.messagesByChatId[chatId] = existingMessages;
  store.lastMessageDateByChatId[chatId] = message.date;

  if (!store.sortedChatIds.includes(chatId)) {
    store.sortedChatIds.push(chatId);
  }

  store.sortedChatIds.sort((a, b) => (
    (store.lastMessageDateByChatId[b] || 0) - (store.lastMessageDateByChatId[a] || 0)
  ));
}

export function processBotApiUpdate(update: BotApiUpdate) {
  const message = update.message || update.edited_message;
  if (!message || !store.botId) return;

  const apiMessage = buildApiMessageFromBotApi(message, store.botId);
  const chat = buildApiChatFromBotApi(message.chat);
  upsertChat(chat.id, chat);

  if (message.from) {
    upsertUser(buildApiUserFromBotApi(message.from));
  }

  if (message.chat.type === 'private') {
    upsertUser(buildApiUserFromBotApi({
      id: message.chat.id,
      first_name: message.chat.first_name || chat.title,
      last_name: message.chat.last_name,
      username: message.chat.username,
    }));
  }

  upsertMessage(apiMessage);
}

export function getBotStoreChats(limit: number, offset = 0) {
  const chatIds = store.sortedChatIds.slice(offset, offset + limit);
  const chats = chatIds.map((id) => store.chatsById[id]).filter(Boolean);
  const users = Object.values(store.usersById);
  const messages = chatIds
    .map((id) => store.messagesByChatId[id]?.[store.messagesByChatId[id].length - 1])
    .filter(Boolean) as ApiMessage[];

  const lastMessageByChatId: Record<string, number> = {};
  chatIds.forEach((id) => {
    lastMessageByChatId[id] = store.lastMessageDateByChatId[id] || 0;
  });

  return {
    chatIds,
    chats,
    users,
    messages,
    lastMessageByChatId,
    totalChatCount: store.sortedChatIds.length,
    hasMore: offset + limit < store.sortedChatIds.length,
  };
}

export function getBotStoreMessages(chatId: string, limit: number, offsetId?: number) {
  const allMessages = store.messagesByChatId[chatId] || [];
  let filtered = allMessages;

  if (offsetId) {
    filtered = allMessages.filter((m) => m.id < offsetId);
  }

  const sliceStart = Math.max(0, filtered.length - limit);
  const messages = filtered.slice(sliceStart);
  const chat = store.chatsById[chatId];
  const users = messages
    .map((m) => m.senderId && store.usersById[m.senderId])
    .filter(Boolean) as ApiUser[];

  return {
    messages,
    users,
    chats: chat ? [chat] : [],
    count: allMessages.length,
  };
}

export function addSentMessage(message: ApiMessage) {
  const chat = store.chatsById[message.chatId];
  if (chat) {
    upsertMessage(message);
  }
}
