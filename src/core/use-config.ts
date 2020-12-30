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
      staleWhenError: options.staleWhenError ?? context.config.staleWhenError,
      staleWhenInvalidated:
        options.staleWhenInvalidated ?? context.config.staleWhenInvalidated,
      invalidateAge: options.invalidateAge ?? context.config.invalidateAge,
    }),
    [
      context.config.reader,
      context.config.staleWhenError,
      context.config.staleWhenInvalidated,
      context.config.invalidateAge,
      options.reader,
      options.staleWhenError,
      options.staleWhenInvalidated,
      options.invalidateAge,
    ]
  );
  return config;
}
