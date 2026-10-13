import { useContext, useMemo } from 'react';
import { ReadConfig } from '../types';
import { ApiReadContext } from '../ApiReadContext';

/**
 * Merge together the context config and per-instance config, and memoize the
 * value into one object which only changes when individual values change.
 */
export default function useConfig(options: ReadConfig = {}): ReadConfig {
  const context = useContext(ApiReadContext);
  const config = useMemo(
    () => ({
      reader: options.reader ?? context.config.reader,
      staleWhileError:
        options.staleWhileError ?? context.config.staleWhileError,
      staleWhileInvalidated:
        options.staleWhileInvalidated ?? context.config.staleWhileInvalidated,
      invalidateAge: options.invalidateAge ?? context.config.invalidateAge,
      keepPreviousData:
        options.keepPreviousData ?? context.config.keepPreviousData,
    }),
    [
      context.config.reader,
      context.config.staleWhileError,
      context.config.staleWhileInvalidated,
      context.config.invalidateAge,
      context.config.keepPreviousData,
      options.reader,
      options.staleWhileError,
      options.staleWhileInvalidated,
      options.invalidateAge,
      options.keepPreviousData,
    ]
  );
  return config;
}
