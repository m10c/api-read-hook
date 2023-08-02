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
}>({
  config: {},
  addMountedEntry: () => {},
  removeMountedEntry: () => {},
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

  const invalidateExact = React.useCallback(function invalidatExact(
    search: string
  ): void {
    for (const entry of Object.values(mountedEntriesRef.current)) {
      if (entry.path === search) {
        entry.invalidate();
      }
    }
  },
  []);

  const invalidateMatching = React.useCallback(function invalidateMatching(
    search: string | RegExp
  ): void {
    for (const entry of Object.values(mountedEntriesRef.current)) {
      if (entry.path.match(search)) {
        entry.invalidate();
      }
    }
  },
  []);

  const mutateExact = React.useCallback(function mutateExact(
    search: string,
    mutator: Mutator
  ): void {
    for (const entry of Object.values(mountedEntriesRef.current)) {
      if (entry.path === search) {
        entry.mutate(mutator);
      }
    }
  },
  []);

  const mutateMatching = React.useCallback(function mutateMatching(
    search: string | RegExp,
    mutator: Mutator
  ): void {
    for (const entry of Object.values(mountedEntriesRef.current)) {
      if (entry.path.match(search)) {
        entry.mutate(mutator);
      }
    }
  },
  []);

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
      }}
    >
      {children}
    </ApiReadContext.Provider>
  );
}
