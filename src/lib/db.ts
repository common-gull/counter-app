import { Dexie, type EntityTable } from 'dexie';
import type { Counter } from './counters/types';
import type { Entry } from './entries/types';

// Shared infrastructure, not a domain: the schema spans every table, so it lives in
// one place. Domain code imports `db`; nothing imports Dexie directly.

export const DATABASE_NAME = 'counter-app';

export const db = new Dexie(DATABASE_NAME) as Dexie & {
	counters: EntityTable<Counter, 'id'>;
	entries: EntityTable<Entry, 'id'>;
};

// [counterId+timestamp] is what makes every total a single indexed range scan.
db.version(1).stores({
	counters: '++id, sortOrder',
	entries: '++id, counterId, timestamp, [counterId+timestamp]'
});
