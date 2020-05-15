import { useContext, useMemo } from 'react';
import { ReadConfig } from '../types';
import { ApiReadContext } from '../ApiReadContext';

/**
 * Merge together the context config and per-instance config, and memoize the
 * value into one object which only changes when individual values change.
 */
export default function useConfig(options: ReadConfig = {}) {
  const context = useContext(ApiReadContext);
  const config = useMemo(
    () => ({
      reader: context.config.reader || options.reader,
      staleWhenError: context.config.staleWhenError || options.staleWhenError,
      staleWhenInvalidated:
        context.config.staleWhenInvalidated || options.staleWhenInvalidated,
    }),
    [
      context.config.reader,
      context.config.staleWhenError,
      context.config.staleWhenInvalidated,
      options.reader,
      options.staleWhenError,
      options.staleWhenInvalidated,
    ]
  );
  return config;
}
