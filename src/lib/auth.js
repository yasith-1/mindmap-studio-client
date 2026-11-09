// Single place that knows where the auth token lives. Built on the same
// localStorage abstraction the rest of the app uses, so it degrades safely
// when storage is blocked (the user simply stays in guest mode).
import { readStored, writeStored } from './storage.js';

const TOKEN_KEY = 'mms-token';

export function getToken() {
  return readStored(TOKEN_KEY, '') || null;
}

export function setToken(token) {
  writeStored(TOKEN_KEY, token || '');
}

export function clearToken() {
  writeStored(TOKEN_KEY, '');
}
