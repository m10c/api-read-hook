import { useCallback, useEffect, useRef } from 'react';
import { CacheEntry, PersistConfig } from '../types';

type StoredEntry = CacheEntry & {
  version: string;
};

function isStoredEntry(value: unknown): value is StoredEntry {
  if (typeof value !== 'object' || value === null) return false;
  const { data, receivedAt, version } = value as Record<string, unknown>;
  return (
    data !== undefined &&
    typeof receivedAt === 'number' &&
    typeof version === 'string'
  );
}

function storageKey(persist: PersistConfig, path: string): string {
  return `${persist.keyPrefix ?? 'api-read-hook.'}${path}`;
}

function isFresh(persist: PersistConfig, entry: CacheEntry): boolean {
  if (persist.maxAge === undefined) return true;
  return Math.floor(Date.now() / 1000) - entry.receivedAt < persist.maxAge;
}

function serializeEntry(persist: PersistConfig, entry: CacheEntry): string {
  const stored: StoredEntry = { ...entry, version: persist.version };
  return JSON.stringify(stored);
}

function parseEntry(persist: PersistConfig, stored: string): CacheEntry | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch {
    return null;
  }
  if (!isStoredEntry(parsed)) return null;
  if (parsed.version !== persist.version) return null;
  if (!isFresh(persist, parsed)) return null;
  return { data: parsed.data, receivedAt: parsed.receivedAt };
}

export default function useCache(persistConfig: PersistConfig | undefined) {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const persistRef = useRef(persistConfig);
  useEffect(() => {
    persistRef.current = persistConfig;
  }, [persistConfig]);

  const dropCached = useCallback(function dropCached(path: string): void {
    cacheRef.current.delete(path);

    const persist = persistRef.current;
    if (!persist) return;
    persist.storage.remove(storageKey(persist, path)).catch(() => {});
  }, []);

  const loadCached = useCallback(
    async function loadCached(path: string): Promise<CacheEntry | undefined> {
      const persist = persistRef.current;
      const inMemory = cacheRef.current.get(path);
      if (inMemory !== undefined) {
        if (!persist || isFresh(persist, inMemory)) return inMemory;
        dropCached(path);
        return undefined;
      }

      if (!persist) return undefined;
      let stored: string | null;
      try {
        stored = await persist.storage.get(storageKey(persist, path));
      } catch {
        return undefined;
      }
      if (typeof stored !== 'string') return undefined;

      const entry = parseEntry(persist, stored);
      if (entry === null) {
        dropCached(path);
        return undefined;
      }
      cacheRef.current.set(path, entry);
      return entry;
    },
    [dropCached]
  );

  const setCached = useCallback(function setCached(
    path: string,
    data: unknown,
    receivedAt: number
  ): void {
    const entry = { data, receivedAt };
    cacheRef.current.set(path, entry);

    const persist = persistRef.current;
    if (!persist) return;
    let serialized: string;
    try {
      serialized = serializeEntry(persist, entry);
    } catch {
      return;
    }
    persist.storage.set(storageKey(persist, path), serialized).catch(() => {});
  },
  []);

  const dropCachedMatching = useCallback(
    function dropCachedMatching(search: string | RegExp): void {
      for (const path of Array.from(cacheRef.current.keys())) {
        if (path.match(search)) {
          dropCached(path);
        }
      }
    },
    [dropCached]
  );

  return { loadCached, setCached, dropCached, dropCachedMatching };
}
