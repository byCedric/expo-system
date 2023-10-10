import { afterEach } from 'bun:test';

// Import the feature-populated system instance
import {
  System,
  REGISTRY,
  NAMED_ALIASES,
  NAMED_REGISTRY,
} from '../../';

// Reset all modules after each test
afterEach(() => {
  System[REGISTRY].clear();
  System[NAMED_ALIASES].clear();
  System[NAMED_REGISTRY].clear();
});
