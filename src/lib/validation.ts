export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };
