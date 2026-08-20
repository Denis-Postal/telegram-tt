import { callApi } from '../../../api/gramjs';
import { loadStoredBotMode } from '../../../api/botApi';
import { selectUser } from '../../selectors';

const BOT_POLL_INTERVAL_MS = 2000;

let botPollInterval: number | undefined;
let isBotPollInProgress = false;

export function startBotPolling() {
  if (botPollInterval) {
    return;
  }

  const poll = async () => {
    if (isBotPollInProgress) {
      return;
    }

    isBotPollInProgress = true;
    try {
      await callApi('pollBotUpdates');
    } finally {
      isBotPollInProgress = false;
    }
  };

  void poll();
  botPollInterval = window.setInterval(() => {
    void poll();
  }, BOT_POLL_INTERVAL_MS);
}

export function stopBotPolling() {
  if (!botPollInterval) {
    return;
  }

  clearInterval(botPollInterval);
  botPollInterval = undefined;
}

export function startBotPollingIfNeeded(global: { currentUserId?: string }) {
  const isBotMode = loadStoredBotMode()
    || (global.currentUserId && selectUser(global, global.currentUserId)?.type === 'userTypeBot');

  if (isBotMode) {
    startBotPolling();
  }
}
