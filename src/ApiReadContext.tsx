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
  const { current: invalidationEntries } = React.useRef<InvalidationEntries>(
    {}
  );

  function addInvalidationEntry(
    key: string,
    path: string,
    invalidate: () => void
  ): void {
    invalidationEntries[key] = [path, invalidate];
  }

  function removeInvalidationEntry(key: string): void {
    delete invalidationEntries[key];
  }

  function invalidateMatching(search: string | RegExp): void {
    for (const entry of Object.values(invalidationEntries)) {
      if (entry[0].match(search)) {
        entry[1]();
      }
    }
  }

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
