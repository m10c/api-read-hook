import { useCallback, useState } from 'react';
import { Reader } from '../types';
import { ReaderDispatch } from './reducer';

export default function useReadMore<T>(
  reader: Reader | undefined,
  dispatch: ReaderDispatch<T>
) {
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [moreError, setMoreError] = useState<Error | undefined>(undefined);

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
        dispatch({ type: 'MORE_DATA', payload: { data: updater(nextData) } });
        setLoadingMore(false);
      } catch (err) {
        setMoreError(err as any);
        setLoadingMore(false);
      }
    },
    [loadingMore, reader, dispatch]
  );

  return { readMore, loadingMore, moreError };
}
