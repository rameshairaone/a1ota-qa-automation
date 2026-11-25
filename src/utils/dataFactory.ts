import { faker } from '@faker-js/faker';

/**
 * Builds unique test data so tests can run in parallel without colliding.
 * Pass overrides for the fields a test cares about.
 */
export const dataFactory = {
  /** An email address that no real account uses (reserved example.com domain). */
  unknownEmail(): string {
    return `qa.${faker.string.alphanumeric(10).toLowerCase()}@example.com`;
  },

  password(): string {
    return faker.internet.password({ length: 16 });
  },

  uniqueId(prefix = 'qa'): string {
    return `${prefix}-${Date.now()}-${faker.string.alphanumeric(6)}`;
  },
};
