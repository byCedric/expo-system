import { afterEach } from 'bun:test';

import { REGISTRY, System } from '../core/system';

// Reset all modules after each test
afterEach(() => System[REGISTRY].clear());
