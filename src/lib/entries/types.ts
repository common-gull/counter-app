export interface Entry {
	id: number;
	counterId: number;
	amount: number;
	/** UTC epoch ms. Bucketed into local days by `$lib/time`. */
	timestamp: number;
}

export interface EntryPatch {
	amount?: number;
	timestamp?: number;
}
