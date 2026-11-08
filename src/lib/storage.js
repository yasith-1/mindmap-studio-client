// Single place that knows how to touch localStorage safely (it can throw in
// private mode or when storage is disabled). Everything else depends on this
// small abstraction rather than on localStorage directly.

export function readStored(key, fallback = '') {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked — ignore */
  }
}
