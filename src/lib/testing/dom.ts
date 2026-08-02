import { flushSync } from 'svelte';

/**
 * Shared helpers for component tests. Every one of these had been copied into three or
 * more test files; `type` in particular had drifted into four incompatible argument
 * orders, so moving a test between files silently swapped its arguments.
 */

const TIMEOUT_MS = 2000;
const POLL_MS = 5;

/** Poll until `ready`, then flush so assertions see the settled DOM. */
export async function waitUntil(
	ready: () => boolean | Promise<boolean>,
	label: string,
	timeoutMs = TIMEOUT_MS
): Promise<void> {
	const deadline = Date.now() + timeoutMs;
	while (!(await ready())) {
		if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
		await new Promise((resolve) => setTimeout(resolve, POLL_MS));
	}
	flushSync();
}

/** Poll a read until its value satisfies `ready`, then return that value. */
export async function waitFor<T>(
	read: () => T | Promise<T>,
	ready: (value: T) => boolean,
	label: string,
	timeoutMs = TIMEOUT_MS
): Promise<T> {
	const deadline = Date.now() + timeoutMs;
	for (;;) {
		const value = await read();
		if (ready(value)) {
			flushSync();
			return value;
		}
		if (Date.now() > deadline) throw new Error(`timed out waiting for ${label}`);
		await new Promise((resolve) => setTimeout(resolve, POLL_MS));
	}
}

/** Svelte splits interpolated copy across text nodes, so compare on collapsed whitespace. */
export const visibleText = (): string => document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';

export async function waitForText(text: string, timeoutMs = TIMEOUT_MS): Promise<void> {
	await waitUntil(() => visibleText().includes(text), `"${text}"`, timeoutMs);
}

/** Give pending work a turn, for "nothing happened" assertions. */
export async function settle(ms = 50): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
	flushSync();
}

export function button(label: string): HTMLButtonElement {
	const match = [...document.body.querySelectorAll('button')].find(
		(candidate) => candidate.textContent?.trim() === label
	);
	if (!match) throw new Error(`no button labelled "${label}"`);
	return match;
}

export function click(label: string): void {
	button(label).click();
	flushSync();
}

export function field(label: string): HTMLInputElement {
	const input = document.body.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`);
	if (!input) throw new Error(`no input labelled "${label}"`);
	return input;
}

/** Set a bound input the way a user would, so Svelte sees the change. */
export function type(label: string, value: string): void {
	const input = field(label);
	input.value = value;
	input.dispatchEvent(new Event('input', { bubbles: true }));
	flushSync();
}

export function submitForm(): void {
	const form = document.body.querySelector('form');
	if (!form) throw new Error('no form rendered');
	form.dispatchEvent(new Event('submit', { bubbles: true }));
}

export function clearBody(): void {
	document.body.innerHTML = '';
}
