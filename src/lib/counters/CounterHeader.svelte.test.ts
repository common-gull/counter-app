import { flushSync, mount, unmount } from 'svelte';
import {
	clearBody,
	click,
	field,
	submitForm,
	type,
	visibleText,
	waitForText,
	waitUntil
} from '../testing/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { countEntries, logEntry } from '../entries/queries';
import { resetDatabase } from '../testing/reset-db';
import CounterHeader from './CounterHeader.svelte';
import { addCounter, getCounter, listCounters } from './queries';
import type { Counter } from './types';

const T0 = 1_750_000_000_000;

let counter: Counter;

beforeEach(async () => {
	await resetDatabase();
	const id = await addCounter({ name: 'Cat treats' }, T0);
	counter = (await getCounter(id))!;
});
afterEach(clearBody);

function render(ondeleted?: () => void) {
	const component = mount(CounterHeader, {
		target: document.body,
		props: { counter, ondeleted }
	});
	flushSync();
	return component;
}

describe('CounterHeader', () => {
	it('shows the counter name', () => {
		const component = render();
		expect(document.body.querySelector('h1')?.textContent).toBe('Cat treats');
		unmount(component);
	});
});

describe('CounterHeader editing', () => {
	it('pre-fills the current name', () => {
		const component = render();
		click('Edit');
		expect(field('Counter name').value).toBe('Cat treats');
		unmount(component);
	});

	it('saves a new name', async () => {
		const component = render();
		click('Edit');
		type('Counter name', 'Dog treats');
		submitForm();

		await waitUntil(async () => (await getCounter(counter.id))?.name === 'Dog treats', 'the rename');
		expect((await getCounter(counter.id))?.name).toBe('Dog treats');
		unmount(component);
	});

	it('trims the new name', async () => {
		const component = render();
		click('Edit');
		type('Counter name', '   Dog treats   ');
		submitForm();

		await waitUntil(async () => (await getCounter(counter.id))?.name === 'Dog treats', 'the rename');
		expect((await getCounter(counter.id))?.name).toBe('Dog treats');
		unmount(component);
	});

	it('rejects an empty name and saves nothing', async () => {
		const component = render();
		click('Edit');
		type('Counter name', '   ');
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')).not.toBeNull();
		expect((await getCounter(counter.id))?.name).toBe('Cat treats');
		unmount(component);
	});

	it('discards changes on cancel', async () => {
		const component = render();
		click('Edit');
		type('Counter name', 'Something else');
		click('Cancel');

		expect(document.body.querySelector('form')).toBeNull();
		expect((await getCounter(counter.id))?.name).toBe('Cat treats');
		unmount(component);
	});

	it('pre-fills the current unit', async () => {
		const id = await addCounter({ name: 'Water', unit: 'cups' }, T0);
		counter = (await getCounter(id))!;
		const component = render();

		click('Edit');

		expect(field('Unit (optional)').value).toBe('cups');
		unmount(component);
	});

	it('leaves the unit field empty when the counter has none', () => {
		const component = render();
		click('Edit');
		expect(field('Unit (optional)').value).toBe('');
		unmount(component);
	});

	it('changes the unit', async () => {
		const component = render();
		click('Edit');
		type('Unit (optional)', 'treats');
		submitForm();

		await waitUntil(async () => (await getCounter(counter.id))?.unit === 'treats', 'the new unit');
		expect((await getCounter(counter.id))?.unit).toBe('treats');
		unmount(component);
	});

	it('clears the unit when the field is emptied', async () => {
		const id = await addCounter({ name: 'Water', unit: 'cups' }, T0);
		counter = (await getCounter(id))!;
		const component = render();

		click('Edit');
		type('Unit (optional)', '');
		submitForm();

		await waitUntil(async () => (await getCounter(id))?.unit === undefined, 'the unit to clear');
		expect(await getCounter(id)).not.toHaveProperty('unit');
		unmount(component);
	});

	it('changes name and unit together', async () => {
		const component = render();
		click('Edit');
		type('Counter name', 'Dog treats');
		type('Unit (optional)', 'biscuits');
		submitForm();

		await waitUntil(async () => (await getCounter(counter.id))?.unit === 'biscuits', 'the update');
		expect(await getCounter(counter.id)).toMatchObject({
			name: 'Dog treats',
			unit: 'biscuits'
		});
		unmount(component);
	});

	it('rejects an overlong unit and saves nothing', async () => {
		const component = render();
		click('Edit');
		type('Unit (optional)', 'x'.repeat(50));
		submitForm();
		flushSync();

		expect(document.body.querySelector('[role="alert"]')?.textContent).toMatch(/unit/i);
		expect(await getCounter(counter.id)).not.toHaveProperty('unit');
		unmount(component);
	});
});

describe('CounterHeader deleting', () => {
	it('asks first, and says how many entries go with it', async () => {
		await logEntry(counter.id, 1, T0);
		await logEntry(counter.id, 2, T0);
		const component = render();

		click('Delete');
		await waitForText('2 entries');

		expect(visibleText()).toContain('Delete "Cat treats"?');
		expect(await listCounters()).toHaveLength(1);
		unmount(component);
	});

	it('says so when there are no entries to lose', async () => {
		const component = render();

		click('Delete');
		await waitForText('no entries');

		expect(visibleText()).toContain('It has no entries');
		unmount(component);
	});

	it('uses the singular for one entry', async () => {
		await logEntry(counter.id, 1, T0);
		const component = render();

		click('Delete');
		await waitForText('1 entry');

		expect(visibleText()).not.toContain('1 entries');
		unmount(component);
	});

	it('deletes the counter and its entries once confirmed', async () => {
		await logEntry(counter.id, 1, T0);
		const component = render();

		click('Delete');
		await waitForText('1 entry');
		click('Delete counter');

		await waitUntil(async () => (await listCounters()).length === 0, 'the deletion');
		expect(await countEntries(counter.id)).toBe(0);
		unmount(component);
	});

	it('reports back so the page can navigate away', async () => {
		const ondeleted = vi.fn();
		const component = render(ondeleted);

		click('Delete');
		await waitForText('no entries');
		click('Delete counter');

		await waitUntil(async () => ondeleted.mock.calls.length > 0, 'the callback');
		expect(ondeleted).toHaveBeenCalledOnce();
		unmount(component);
	});

	it('keeps the counter when the confirm is dismissed', async () => {
		const component = render();

		click('Delete');
		await waitForText('no entries');
		click('Cancel');

		expect(visibleText()).not.toContain('Delete counter');
		expect(await listCounters()).toHaveLength(1);
		unmount(component);
	});
});
