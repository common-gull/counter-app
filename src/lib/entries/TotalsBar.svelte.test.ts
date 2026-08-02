import { mount, unmount } from 'svelte';
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
afterEach(() => {
	document.body.innerHTML = '';
});

function render() {
	return mount(TotalsBar, { target: document.body, props: { counterId, now: NOW } });
}

/** The three figures, in day / week / month order. */
function figures(): string[] {
	return [...document.body.querySelectorAll('dd')].map((dd) => dd.textContent!.trim());
}

async function waitForFigures(expected: string[], timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	while (JSON.stringify(figures()) !== JSON.stringify(expected)) {
		if (Date.now() > deadline) throw new Error(`timed out; saw ${JSON.stringify(figures())}`);
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
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

	it('updates when an entry is logged after mount', async () => {
		const component = render();
		await waitForFigures(['0', '0', '0']);

		await logEntry(counterId, 4, T0);

		await waitForFigures(['4', '4', '4']);
		expect(figures()).toEqual(['4', '4', '4']);
		unmount(component);
	});
});
