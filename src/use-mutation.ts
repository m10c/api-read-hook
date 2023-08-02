import { useContext } from 'react';

import { ApiReadContext } from './ApiReadContext';

export default function useMutation() {
  const { mutateExact, mutateMatching } = useContext(ApiReadContext);
  return { mutateExact, mutateMatching };
}
