import { useContext, useEffect, useRef, useState } from 'react';

import { ApiReadContext } from './ApiReadContext';
import { ReadConfig, ReadResult } from './types';

export default function useApiRead<T>(
  path: string | null,
  options: ReadConfig = {}
): ReadResult<T> {
  const context = useContext(ApiReadContext);
  const { reader } = { ...context.config, ...options };

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState(undefined);
  const [invalidateToken, setInvalidateToken] = useState(0);
  const invalidate = () => setInvalidateToken(Math.random());

  const { current: instanceKey } = useRef(Math.random().toString());
  useEffect(() => {
    if (path === null) return;
    context.addInvalidationEntry(instanceKey, path, invalidate);
    return () => {
      context.removeInvalidationEntry(instanceKey);
    };
  }, [context, instanceKey, path]);

  useEffect(() => {
    async function readRequest() {
      setData(undefined);
      setError(undefined);

      if (!reader) {
        throw new Error(
          'A `reader` function must be provided to `useApiRead`, either ' +
            'directly or via ApiReadConfig'
        );
      }

      // Intentionally bail out, to allow user to e.g. wait on result from a
      // prior API request
      if (path === null) return;

      try {
        setData(await reader<T>(path));
      } catch (err) {
        setError(err);
      }
    }
    readRequest();
  }, [reader, path, invalidateToken]);

  return {
    data,
    error,
    invalidate,
    invalidateMatching: context.invalidateMatching,
  };
}
