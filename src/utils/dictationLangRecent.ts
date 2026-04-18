/**
 * dictationLangRecent — Tracks recently-used dictation languages across the
 * app so the language picker can pin the user's frequent picks to the top.
 *
 * Stored as an MRU (most-recently-used) list, capped to keep storage tiny.
 */
const KEY = 'flowist_dictation_lang_recent';
const MAX = 3;

export const getRecentDictationLangs = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
};

export const recordRecentDictationLang = (lang: string) => {
  if (typeof window === 'undefined' || !lang) return;
  try {
    const current = getRecentDictationLangs().filter((l) => l !== lang);
    const updated = [lang, ...current].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    /* storage full or blocked — ignore */
  }
};
