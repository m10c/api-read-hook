import { ReadConfig, StaleReason } from '../types';
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
        pathIsNull: boolean;
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
      const { config, pathChanged, pathIsNull } = action.payload;
      let staleReason: StaleReason | null = null;
      if (!pathChanged && config.staleWhileInvalidated) {
        staleReason = 'invalidated';
      }
      // A null path means the caller has nothing to read, so nothing to keep
      if (pathChanged && config.keepPreviousData && !pathIsNull) {
        staleReason = 'pathChanged';
      }
      const preservingStale = staleReason !== null && state.data !== undefined;
      return {
        error: undefined,
        data: preservingStale ? state.data : undefined,
        staleReason: preservingStale ? staleReason : null,
        receivedAt: preservingStale ? state.receivedAt : null,
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
      const allowStale = action.payload.config.staleWhileError;
      const preservingStale = allowStale && state.data !== undefined;
      return {
        error: action.payload.error,
        data: allowStale ? state.data : undefined,
        staleReason: preservingStale ? 'invalidated' : null,
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
