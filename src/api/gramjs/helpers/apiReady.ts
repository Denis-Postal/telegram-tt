let isApiReady = false;

export function resetApiReady() {
  isApiReady = false;
}

export function markApiReady() {
  isApiReady = true;
}

export function getIsApiReady() {
  return isApiReady;
}
