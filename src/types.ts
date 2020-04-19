export type ReadConfig = {
  reader?: <T>(path: string) => Promise<T>;
};

export type ReadResult<T> = {
  data: T | undefined;
  error: Error | undefined;
  invalidate: () => void;
  invalidateMatching: (search: string | RegExp) => void;
  readMore: (path: string, updater: (moreData: T) => T) => void;
  loadingMore: boolean;
  moreError: Error | undefined;
};
