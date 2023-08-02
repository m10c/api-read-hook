import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import { ApiReadContext } from './ApiReadContext';
import { ReadConfig, ReadResult } from './types';
import reducer, { ReaderReducer } from './core/reducer';
import useConfig from './core/use-config';
import usePrevious from './core/use-previous';
import useReadMore from './core/use-read-more';

export default function useApiRead<T>(
  path: string | null,
  options: ReadConfig = {}
): ReadResult<T> {
  const context = useContext(ApiReadContext);

  const config = useConfig(options);
  const { reader, invalidateAge } = config;

  const [state, dispatch] = useReducer<ReaderReducer<T>>(reducer, {
    data: undefined,
    error: undefined,
    staleReason: null,
    receivedAt: null,
  });

  const [invalidateToken, setInvalidateToken] = useState(0);
  const invalidate = useCallback(function invalidate() {
    setInvalidateToken(Math.random());
  }, []);

  const mutate = useCallback(
    function mutate(mutator: (data: T) => T) {
      if (!state.data) return;
      const mutatedData = mutator(state.data);
      dispatch({ type: 'MUTATED_DATA', payload: { data: mutatedData } });
    },
    [state.data]
  );

  // Effect: Add/remove this instance from the global cache enties
  const [instanceKey] = useState(Math.random().toString());
  useEffect(() => {
    if (path === null) return;
    context.addMountedEntry(instanceKey, path, invalidate, mutate);
    return () => {
      context.removeMountedEntry(instanceKey);
    };
  }, [context, instanceKey, path, invalidate, mutate]);

  // Effect: Perform the API request
  const previousPath = usePrevious(path);
  useEffect(() => {
    let ignore = false;

    async function readRequest() {
      const pathChanged = previousPath !== path;
      dispatch({ type: 'READ_REQUEST', payload: { config, pathChanged } });

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
          dispatch({
            type: 'READ_SUCCESS',
            payload: {
              config,
              data,
              receivedAt: Math.floor(Date.now() / 1000),
            },
          });
        }
      } catch (error) {
        if (!ignore) {
          dispatch({
            type: 'READ_FAILURE',
            payload: { config, error: error as any },
          });
        }
      }
    }
    readRequest();

    return () => {
      ignore = true;
    };
    // intentionally omitting previousPath
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, reader, config, invalidateToken]);

  // Effect: Manage invalidateAge timeout
  useEffect(() => {
    if (!invalidateAge || !state.data || state.staleReason) return;

    const timeoutId = setTimeout(() => {
      invalidate();
    }, invalidateAge * 1000);
    return () => clearTimeout(timeoutId);
  }, [invalidateAge, state.data, state.staleReason, invalidate]);

  const { readMore, loadingMore, moreError } = useReadMore(reader, dispatch);

  return {
    data: state.data,
    error: state.error,
    stale: Boolean(state.staleReason),
    staleReason: state.staleReason,
    receivedAt: state.receivedAt,
    invalidate,
    invalidateExact: context.invalidateExact,
    invalidateMatching: context.invalidateMatching,
    mutate,
    readMore,
    loadingMore,
    moreError,
  };
}
