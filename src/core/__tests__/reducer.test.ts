import { CacheEntry } from '../../ApiReadContext';
import { ReadConfig } from '../../types';
import reducer, { initialState, State } from '../reducer';

type Data = { value: number };

const cached: CacheEntry = { data: { value: 1 }, receivedAt: 100 };

function ownState(overrides: Partial<State<Data>> = {}): State<Data> {
  return {
    ...initialState<Data>('/own', { data: { value: 2 }, receivedAt: 200 }),
    ...overrides,
  };
}

function readRequest(
  state: State<Data>,
  config: ReadConfig,
  payload: { path: string | null; pathChanged: boolean; cached?: CacheEntry }
) {
  return reducer<Data>(state, {
    type: 'READ_REQUEST',
    payload: {
      config,
      path: payload.path,
      pathChanged: payload.pathChanged,
      cached: payload.cached,
    },
  });
}

describe('initialState', () => {
  it('seeds from a cache entry', () => {
    expect(initialState<Data>('/a', cached)).toEqual({
      data: { value: 1 },
      dataPath: '/a',
      error: undefined,
      staleReason: 'mounted',
      receivedAt: 100,
    });
  });

  it('is empty without a cache entry', () => {
    expect(initialState<Data>('/a', undefined)).toEqual({
      data: undefined,
      dataPath: null,
      error: undefined,
      staleReason: null,
      receivedAt: null,
    });
  });
});

describe('READ_REQUEST', () => {
  it('seeds a changed path from the cache when staleWhileMounted is on', () => {
    const next = readRequest(
      ownState(),
      { staleWhileMounted: true },
      {
        path: '/a',
        pathChanged: true,
        cached,
      }
    );
    expect(next).toEqual({
      data: { value: 1 },
      dataPath: '/a',
      error: undefined,
      staleReason: 'mounted',
      receivedAt: 100,
    });
  });

  it('ignores the cache when staleWhileMounted is off', () => {
    const next = readRequest(
      ownState(),
      {},
      {
        path: '/a',
        pathChanged: true,
        cached,
      }
    );
    expect(next.data).toBeUndefined();
    expect(next.staleReason).toBeNull();
  });

  it('clears data for a changed path with no cache entry', () => {
    const next = readRequest(
      ownState(),
      { staleWhileMounted: true },
      {
        path: '/a',
        pathChanged: true,
      }
    );
    expect(next.data).toBeUndefined();
    expect(next.dataPath).toBeNull();
  });

  it('prefers the instance own data over the cache', () => {
    const next = readRequest(
      ownState(),
      { staleWhileMounted: true, staleWhileInvalidated: true },
      { path: '/own', pathChanged: false, cached }
    );
    expect(next).toEqual({
      data: { value: 2 },
      dataPath: '/own',
      error: undefined,
      staleReason: 'invalidated',
      receivedAt: 200,
    });
  });

  it('falls back to the cache when the instance has no data of its own', () => {
    const empty = initialState<Data>('/a', undefined);
    const next = readRequest(
      empty,
      { staleWhileMounted: true, staleWhileInvalidated: true },
      { path: '/a', pathChanged: false, cached }
    );
    expect(next.data).toEqual({ value: 1 });
    expect(next.staleReason).toBe('mounted');
  });
});

describe('READ_SUCCESS', () => {
  it('records the path the data was read for', () => {
    const next = reducer<Data>(initialState<Data>('/a', cached), {
      type: 'READ_SUCCESS',
      payload: { config: {}, data: { value: 3 }, path: '/a', receivedAt: 300 },
    });
    expect(next).toEqual({
      data: { value: 3 },
      dataPath: '/a',
      error: undefined,
      staleReason: null,
      receivedAt: 300,
    });
  });
});

describe('READ_FAILURE', () => {
  const error = new Error('nope');

  it('reports an error staleReason when preserving stale data', () => {
    const next = reducer<Data>(ownState(), {
      type: 'READ_FAILURE',
      payload: { config: { staleWhileError: true }, error },
    });
    expect(next).toEqual({
      data: { value: 2 },
      dataPath: '/own',
      error,
      staleReason: 'error',
      receivedAt: 200,
    });
  });

  it('clears data when staleWhileError is off', () => {
    const next = reducer<Data>(ownState(), {
      type: 'READ_FAILURE',
      payload: { config: {}, error },
    });
    expect(next).toEqual({
      data: undefined,
      dataPath: null,
      error,
      staleReason: null,
      receivedAt: null,
    });
  });
});

describe('MUTATED_DATA', () => {
  it('keeps the path and receivedAt of the mutated response', () => {
    const next = reducer<Data>(ownState(), {
      type: 'MUTATED_DATA',
      payload: { data: { value: 9 } },
    });
    expect(next).toEqual({
      data: { value: 9 },
      dataPath: '/own',
      error: undefined,
      staleReason: 'mounted',
      receivedAt: 200,
    });
  });
});
