export type Website = {
	id: string;
	url: string;
	expectedStatus: number;
	lastStatus: number | null;
	responseTimeMs: number | null;
	intervalSeconds: number;
	nextCheckAt: string;
	createdAt: string;
};
