import type { ThreadReadState } from '../../../types';
import type { ApiDraft, ApiPeer, ApiThreadInfo } from '../../types/chats';
import type { ApiMessage } from '../../types/messages';
import type { ApiPeerNotifySettings } from '../../types/misc';
import type { ApiUserStatus } from '../../types/users';

import { getBotStoreChats } from '../store';

const EMPTY_DRAFTS: Record<string, ApiDraft> = {};
const EMPTY_THREAD_INFOS: ApiThreadInfo[] = [];
const EMPTY_NOTIFY_EXCEPTIONS: Record<string, ApiPeerNotifySettings> = {};
const EMPTY_USER_STATUSES: Record<string, ApiUserStatus> = {};
const EMPTY_THREAD_READ_STATES: Record<string, ThreadReadState> = {};

export async function botFetchChats({
  limit,
  offsetPeer,
  archived,
}: {
  limit: number;
  offsetDate?: number;
  offsetPeer?: ApiPeer;
  offsetId?: number;
  archived?: boolean;
  withPinned?: boolean;
  lastLocalServiceMessageId?: number;
}) {
  if (archived) {
    return buildEmptyChatListData();
  }

  const allChats = getBotStoreChats(Number.MAX_SAFE_INTEGER);
  let offset = 0;

  if (offsetPeer) {
    const peerIndex = allChats.chatIds.indexOf(offsetPeer.id);
    offset = peerIndex >= 0 ? peerIndex + 1 : 0;
  }

  const {
    chatIds,
    chats,
    users,
    messages,
    lastMessageByChatId,
    totalChatCount,
    hasMore,
  } = getBotStoreChats(limit, offset);

  return {
    chatIds,
    chats,
    users,
    userStatusesById: EMPTY_USER_STATUSES,
    draftsById: EMPTY_DRAFTS,
    threadInfos: EMPTY_THREAD_INFOS,
    orderedPinnedIds: undefined,
    totalChatCount,
    messages,
    notifyExceptionById: EMPTY_NOTIFY_EXCEPTIONS,
    lastMessageByChatId,
    nextOffsetId: hasMore ? 1 : undefined,
    nextOffsetPeerId: hasMore && chatIds.length ? chatIds[chatIds.length - 1] : undefined,
    nextOffsetDate: hasMore && chatIds.length
      ? lastMessageByChatId[chatIds[chatIds.length - 1]]
      : undefined,
    threadReadStatesById: EMPTY_THREAD_READ_STATES,
  };
}

export async function botFetchPinnedDialogs() {
  return {
    dialogIds: [] as string[],
    messages: [] as ApiMessage[],
    chats: [],
    users: [],
  };
}

function buildEmptyChatListData() {
  return {
    chatIds: [] as string[],
    chats: [],
    users: [],
    userStatusesById: EMPTY_USER_STATUSES,
    draftsById: EMPTY_DRAFTS,
    threadInfos: EMPTY_THREAD_INFOS,
    orderedPinnedIds: undefined,
    totalChatCount: 0,
    messages: [] as ApiMessage[],
    notifyExceptionById: EMPTY_NOTIFY_EXCEPTIONS,
    lastMessageByChatId: {} as Record<string, number>,
    threadReadStatesById: EMPTY_THREAD_READ_STATES,
  };
}
