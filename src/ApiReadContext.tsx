import * as React from 'react';

import { ReadConfig } from './types';

type InvalidationEntries = { [key: string]: [string, () => void] };

export const ApiReadContext = React.createContext<{
  config: ReadConfig;
  addInvalidationEntry: (
    key: string,
    path: string,
    invalidate: () => void
  ) => void;
  removeInvalidationEntry: (key: string) => void;
  invalidateMatching: (search: string | RegExp) => void;
}>({
  config: {},
  addInvalidationEntry: () => {},
  removeInvalidationEntry: () => {},
  invalidateMatching: () => {},
});

type Props = {
  config: ReadConfig;
  children: React.ReactNode;
};

export function ApiReadProvider({ config, children }: Props) {
  const invalidationEntriesRef = React.useRef<InvalidationEntries>({});

  const addInvalidationEntry = React.useCallback(function addInvalidationEntry(
    key: string,
    path: string,
    invalidate: () => void
  ): void {
    invalidationEntriesRef.current[key] = [path, invalidate];
  },
  []);

  const removeInvalidationEntry = React.useCallback(
    function removeInvalidationEntry(key: string): void {
      delete invalidationEntriesRef.current[key];
    },
    []
  );

  const invalidateMatching = React.useCallback(function invalidateMatching(
    search: string | RegExp
  ): void {
    for (const entry of Object.values(invalidationEntriesRef.current)) {
      if (entry[0].match(search)) {
        entry[1]();
      }
    }
  },
  []);

  return (
    <ApiReadContext.Provider
      value={{
        config,
        addInvalidationEntry,
        removeInvalidationEntry,
        invalidateMatching,
      }}
    >
      {children}
    </ApiReadContext.Provider>
  );
}
