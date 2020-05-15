export type Reader = <T>(path: string) => Promise<T>;

export type ReadConfig = {
  reader?: Reader;

  // Meaningless until global config
  // staleWhenMounted?: boolean;
  staleWhenInvalidated?: boolean;
  staleWhenError?: boolean;
};

export type StaleReason = 'mounted' | 'invalidated' | 'error';

export type ReadResult<T> = {
  data: T | undefined;
  error: Error | undefined;
  stale: boolean;
  staleReason: null | StaleReason;
  invalidate: () => void;
  invalidateMatching: (search: string | RegExp) => void;
  readMore: (path: string, updater: (moreData: T) => T) => void;
  loadingMore: boolean;
  moreError: Error | undefined;
};
