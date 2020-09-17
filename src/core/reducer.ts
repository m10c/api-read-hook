import { ReadConfig, StaleReason } from '../types';
import { Reducer, Dispatch, ReducerAction } from 'react';

type State<T> = {
  data: T | undefined;
  error: Error | undefined;
  staleReason: null | StaleReason;
};

type Action<T> =
  | {
      type: 'READ_REQUEST';
      payload: { config: ReadConfig; pathChanged: boolean };
    }
  | { type: 'READ_SUCCESS'; payload: { data: T; config: ReadConfig } }
  | { type: 'READ_FAILURE'; payload: { error: Error; config: ReadConfig } }
  | { type: 'MORE_DATA'; payload: { data: T } };

export type ReaderReducer<T> = Reducer<State<T>, Action<T>>;
export type ReaderDispatch<T> = Dispatch<ReducerAction<ReaderReducer<T>>>;

export default function reducer<T>(
  state: State<T>,
  action: Action<T>
): State<T> {
  switch (action.type) {
    case 'READ_REQUEST':
      const allowStale =
        action.payload.config.staleWhenInvalidated &&
        !action.payload.pathChanged;
      return {
        error: undefined,
        data: allowStale ? state.data : undefined,
        staleReason:
          allowStale && state.data !== undefined ? 'invalidated' : null,
      };
    case 'READ_SUCCESS':
      return {
        data: action.payload.data,
        error: undefined,
        staleReason: null,
      };
    case 'READ_FAILURE':
      return {
        error: action.payload.error,
        data: action.payload.config.staleWhenError ? state.data : undefined,
        staleReason:
          action.payload.config.staleWhenInvalidated && state.data !== undefined
            ? 'invalidated'
            : null,
      };
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
