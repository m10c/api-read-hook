import { useContext, useEffect, useState } from 'react';
import { ReadConfig, ReadResult } from './types';
import { ApiReadContext } from './ApiReadConfig';

export default function useApiRead<T>(
  path: string,
  options: ReadConfig = {}
): ReadResult<T> {
  const config = useContext(ApiReadContext);
  const { reader } = { ...config, ...options };

  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState(undefined);
  const [invalidateToken, setInvalidateToken] = useState(0);

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

      try {
        setData(await reader<T>(path));
      } catch (err) {
        setError(err);
      }
    }
    readRequest();
  }, [reader, path, invalidateToken]);

  const invalidate = () => setInvalidateToken(Math.random());

  return { data, error, invalidate };
}
