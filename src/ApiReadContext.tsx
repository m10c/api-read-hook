import * as React from 'react';

import { CacheEntry, PersistConfig, ReadConfig } from './types';
import useCache from './core/use-cache';

type Mutator = <T>(data: T) => T;
type MountedEntries = {
  [key: string]: {
    path: string;
    invalidate: () => void;
    mutate: (mutator: Mutator) => void;
  };
};

export const ApiReadContext = React.createContext<{
  config: ReadConfig;
  addMountedEntry: (
    key: string,
    path: string,
    invalidate: () => void,
    mutate: (mutator: Mutator) => void
  ) => void;
  removeMountedEntry: (key: string) => void;
  invalidateExact: (search: string) => void;
  invalidateMatching: (search: string | RegExp) => void;
  mutateExact: (search: string, mutator: Mutator) => void;
  mutateMatching: (search: string | RegExp, mutator: Mutator) => void;
  loadCached: (path: string) => Promise<CacheEntry | undefined>;
  setCached: (path: string, data: unknown, receivedAt: number) => void;
  dropCached: (path: string) => void;
}>({
  config: {},
  addMountedEntry: () => {},
  removeMountedEntry: () => {},
  invalidateExact: () => {},
  invalidateMatching: () => {},
  mutateExact: () => {},
  mutateMatching: () => {},
  loadCached: async () => undefined,
  setCached: () => {},
  dropCached: () => {},
});

type Props = {
  config: ReadConfig;
  persistConfig?: PersistConfig;
  children: React.ReactNode;
};

export function ApiReadProvider({ config, persistConfig, children }: Props) {
  const mountedEntriesRef = React.useRef<MountedEntries>({});

  const { loadCached, setCached, dropCached, dropCachedMatching } = useCache(
    persistConfig
  );

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

  const invalidateExact = React.useCallback(
    function invalidatExact(search: string): void {
      dropCached(search);
      for (const entry of Object.values(mountedEntriesRef.current)) {
        if (entry.path === search) {
          entry.invalidate();
        }
      }
    },
    [dropCached]
  );

  const invalidateMatching = React.useCallback(
    function invalidateMatching(search: string | RegExp): void {
      dropCachedMatching(search);
      for (const entry of Object.values(mountedEntriesRef.current)) {
        if (entry.path.match(search)) {
          entry.invalidate();
        }
      }
    },
    [dropCachedMatching]
  );

  const mutateExact = React.useCallback(
    function mutateExact(search: string, mutator: Mutator): void {
      dropCached(search);
      for (const entry of Object.values(mountedEntriesRef.current)) {
        if (entry.path === search) {
          entry.mutate(mutator);
        }
      }
    },
    [dropCached]
  );

  const mutateMatching = React.useCallback(
    function mutateMatching(search: string | RegExp, mutator: Mutator): void {
      dropCachedMatching(search);
      for (const entry of Object.values(mountedEntriesRef.current)) {
        if (entry.path.match(search)) {
          entry.mutate(mutator);
        }
      }
    },
    [dropCachedMatching]
  );

  return (
    <ApiReadContext.Provider
      value={{
        config,
        addMountedEntry,
        removeMountedEntry,
        invalidateExact,
        invalidateMatching,
        mutateExact,
        mutateMatching,
        loadCached,
        setCached,
        dropCached,
      }}
    >
      {children}
    </ApiReadContext.Provider>
  );
}
