import type { ApiChat, ApiChatFullInfo, ApiPeer } from '../../types/chats';

import { botApiGetChat } from '../client';
import {
  buildApiChatFromBotApi,
  buildApiPhotoFromBotApiFile,
  buildApiUserFromBotApiChat,
  buildApiUserFullInfoFromBotApiChat,
} from '../converters';
import { getBotStoreChat, upsertBotChat, upsertBotUser } from '../store';

const EMPTY_USER_STATUSES = {};

export async function botFetchFullChat(chat: ApiChat) {
  try {
    const chatInfo = await botApiGetChat(chat.id);
    const fullChat = buildApiChatFromBotApi(chatInfo);

    upsertBotChat(fullChat);

    if (chatInfo.type === 'private') {
      const user = buildApiUserFromBotApiChat(chatInfo);
      upsertBotUser(user);
    }

    const fullInfo: ApiChatFullInfo = chatInfo.type === 'private'
      ? buildApiUserFullInfoFromBotApiChat(chatInfo) as ApiChatFullInfo
      : {
        about: chatInfo.description,
        membersCount: chatInfo.member_count,
        profilePhoto: chatInfo.photo
          ? buildApiPhotoFromBotApiFile(chatInfo.photo.big_file_id)
          : undefined,
      };

    return {
      fullInfo,
      chats: [fullChat],
      userStatusesById: EMPTY_USER_STATUSES,
      membersCount: chatInfo.member_count,
    };
  } catch {
    const storedChat = getBotStoreChat(chat.id);
    if (storedChat) {
      return {
        fullInfo: {},
        chats: [storedChat],
        userStatusesById: EMPTY_USER_STATUSES,
      };
    }

    return {
      fullInfo: {},
      chats: [chat],
      userStatusesById: EMPTY_USER_STATUSES,
    };
  }
}

export async function botFetchPeerSettings(_peer: ApiPeer) {
  return {
    settings: {},
  };
}

export async function botSearchChats() {
  return {
    accountResultIds: [] as string[],
    globalResultIds: [] as string[],
  };
}
