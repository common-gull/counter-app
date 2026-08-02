import { mount, unmount } from 'svelte';
import { clearBody, waitUntil } from '../testing/dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCounter } from '../counters/queries';
import { resetDatabase } from '../testing/reset-db';
import { logEntry } from './queries';
import TotalsBar from './TotalsBar.svelte';

// Wednesday 18 June 2025, noon. Its week starts Monday the 16th, month on the 1st.
const NOW = new Date('2025-06-18T12:00:00-04:00');
const T0 = NOW.getTime();
const DAY = 24 * 60 * 60_000;

let counterId: number;

beforeEach(async () => {
	await resetDatabase();
	counterId = await addCounter({ name: 'Cat treats' }, T0);
});
afterEach(clearBody);

function render() {
	return mount(TotalsBar, { target: document.body, props: { counterId, now: NOW } });
}

async function waitForFigures(expected: string[]) {
	await waitUntil(
		() => JSON.stringify(figures()) === JSON.stringify(expected),
		`figures ${JSON.stringify(expected)}`
	);
}

/** The three figures, in day / week / month order. */
function figures(): string[] {
	return [...document.body.querySelectorAll('dd')].map((dd) => dd.textContent!.trim());
}

describe('TotalsBar', () => {
	it('shows zero across all three windows when nothing is logged', async () => {
		const component = render();
		await waitForFigures(['0', '0', '0']);
		expect(figures()).toEqual(['0', '0', '0']);
		unmount(component);
	});

	it("counts today's entry in all three windows", async () => {
		await logEntry(counterId, 5, T0);
		const component = render();
		await waitForFigures(['5', '5', '5']);
		expect(figures()).toEqual(['5', '5', '5']);
		unmount(component);
	});

	it('excludes an earlier day from today but keeps it in the week', async () => {
		await logEntry(counterId, 5, T0);
		await logEntry(counterId, 3, T0 - DAY); // Tuesday, same week
		const component = render();
		await waitForFigures(['5', '8', '8']);
		expect(figures()).toEqual(['5', '8', '8']);
		unmount(component);
	});

	it('excludes a previous week from the week but keeps it in the month', async () => {
		await logEntry(counterId, 5, T0);
		await logEntry(counterId, 7, T0 - 7 * DAY); // Wednesday the 11th
		const component = render();
		await waitForFigures(['5', '5', '12']);
		expect(figures()).toEqual(['5', '5', '12']);
		unmount(component);
	});

	it('excludes a previous month entirely', async () => {
		await logEntry(counterId, 5, T0);
		await logEntry(counterId, 100, new Date('2025-05-20T12:00:00-04:00').getTime());
		const component = render();
		await waitForFigures(['5', '5', '5']);
		expect(figures()).toEqual(['5', '5', '5']);
		unmount(component);
	});

	it('groups a large total and leaves it able to truncate', async () => {
		// This figure widened its grid column and dragged the page past the viewport.
		await logEntry(counterId, 1234123412470, T0);
		const component = render();
		const grouped = '1,234,123,412,470';
		await waitForFigures([grouped, grouped, grouped]);

		// Without `truncate` the figure has nothing stopping it overflowing again.
		expect(document.body.querySelector('dd span')?.className).toContain('truncate');
		unmount(component);
	});

	it('keeps the figure and unit in separate elements', async () => {
		await logEntry(counterId, 5, T0);
		const component = mount(TotalsBar, {
			target: document.body,
			props: { counterId, unit: 'treats', now: NOW }
		});

		await waitUntil(() => document.body.textContent?.includes('5') ?? false, 'the figure');

		// Sharing a baseline made "13 treats" read as one blob and knocked the three
		// tiles out of alignment once the figures differed in width.
		const parts = [...document.body.querySelector('dd')!.querySelectorAll('span')].map((s) =>
			s.textContent!.trim()
		);
		expect(parts).toEqual(['5', 'treats']);
		unmount(component);
	});

	it('updates when an entry is logged after mount', async () => {
		const component = render();
		await waitForFigures(['0', '0', '0']);

		await logEntry(counterId, 4, T0);

		await waitForFigures(['4', '4', '4']);
		expect(figures()).toEqual(['4', '4', '4']);
		unmount(component);
	});
});
