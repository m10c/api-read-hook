export type Reader = <T>(path: string) => Promise<T>;

export type PersistStorage = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
};

export type PersistConfig = {
  storage: PersistStorage;
  version: string;
  keyPrefix?: string;
  maxAge?: number;
};

export type ReadConfig = {
  reader?: Reader;

  staleWhileMounted?: boolean;
  staleWhileInvalidated?: boolean;
  staleWhileError?: boolean;

  invalidateAge?: number;
};

export type StaleReason = 'mounted' | 'invalidated' | 'error';

export type CacheEntry = {
  data: unknown;
  receivedAt: number;
};

export type ReadResult<T> = {
  data: T | undefined;
  error: Error | undefined;
  stale: boolean;
  staleReason: null | StaleReason;
  receivedAt: null | number;
  invalidate: () => void;
  /**
   * @deprecated Access from `useInvalidation` hook, as this has no relevance to the ReadResult
   */
  invalidateExact: (search: string) => void;
  /**
   * @deprecated Access from `useInvalidation` hook, as this has no relevance to the ReadResult
   */
  invalidateMatching: (search: string | RegExp) => void;
  mutate: (mutator: (data: T) => T) => void;
  readMore: (path: string, updater: (moreData: T) => T) => void;
  loadingMore: boolean;
  moreError: Error | undefined;
};
