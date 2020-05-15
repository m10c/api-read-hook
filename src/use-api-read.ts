import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import { ApiReadContext } from './ApiReadContext';
import { ReadConfig, ReadResult } from './types';
import reducer, { ReaderReducer } from './core/reducer';
import useConfig from './core/use-config';
import useReadMore from './core/use-read-more';

export default function useApiRead<T>(
  path: string | null,
  options: ReadConfig = {}
): ReadResult<T> {
  const context = useContext(ApiReadContext);

  const config = useConfig(options);
  const { reader } = config;

  const [state, dispatch] = useReducer<ReaderReducer<T>>(reducer, {
    data: undefined,
    error: undefined,
    staleReason: null,
  });

  const [invalidateToken, setInvalidateToken] = useState(0);
  const invalidate = useCallback(function invalidate() {
    setInvalidateToken(Math.random());
  }, []);

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
      dispatch({ type: 'READ_REQUEST', payload: { config } });

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
        const data = await reader<T>(path);
        if (!ignore) {
          dispatch({ type: 'READ_SUCCESS', payload: { config, data } });
        }
      } catch (error) {
        if (!ignore) {
          dispatch({ type: 'READ_FAILURE', payload: { config, error } });
        }
      }
    }
    readRequest();

    return () => {
      ignore = true;
    };
  }, [path, reader, config, invalidateToken]);

  const { readMore, loadingMore, moreError } = useReadMore(reader, dispatch);

  return {
    data: state.data,
    error: state.error,
    stale: Boolean(state.staleReason),
    staleReason: state.staleReason,
    invalidate,
    invalidateMatching: context.invalidateMatching,
    readMore,
    loadingMore,
    moreError,
  };
}
