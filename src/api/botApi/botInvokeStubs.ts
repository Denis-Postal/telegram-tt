import { Api as GramJs } from '../../lib/gramjs';

export function getBotStubResponse(request: GramJs.AnyRequest) {
  switch (request.className) {
    case 'messages.GetDialogs':
      return new GramJs.messages.Dialogs({
        dialogs: [],
        messages: [],
        chats: [],
        users: [],
      });

    case 'messages.GetPinnedDialogs':
      return new GramJs.messages.PeerDialogs({
        dialogs: [],
        messages: [],
        chats: [],
        users: [],
        state: new GramJs.updates.State({
          pts: 0,
          qts: 0,
          date: 0,
          seq: 0,
          unreadCount: 0,
        }),
      });

    case 'messages.GetDialogFilters':
      return new GramJs.messages.DialogFilters({
        filters: [new GramJs.DialogFilterDefault()],
      });

    case 'langpack.GetLangPack':
    case 'langpack.GetDifference': {
      const langCode = 'langCode' in request ? String(request.langCode) : 'en';
      return new GramJs.LangPackDifference({
        langCode,
        fromVersion: 0,
        version: 0,
        strings: [],
      });
    }

    case 'langpack.GetLanguage': {
      const langCode = 'langCode' in request ? String(request.langCode) : 'en';
      return new GramJs.LangPackLanguage({
        name: langCode,
        nativeName: langCode,
        langCode,
        pluralCode: langCode,
        stringsCount: 0,
        translatedCount: 0,
      });
    }

    case 'langpack.GetLanguages':
    case 'langpack.GetStrings':
      return [];

    case 'help.GetNearestDc':
      return new GramJs.NearestDc({
        country: 'US',
        thisDc: 2,
        nearestDc: 2,
      });

    case 'help.GetCountriesList':
      return new GramJs.help.CountriesList({
        countries: [],
        hash: 0,
      });

    case 'updates.GetState':
      return new GramJs.updates.State({
        pts: 0,
        qts: 0,
        date: Math.floor(Date.now() / 1000),
        seq: 0,
        unreadCount: 0,
      });

    case 'contacts.GetContacts':
      return new GramJs.contacts.Contacts({
        contacts: [],
        users: [],
      });

    case 'account.GetPrivacy':
      return new GramJs.account.PrivacyRules({
        rules: [new GramJs.PrivacyValueAllowAll()],
        chats: [],
        users: [],
      });

    case 'account.GetContentSettings':
      return new GramJs.account.ContentSettings({
        sensitiveEnabled: false,
        sensitiveCanChange: false,
      });

    case 'account.GetGlobalPrivacySettings':
      return new GramJs.GlobalPrivacySettings({});

    case 'account.GetContactSignUpNotification':
      return false;

    default:
      return undefined;
  }
}
