import { useContext } from 'react';

import { ApiReadContext } from './ApiReadContext';

/**
 * Shortcut for accessing global invalidation utils.
 *
 * Useful from within a component that isn't doing its own reading (just
 * mutating).
 */
export default function useInvalidation() {
  const { invalidateExact, invalidateMatching } = useContext(ApiReadContext);
  return { invalidateExact, invalidateMatching };
}
