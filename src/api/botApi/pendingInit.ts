let pendingBotAuthToken: string | undefined;

export function setPendingBotAuthToken(token: string) {
  pendingBotAuthToken = token;
}

export function consumePendingBotAuthToken() {
  const token = pendingBotAuthToken;
  pendingBotAuthToken = undefined;
  return token;
}
