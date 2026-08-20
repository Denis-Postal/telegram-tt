import type { ApiUser } from '../../types/users';

import { sendApiUpdate } from '../../gramjs/updates/apiUpdateEmitter';
import { botApiGetChat } from '../client';
import {
  buildApiUserFromBotApiChat,
  buildApiUserFullInfoFromBotApiChat,
  buildMinimalApiUser,
} from '../converters';
import { getBotStoreUser, upsertBotUser } from '../store';

const EMPTY_USER_STATUSES = {};

export async function botFetchFullUser({
  id,
}: {
  id: string;
  accessHash?: string;
}) {
  try {
    const chatInfo = await botApiGetChat(id);
    const user = buildApiUserFromBotApiChat(chatInfo);
    const fullInfo = buildApiUserFullInfoFromBotApiChat(chatInfo);

    upsertBotUser(user);

    sendApiUpdate({
      '@type': 'updateUser',
      id,
      user,
      fullInfo,
    });

    return {
      user,
      fullInfo,
      users: [user],
      chats: [],
      userStatusesById: EMPTY_USER_STATUSES,
    };
  } catch {
    const storedUser = getBotStoreUser(id);
    if (storedUser) {
      return {
        user: storedUser,
        fullInfo: {},
        users: [storedUser],
        chats: [],
        userStatusesById: EMPTY_USER_STATUSES,
      };
    }

    const fallbackUser = buildMinimalApiUser(id);
    return {
      user: fallbackUser,
      fullInfo: {},
      users: [fallbackUser],
      chats: [],
      userStatusesById: EMPTY_USER_STATUSES,
    };
  }
}

export async function botFetchUsers({ users }: { users: ApiUser[] }) {
  const apiUsers: ApiUser[] = [];
  const userStatusesById = EMPTY_USER_STATUSES;

  await Promise.all(users.map(async (user) => {
    const result = await botFetchFullUser({ id: user.id, accessHash: user.accessHash });
    apiUsers.push(result.user);
  }));

  return {
    users: apiUsers,
    userStatusesById,
  };
}

export async function botFetchProfilePhotos() {
  return {
    count: 0,
    photos: [],
    nextOffsetId: undefined,
  };
}

export async function botFetchCommonChats() {
  return {
    chatIds: [] as string[],
    count: 0,
  };
}

export async function botFetchContactList() {
  return {
    users: [],
    userStatusesById: EMPTY_USER_STATUSES,
  };
}

export async function botFetchNearestCountry() {
  return undefined;
}
