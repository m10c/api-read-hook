import * as React from 'react';
import { ReadConfig, ReadResult } from './types';

export default function useApiRead<T>(
  path: string,
  options: ReadConfig
): ReadResult<T> {
  const { reader } = options;

  const [data, setData] = React.useState<T | undefined>(undefined);
  const [error, setError] = React.useState(undefined);
  const [invalidateToken, setInvalidateToken] = React.useState(0);

  React.useEffect(() => {
    async function readRequest() {
      setData(undefined);
      setError(undefined);

      if (!reader) {
        throw new Error('A `reader` function must be provided to `useApiRead`');
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
