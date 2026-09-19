import '@testing-library/jest-dom/vitest';

import {
  afterEach,
  beforeEach,
  vi,
} from 'vitest';

import { cleanup } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
})