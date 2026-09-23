import { CacheEntry, ReadConfig, StaleReason } from '../types';
import { Reducer, Dispatch, ReducerAction } from 'react';

type State<T> = {
  data: T | undefined;
  error: Error | undefined;
  staleReason: null | StaleReason;
  receivedAt: null | number;
};

type Action<T> =
  | {
      type: 'READ_REQUEST';
      payload: {
        config: ReadConfig;
        pathChanged: boolean;
        cached?: CacheEntry;
      };
    }
  | {
      type: 'READ_SUCCESS';
      payload: { data: T; receivedAt: number; config: ReadConfig };
    }
  | { type: 'READ_FAILURE'; payload: { error: Error; config: ReadConfig } }
  | { type: 'MORE_DATA'; payload: { data: T } }
  | { type: 'MUTATED_DATA'; payload: { data: T } };

export type ReaderReducer<T> = Reducer<State<T>, Action<T>>;
export type ReaderDispatch<T> = Dispatch<ReducerAction<ReaderReducer<T>>>;

export default function reducer<T>(
  state: State<T>,
  action: Action<T>
): State<T> {
  switch (action.type) {
    case 'READ_REQUEST': {
      const allowStale =
        action.payload.config.staleWhileInvalidated &&
        !action.payload.pathChanged;
      const preservingStale = allowStale && state.data !== undefined;
      if (preservingStale) {
        return {
          error: undefined,
          data: state.data,
          staleReason: 'invalidated',
          receivedAt: state.receivedAt,
        };
      }
      const { cached } = action.payload;
      if (cached !== undefined) {
        return {
          error: undefined,
          data: cached.data as T,
          staleReason: 'mounted',
          receivedAt: cached.receivedAt,
        };
      }
      return {
        error: undefined,
        data: undefined,
        staleReason: null,
        receivedAt: null,
      };
    }
    case 'READ_SUCCESS':
      return {
        data: action.payload.data,
        error: undefined,
        staleReason: null,
        receivedAt: action.payload.receivedAt,
      };
    case 'READ_FAILURE': {
      const allowStale =
        action.payload.config.staleWhileError ||
        state.staleReason === 'mounted';
      const preservingStale = allowStale && state.data !== undefined;
      return {
        error: action.payload.error,
        data: preservingStale ? state.data : undefined,
        staleReason: preservingStale
          ? state.staleReason === 'mounted'
            ? 'mounted'
            : 'invalidated'
          : null,
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
