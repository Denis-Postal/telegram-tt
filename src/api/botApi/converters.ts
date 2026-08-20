import type { ApiChat } from '../types/chats';
import type { ApiMessage, ApiPhoto } from '../types/messages';
import type { ApiUser, ApiUserFullInfo } from '../types/users';

import { buildBotFileUrl } from './client';
import type {
  BotApiChat,
  BotApiChatFull,
  BotApiMessage,
  BotApiPhotoSize,
  BotApiUser,
} from './types';

export function buildApiUserFromBotApi(user: BotApiUser, isSelf?: boolean): ApiUser {
  return {
    id: String(user.id),
    isMin: false,
    type: user.is_bot ? 'userTypeBot' : 'userTypeRegular',
    firstName: user.first_name,
    lastName: user.last_name,
    phoneNumber: '',
    usernames: user.username ? [{ username: user.username, isActive: true }] : undefined,
    hasUsername: Boolean(user.username),
    isSelf: isSelf ? true : undefined,
  };
}

export function buildApiUserFromBotApiChat(chat: BotApiChatFull): ApiUser {
  return {
    id: String(chat.id),
    isMin: false,
    type: 'userTypeRegular',
    firstName: chat.first_name || chat.title || '',
    lastName: chat.last_name,
    phoneNumber: '',
    usernames: chat.username ? [{ username: chat.username, isActive: true }] : undefined,
    hasUsername: Boolean(chat.username),
  };
}

export function buildApiChatFromBotApi(chat: BotApiChat): ApiChat {
  const title = chat.title
    || [chat.first_name, chat.last_name].filter(Boolean).join(' ')
    || chat.username
    || String(chat.id);

  if (chat.type === 'private') {
    return {
      id: String(chat.id),
      type: 'chatTypePrivate',
      title,
    };
  }

  if (chat.type === 'channel') {
    return {
      id: String(chat.id),
      type: 'chatTypeChannel',
      title,
    };
  }

  return {
    id: String(chat.id),
    type: chat.type === 'supergroup' ? 'chatTypeSuperGroup' : 'chatTypeBasicGroup',
    title,
    membersCount: 'member_count' in chat ? chat.member_count : undefined,
  };
}

export function buildApiPhotoFromBotApiFile(fileId: string, size?: BotApiPhotoSize): ApiPhoto {
  return {
    mediaType: 'photo',
    id: fileId,
    date: 0,
    blobUrl: buildBotFileUrl(fileId),
    sizes: [{
      type: 'x',
      width: size?.width || 0,
      height: size?.height || 0,
    }],
  };
}

export function buildApiUserFullInfoFromBotApiChat(chat: BotApiChatFull): ApiUserFullInfo {
  return {
    bio: chat.bio || chat.description,
  };
}

export function buildApiMessageFromBotApi(message: BotApiMessage, botId: string): ApiMessage {
  const chatId = String(message.chat.id);
  const isOutgoing = message.from?.id === Number(botId);
  const textContent = message.text || message.caption;

  const content: ApiMessage['content'] = {};

  if (textContent) {
    content.text = { text: textContent };
  }

  if (message.photo?.length) {
    const largestPhoto = message.photo[message.photo.length - 1];
    content.photo = buildApiPhotoFromBotApiFile(largestPhoto.file_id, largestPhoto);
  }

  if (message.document) {
    content.document = {
      mediaType: 'document',
      id: message.document.file_id,
      fileName: message.document.file_name || 'file',
      size: message.document.file_size || 0,
      mimeType: message.document.mime_type || 'application/octet-stream',
      previewBlobUrl: buildBotFileUrl(message.document.file_id),
    };
  }

  return {
    id: message.message_id,
    chatId,
    content,
    date: message.date,
    isOutgoing,
    senderId: message.from ? String(message.from.id) : botId,
    isEdited: Boolean(message.edit_date),
    editDate: message.edit_date,
  };
}

export function buildMinimalApiUser(id: string): ApiUser {
  return {
    id,
    isMin: true,
    type: 'userTypeRegular',
    phoneNumber: '',
    firstName: id,
  };
}
