const BOT_BLOCKED_METHODS = new Set([
  'messages.GetDialogs',
  'messages.GetPinnedDialogs',
  'messages.GetDialogFilters',
  'messages.GetHistory',
  'messages.GetSavedHistory',
  'messages.GetReplies',
  'messages.GetScheduledHistory',
  'messages.Search',
  'messages.GetCommonChats',
  'messages.GetAvailableReactions',
  'messages.GetStickerSet',
  'contacts.GetContacts',
  'contacts.Search',
  'account.UpdateStatus',
  'account.GetAuthorizations',
  'account.GetPassword',
  'account.GetNotifySettings',
  'account.GetGlobalPrivacySettings',
  'help.GetPeerColors',
  'help.GetPeerProfileColors',
  'help.GetAppConfig',
  'help.GetNearestDc',
  'help.GetCountriesList',
  'help.GetPremiumPromo',
  'help.GetTimezonesList',
  'updates.GetState',
  'updates.GetDifference',
  'langpack.GetLangPack',
  'langpack.GetLanguage',
  'langpack.GetLanguages',
  'langpack.GetStrings',
  'langpack.GetDifference',
  'folders.GetSuggested',
]);

const BOT_BLOCKED_PREFIXES = [
  'account.',
  'stories.',
  'payments.GetSaved',
];

export function isBotBlockedMethod(className: string) {
  if (BOT_BLOCKED_METHODS.has(className)) {
    return true;
  }

  return BOT_BLOCKED_PREFIXES.some((prefix) => className.startsWith(prefix));
}
