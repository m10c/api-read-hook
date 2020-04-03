import { createContext } from 'react';
import { ReadConfig } from './types';

export const ApiReadContext = createContext<ReadConfig>({});

export const ApiReadConfig = ApiReadContext.Provider;
