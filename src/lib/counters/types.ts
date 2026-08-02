export interface Counter {
	id: number;
	name: string;
	/** Free-text label shown beside totals: "treats", "cups", "reps". */
	unit?: string;
	/** UTC epoch ms. */
	createdAt: number;
	sortOrder: number;
}

export interface NewCounter {
	name: string;
	unit?: string;
}
