import { Reducer, Dispatch, ReducerAction } from 'react';

import { CacheEntry } from '../ApiReadContext';
import { ReadConfig, StaleReason } from '../types';

export type State<T> = {
  data: T | undefined;
  /**
   * Path the current `data` was read for, so that data belonging to a previous
   * path isn't written back to the cache under a newly requested path.
   */
  dataPath: string | null;
  error: Error | undefined;
  staleReason: null | StaleReason;
  receivedAt: null | number;
};

type Action<T> =
  | {
      type: 'READ_REQUEST';
      payload: {
        config: ReadConfig;
        path: string | null;
        pathChanged: boolean;
        cached: CacheEntry | undefined;
      };
    }
  | {
      type: 'READ_SUCCESS';
      payload: {
        data: T;
        path: string | null;
        receivedAt: number;
        config: ReadConfig;
      };
    }
  | { type: 'READ_FAILURE'; payload: { error: Error; config: ReadConfig } }
  | { type: 'MORE_DATA'; payload: { data: T } }
  | { type: 'MUTATED_DATA'; payload: { data: T } };

export type ReaderReducer<T> = Reducer<State<T>, Action<T>>;
export type ReaderDispatch<T> = Dispatch<ReducerAction<ReaderReducer<T>>>;

function emptyState<T>(): State<T> {
  return {
    data: undefined,
    dataPath: null,
    error: undefined,
    staleReason: null,
    receivedAt: null,
  };
}

/**
 * The cache is keyed by path rather than by response type, so the caller's `T`
 * can only be applied here.
 */
function cachedState<T>(path: string | null, cached: CacheEntry): State<T> {
  return {
    data: cached.data as T,
    dataPath: path,
    error: undefined,
    staleReason: 'mounted',
    receivedAt: cached.receivedAt,
  };
}

export function initialState<T>(
  path: string | null,
  cached: CacheEntry | undefined
): State<T> {
  return cached ? cachedState<T>(path, cached) : emptyState<T>();
}

export default function reducer<T>(
  state: State<T>,
  action: Action<T>
): State<T> {
  switch (action.type) {
    case 'READ_REQUEST': {
      const { config, path, pathChanged, cached } = action.payload;

      // Data this instance already read takes precedence over the cache, as
      // it's at least as fresh and reflects any local mutations.
      const keepingOwnData =
        Boolean(config.staleWhileInvalidated) &&
        !pathChanged &&
        state.data !== undefined;
      if (keepingOwnData) {
        return {
          data: state.data,
          dataPath: state.dataPath,
          error: undefined,
          staleReason: 'invalidated',
          receivedAt: state.receivedAt,
        };
      }

      if (config.staleWhileMounted && cached) {
        return cachedState<T>(path, cached);
      }

      return emptyState<T>();
    }
    case 'READ_SUCCESS':
      return {
        data: action.payload.data,
        dataPath: action.payload.path,
        error: undefined,
        staleReason: null,
        receivedAt: action.payload.receivedAt,
      };
    case 'READ_FAILURE': {
      const preservingStale =
        Boolean(action.payload.config.staleWhileError) &&
        state.data !== undefined;
      return {
        data: preservingStale ? state.data : undefined,
        dataPath: preservingStale ? state.dataPath : null,
        error: action.payload.error,
        staleReason: preservingStale ? 'error' : null,
        receivedAt: preservingStale ? state.receivedAt : null,
      };
    }
    case 'MORE_DATA':
      return {
        // TODO: Needs more thought about interactions with rest of state
        ...state,
        data: action.payload.data,
      };
    case 'MUTATED_DATA':
      return {
        ...state,
        data: action.payload.data,
      };
    default:
      return state;
  }
}
