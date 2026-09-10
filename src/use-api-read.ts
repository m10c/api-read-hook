import {
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
} from 'react';

import { ApiReadContext } from './ApiReadContext';
import { ReadConfig, ReadResult } from './types';
import reducer, { initialState, ReaderReducer } from './core/reducer';
import useConfig from './core/use-config';
import usePrevious from './core/use-previous';
import useReadMore from './core/use-read-more';

export default function useApiRead<T>(
  path: string | null,
  options: ReadConfig = {}
): ReadResult<T> {
  const context = useContext(ApiReadContext);
  const {
    hasProvider,
    addMountedEntry,
    removeMountedEntry,
    getCached,
    setCached,
    clearCached,
  } = context;

  const config = useConfig(options);
  const { reader, invalidateAge, staleWhileMounted } = config;

  const readCache = useCallback(
    function readCache(cachePath: string | null) {
      if (!staleWhileMounted || cachePath === null) return undefined;
      return getCached(cachePath);
    },
    [getCached, staleWhileMounted]
  );

  const [state, dispatch] = useReducer<ReaderReducer<T>, null>(
    reducer,
    null,
    () => initialState<T>(path, readCache(path))
  );

  const [invalidateToken, setInvalidateToken] = useState(0);
  const invalidate = useCallback(
    function invalidate() {
      // Data known to be out of date must not survive in the cache to be
      // served to a later mount.
      if (path !== null) clearCached(path);
      setInvalidateToken(Math.random());
    },
    [clearCached, path]
  );

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
    addMountedEntry(instanceKey, path, invalidate, mutate);
    return () => {
      removeMountedEntry(instanceKey);
    };
  }, [
    addMountedEntry,
    removeMountedEntry,
    instanceKey,
    path,
    invalidate,
    mutate,
  ]);

  // Effect: Perform the API request
  const previousPath = usePrevious(path);
  useEffect(() => {
    let ignore = false;

    async function readRequest() {
      const pathChanged = previousPath !== path;
      dispatch({
        type: 'READ_REQUEST',
        payload: { config, path, pathChanged, cached: readCache(path) },
      });

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
              path,
              receivedAt: Math.floor(Date.now() / 1000),
            },
          });
        }
      } catch (error) {
        if (!ignore) {
          dispatch({
            type: 'READ_FAILURE',
            payload: { config, error: error as Error },
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
  }, [path, reader, config, invalidateToken, readCache]);

  // Effect: Write successful reads back to the global cache
  useEffect(() => {
    if (!staleWhileMounted || path === null) return;
    if (state.data === undefined || state.receivedAt === null) return;
    // A path change re-renders before the request effect resets the state, so
    // the previous path's data is briefly still present.
    if (state.dataPath !== path) return;
    setCached(path, state.data, state.receivedAt);
  }, [
    setCached,
    staleWhileMounted,
    path,
    state.data,
    state.dataPath,
    state.receivedAt,
  ]);

  // Effect: Manage invalidateAge timeout
  useEffect(() => {
    if (!invalidateAge || !state.data || state.staleReason) return;

    const timeoutId = setTimeout(() => {
      invalidate();
    }, invalidateAge * 1000);
    return () => clearTimeout(timeoutId);
  }, [invalidateAge, state.data, state.staleReason, invalidate]);

  // Effect: Warn about a silently ineffective config
  useEffect(() => {
    if (
      staleWhileMounted &&
      !hasProvider &&
      process.env.NODE_ENV !== 'production'
    ) {
      console.warn(
        'api-read-hook: `staleWhileMounted` has no effect without an ' +
          '<ApiReadProvider>, which owns the cache.'
      );
    }
  }, [staleWhileMounted, hasProvider]);

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
