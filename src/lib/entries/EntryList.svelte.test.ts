import { mount, unmount } from 'svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { addCounter } from '../counters/queries';
import { resetDatabase } from '../testing/reset-db';
import EntryList from './EntryList.svelte';
import { logEntry } from './queries';

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
	return mount(EntryList, { target: document.body, props: { counterId, now: NOW } });
}

async function waitForText(text: string, timeoutMs = 2000) {
	const deadline = Date.now() + timeoutMs;
	while (!document.body.textContent?.includes(text)) {
		if (Date.now() > deadline) {
			throw new Error(`timed out waiting for "${text}"; saw "${document.body.textContent}"`);
		}
		await new Promise((resolve) => setTimeout(resolve, 5));
	}
}

const headings = () => [...document.body.querySelectorAll('h3')].map((h) => h.textContent!.trim());

describe('EntryList', () => {
	it('shows an empty state when nothing is logged', async () => {
		const component = render();
		await waitForText('Nothing logged yet');
		expect(document.body.querySelectorAll('li')).toHaveLength(0);
		unmount(component);
	});

	it('lists an entry under a Today heading', async () => {
		await logEntry(counterId, 3, T0);
		const component = render();
		await waitForText('Today');
		expect(headings()).toEqual(['Today']);
		unmount(component);
	});

	it('groups entries from the same day together', async () => {
		await logEntry(counterId, 1, T0);
		await logEntry(counterId, 2, T0 - 60 * 60_000);
		const component = render();
		await waitForText('Today');
		expect(document.body.querySelectorAll('li')).toHaveLength(2);
		expect(headings()).toEqual(['Today']);
		unmount(component);
	});

	it('separates days, newest first', async () => {
		await logEntry(counterId, 1, T0);
		await logEntry(counterId, 2, T0 - DAY);
		await logEntry(counterId, 3, T0 - 3 * DAY);
		const component = render();
		await waitForText('Yesterday');
		expect(headings()).toEqual(['Today', 'Yesterday', 'Sun, Jun 15']);
		unmount(component);
	});

	it('shows the amount and the unit', async () => {
		await logEntry(counterId, 7, T0);
		const component = mount(EntryList, {
			target: document.body,
			props: { counterId, unit: 'treats', now: NOW }
		});
		await waitForText('7');
		expect(document.body.querySelector('li')?.textContent).toContain('treats');
		unmount(component);
	});

	it('only lists entries for this counter', async () => {
		const other = await addCounter({ name: 'Water' }, T0);
		await logEntry(counterId, 1, T0);
		await logEntry(other, 99, T0);
		const component = render();
		await waitForText('Today');
		expect(document.body.textContent).not.toContain('99');
		unmount(component);
	});

	it('picks up an entry logged after mount', async () => {
		const component = render();
		await waitForText('Nothing logged yet');

		await logEntry(counterId, 6, T0);

		await waitForText('Today');
		expect(document.body.querySelectorAll('li')).toHaveLength(1);
		unmount(component);
	});
});
