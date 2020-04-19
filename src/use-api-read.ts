import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { ApiReadContext } from './ApiReadContext';
import { ReadConfig, ReadResult } from './types';

export default function useApiRead<T>(
  path: string | null,
  options: ReadConfig = {}
): ReadResult<T> {
  const context = useContext(ApiReadContext);
  const { reader } = { ...context.config, ...options };

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | undefined>(undefined);

  const [invalidateToken, setInvalidateToken] = useState(0);
  const invalidate = useCallback(function invalidate() {
    setInvalidateToken(Math.random());
  }, []);

  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [moreError, setMoreError] = useState<Error | undefined>(undefined);

  const { current: instanceKey } = useRef(Math.random().toString());
  useEffect(() => {
    if (path === null) return;
    context.addInvalidationEntry(instanceKey, path, invalidate);
    return () => {
      context.removeInvalidationEntry(instanceKey);
    };
  }, [context, instanceKey, path, invalidate]);

  useEffect(() => {
    let ignore = false;

    async function readRequest() {
      setData(undefined);
      setError(undefined);

      // Intentionally bail out, to allow user to e.g. wait on result from a
      // prior API request
      if (path === null) return;

      if (!reader) {
        throw new Error(
          'A `reader` function must be provided to `useApiRead`, either ' +
            'directly or via ApiReadConfig'
        );
      }

      try {
        const d = await reader<T>(path);
        if (!ignore) setData(d);
      } catch (err) {
        if (!ignore) setError(err);
      }
    }
    readRequest();

    return () => {
      ignore = true;
    };
  }, [reader, path, invalidateToken]);

  const readMore = useCallback(
    async function readMore(morePath: string, updater: (moreData: T) => T) {
      if (loadingMore) return;

      setLoadingMore(true);
      setMoreError(undefined);

      if (!reader) {
        throw new Error(
          'A `reader` function must be provided to `useApiRead`, either ' +
            'directly or via ApiReadConfig'
        );
      }

      try {
        const nextData = await reader<T>(morePath);
        setData(updater(nextData));
        setLoadingMore(false);
      } catch (err) {
        setMoreError(err);
        setLoadingMore(false);
      }
    },
    [loadingMore, reader]
  );

  return {
    data,
    error,
    invalidate,
    invalidateMatching: context.invalidateMatching,
    readMore,
    loadingMore,
    moreError,
  };
}
