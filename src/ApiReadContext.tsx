import * as React from 'react';

import { ReadConfig } from './types';

type Mutator = <T>(data: T) => T;
type MountedEntries = {
  [key: string]: {
    path: string;
    invalidate: () => void;
    mutate: (mutator: Mutator) => void;
  };
};

export type CacheEntry = { data: unknown; receivedAt: number };
type Cache = { [path: string]: CacheEntry };

type PathPredicate = (path: string) => boolean;

function exactly(search: string): PathPredicate {
  return function predicate(path) {
    return path === search;
  };
}

function matching(search: string | RegExp): PathPredicate {
  return function predicate(path) {
    return Boolean(path.match(search));
  };
}

export const ApiReadContext = React.createContext<{
  hasProvider: boolean;
  config: ReadConfig;
  addMountedEntry: (
    key: string,
    path: string,
    invalidate: () => void,
    mutate: (mutator: Mutator) => void
  ) => void;
  removeMountedEntry: (key: string) => void;
  getCached: (path: string) => CacheEntry | undefined;
  setCached: (path: string, data: unknown, receivedAt: number) => void;
  clearCached: (path: string) => void;
  invalidateExact: (search: string) => void;
  invalidateMatching: (search: string | RegExp) => void;
  mutateExact: (search: string, mutator: Mutator) => void;
  mutateMatching: (search: string | RegExp, mutator: Mutator) => void;
}>({
  hasProvider: false,
  config: {},
  addMountedEntry: () => {},
  removeMountedEntry: () => {},
  getCached: () => undefined,
  setCached: () => {},
  clearCached: () => {},
  invalidateExact: () => {},
  invalidateMatching: () => {},
  mutateExact: () => {},
  mutateMatching: () => {},
});

type Props = {
  config: ReadConfig;
  children: React.ReactNode;
};

export function ApiReadProvider({ config, children }: Props) {
  const mountedEntriesRef = React.useRef<MountedEntries>({});
  const cacheRef = React.useRef<Cache>({});

  const addMountedEntry = React.useCallback(function addMountedEntry(
    key: string,
    path: string,
    invalidate: () => void,
    mutate: (mutator: Mutator) => void
  ): void {
    mountedEntriesRef.current[key] = { path, invalidate, mutate };
  },
  []);

  const removeMountedEntry = React.useCallback(function removeMountedEntry(
    key: string
  ): void {
    delete mountedEntriesRef.current[key];
  },
  []);

  const getCached = React.useCallback(function getCached(
    path: string
  ): CacheEntry | undefined {
    return cacheRef.current[path];
  },
  []);

  const setCached = React.useCallback(function setCached(
    path: string,
    data: unknown,
    receivedAt: number
  ): void {
    cacheRef.current[path] = { data, receivedAt };
  },
  []);

  const clearCached = React.useCallback(function clearCached(
    path: string
  ): void {
    delete cacheRef.current[path];
  },
  []);

  // Invalidation drops cached responses as well as notifying mounted hooks, so
  // that a path which is remounted later can't be served data already known to
  // be out of date.
  const invalidateWhere = React.useCallback(function invalidateWhere(
    predicate: PathPredicate
  ): void {
    for (const path of Object.keys(cacheRef.current)) {
      if (predicate(path)) delete cacheRef.current[path];
    }
    for (const entry of Object.values(mountedEntriesRef.current)) {
      if (predicate(entry.path)) entry.invalidate();
    }
  },
  []);

  // Mounted hooks write their mutated data back to the cache, so applying the
  // mutator to a path which is both mounted and cached converges on the same
  // result rather than applying twice.
  const mutateWhere = React.useCallback(function mutateWhere(
    predicate: PathPredicate,
    mutator: Mutator
  ): void {
    for (const [path, cached] of Object.entries(cacheRef.current)) {
      if (predicate(path)) {
        cacheRef.current[path] = { ...cached, data: mutator(cached.data) };
      }
    }
    for (const entry of Object.values(mountedEntriesRef.current)) {
      if (predicate(entry.path)) entry.mutate(mutator);
    }
  },
  []);

  const invalidateExact = React.useCallback(
    function invalidateExact(search: string): void {
      invalidateWhere(exactly(search));
    },
    [invalidateWhere]
  );

  const invalidateMatching = React.useCallback(
    function invalidateMatching(search: string | RegExp): void {
      invalidateWhere(matching(search));
    },
    [invalidateWhere]
  );

  const mutateExact = React.useCallback(
    function mutateExact(search: string, mutator: Mutator): void {
      mutateWhere(exactly(search), mutator);
    },
    [mutateWhere]
  );

  const mutateMatching = React.useCallback(
    function mutateMatching(search: string | RegExp, mutator: Mutator): void {
      mutateWhere(matching(search), mutator);
    },
    [mutateWhere]
  );

  return (
    <ApiReadContext.Provider
      value={{
        hasProvider: true,
        config,
        addMountedEntry,
        removeMountedEntry,
        getCached,
        setCached,
        clearCached,
        invalidateExact,
        invalidateMatching,
        mutateExact,
        mutateMatching,
      }}
    >
      {children}
    </ApiReadContext.Provider>
  );
}
