import { sendApiUpdate } from '../gramjs/updates/apiUpdateEmitter';

import { getBotUpdateOffset } from './client';
import { exportBotStoreSnapshot } from './store';

const SAVE_BOT_CACHE_DELAY_MS = 1000;

let saveBotCacheTimeout: number | undefined;

export function scheduleSaveBotCache() {
  if (saveBotCacheTimeout) {
    clearTimeout(saveBotCacheTimeout);
  }

  saveBotCacheTimeout = self.setTimeout(() => {
    sendApiUpdate({
      '@type': 'saveBotCache',
      snapshot: exportBotStoreSnapshot(getBotUpdateOffset()),
    });
  }, SAVE_BOT_CACHE_DELAY_MS);
}
