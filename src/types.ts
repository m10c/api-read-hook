export type ReadConfig = {
  reader?: <T>(path: string) => Promise<T>;
};

export type ReadResult<T> = {
  data: T | undefined;
  error: Error | undefined;
  invalidate: () => void;
};
