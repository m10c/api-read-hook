import { ReadConfig, StaleReason } from '../types';
import { Reducer, Dispatch, ReducerAction } from 'react';

type State<T> = {
  data: T | undefined;
  error: Error | undefined;
  staleReason: null | StaleReason;
  fetchedAt: null | number;
};

type Action<T> =
  | {
      type: 'READ_REQUEST';
      payload: { config: ReadConfig; pathChanged: boolean };
    }
  | {
      type: 'READ_SUCCESS';
      payload: { data: T; fetchedAt: number; config: ReadConfig };
    }
  | { type: 'READ_FAILURE'; payload: { error: Error; config: ReadConfig } }
  | { type: 'MORE_DATA'; payload: { data: T } };

export type ReaderReducer<T> = Reducer<State<T>, Action<T>>;
export type ReaderDispatch<T> = Dispatch<ReducerAction<ReaderReducer<T>>>;

export default function reducer<T>(
  state: State<T>,
  action: Action<T>
): State<T> {
  switch (action.type) {
    case 'READ_REQUEST': {
      const allowStale =
        action.payload.config.staleWhenInvalidated &&
        !action.payload.pathChanged;
      const preservingStale = allowStale && state.data !== undefined;
      return {
        error: undefined,
        data: allowStale ? state.data : undefined,
        staleReason: preservingStale ? 'invalidated' : null,
        fetchedAt: preservingStale ? state.fetchedAt : null,
      };
    }
    case 'READ_SUCCESS':
      return {
        data: action.payload.data,
        error: undefined,
        staleReason: null,
        fetchedAt: action.payload.fetchedAt,
      };
    case 'READ_FAILURE': {
      const allowStale = action.payload.config.staleWhenError;
      const preservingStale = allowStale && state.data !== undefined;
      return {
        error: action.payload.error,
        data: allowStale ? state.data : undefined,
        staleReason: preservingStale ? 'invalidated' : null,
        fetchedAt: preservingStale ? state.fetchedAt : null,
      };
    }
    case 'MORE_DATA':
      return {
        // TODO: Needs more thought about interactions with rest of state
        ...state,
        data: action.payload.data,
      };
    default:
      return state;
  }
}
