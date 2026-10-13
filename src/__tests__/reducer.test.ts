import reducer from '../core/reducer';
import { ReadConfig } from '../types';

const loaded = {
  data: { items: [1, 2, 3] },
  error: undefined,
  staleReason: null,
  receivedAt: 100,
};

function readRequest(
  config: ReadConfig,
  { pathChanged = false, pathIsNull = false } = {}
) {
  return reducer(loaded, {
    type: 'READ_REQUEST',
    payload: { config, pathChanged, pathIsNull },
  });
}

describe('READ_REQUEST', () => {
  it('clears data on a path change by default', () => {
    expect(readRequest({}, { pathChanged: true }).data).toBeUndefined();
  });

  it('clears data on a path change with only staleWhileInvalidated', () => {
    const state = readRequest(
      { staleWhileInvalidated: true },
      { pathChanged: true }
    );
    expect(state.data).toBeUndefined();
  });

  it('keeps data on a path change with keepPreviousData', () => {
    const state = readRequest(
      { keepPreviousData: true },
      { pathChanged: true }
    );
    expect(state.data).toBe(loaded.data);
    expect(state.staleReason).toBe('pathChanged');
    expect(state.receivedAt).toBe(100);
  });

  it('clears data when the path changes to null, even with keepPreviousData', () => {
    const state = readRequest(
      { keepPreviousData: true },
      { pathChanged: true, pathIsNull: true }
    );
    expect(state.data).toBeUndefined();
    expect(state.staleReason).toBeNull();
  });

  it('keeps data on invalidation with staleWhileInvalidated', () => {
    const state = readRequest({ staleWhileInvalidated: true });
    expect(state.data).toBe(loaded.data);
    expect(state.staleReason).toBe('invalidated');
  });

  it('clears data on invalidation with only keepPreviousData', () => {
    expect(readRequest({ keepPreviousData: true }).data).toBeUndefined();
  });
});
