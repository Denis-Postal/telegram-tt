import type { SendMessageParams } from '../../../types';
import type { ApiAttachment } from '../../types/misc';

import {
  botApiSendDocument,
  botApiSendMessage,
  botApiSendPhoto,
} from '../client';
import { buildApiChatFromBotApi, buildApiMessageFromBotApi } from '../converters';
import { addSentMessage, getBotId, getBotStoreMessages, upsertBotChat } from '../store';
import { scheduleSaveBotCache } from '../persist';

async function getAttachmentBlob(attachment: ApiAttachment): Promise<Blob> {
  if (attachment.blob) {
    return attachment.blob;
  }

  const response = await fetch(attachment.blobUrl);
  return response.blob();
}

function isImageAttachment(attachment: ApiAttachment) {
  return attachment.mimeType.startsWith('image/') && !attachment.shouldSendAsFile;
}

export async function botFetchMessages({
  chat,
  offsetId,
  limit,
}: {
  chat: { id: string };
  offsetId?: number;
  limit: number;
}) {
  const { messages, users, chats, count } = getBotStoreMessages(chat.id, limit, offsetId);
  const isEndOfHistory = !messages.length;

  return {
    messages,
    users,
    chats,
    count: messages.length ? count : 0,
    topics: [],
    isEndOfHistory,
  };
}

export async function botSendMessage(params: SendMessageParams) {
  const {
    chat, text, attachment, gif, localMessage,
  } = params;

  if (!chat) {
    return localMessage;
  }

  const botId = getBotId();
  if (!botId) {
    return localMessage;
  }

  const caption = text || localMessage?.content.text?.text;

  try {
    let result;

    if (attachment) {
      const blob = await getAttachmentBlob(attachment);
      if (isImageAttachment(attachment)) {
        result = await botApiSendPhoto(chat.id, blob, attachment.filename, caption);
      } else {
        result = await botApiSendDocument(chat.id, blob, attachment.filename, caption);
      }
    } else if (gif?.blobUrl) {
      const response = await fetch(gif.blobUrl);
      const blob = await response.blob();
      result = await botApiSendDocument(chat.id, blob, 'animation.gif', caption);
    } else if (caption) {
      result = await botApiSendMessage(chat.id, caption);
    } else {
      return localMessage;
    }

    const apiMessage = buildApiMessageFromBotApi(result, botId);
    upsertBotChat(buildApiChatFromBotApi(result.chat));
    addSentMessage(apiMessage);
    scheduleSaveBotCache();

    return apiMessage;
  } catch {
    return localMessage;
  }
}
