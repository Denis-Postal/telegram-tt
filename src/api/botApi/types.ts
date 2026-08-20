export type BotApiUser = {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
};

export type BotApiChat = {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type BotApiChatPhoto = {
  small_file_id: string;
  big_file_id: string;
};

export type BotApiChatFull = BotApiChat & {
  bio?: string;
  description?: string;
  photo?: BotApiChatPhoto;
  member_count?: number;
  linked_chat_id?: number;
};

export type BotApiPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

export type BotApiDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

export type BotApiMessage = {
  message_id: number;
  from?: BotApiUser;
  chat: BotApiChat;
  date: number;
  text?: string;
  caption?: string;
  edit_date?: number;
  photo?: BotApiPhotoSize[];
  document?: BotApiDocument;
};

export type BotApiUserProfilePhotos = {
  total_count: number;
  photos: BotApiPhotoSize[][];
};

export type BotApiFile = {
  file_id: string;
  file_unique_id: string;
  file_size?: number;
  file_path?: string;
};

export type BotApiUpdate = {
  update_id: number;
  message?: BotApiMessage;
  edited_message?: BotApiMessage;
};

export type BotApiResponse<T> = {
  ok: boolean;
  result: T;
  description?: string;
};

export const BOT_FILE_URL_PREFIX = 'botfile:';
