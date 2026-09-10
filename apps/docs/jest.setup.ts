import { TextDecoder, TextEncoder } from 'util';

(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

import '@testing-library/jest-dom';
