import { describe, expect, it } from 'vitest';

// Mirrors the guard in time.test.ts, for the other vitest project. Component tests
// render local times, so if the `env: { TZ }` setting on the client project is lost
// they start passing locally and failing on a CI runner in UTC. This fails first and
// explains why.
describe('client test environment', () => {
	it('runs in the pinned America/New_York timezone', () => {
		expect(new Date('2025-06-15T12:00:00Z').getHours()).toBe(8);
	});
});
