export type CheckError = "timeout" | "dns" | "connection" | "tls" | "blocked" | "network" | "unknown";

export type Website = {
	id: string;
	url: string;
	expectedStatus: number;
	lastStatus: number | null;
	lastError: CheckError | null;
	responseTimeMs: number | null;
	intervalSeconds: number;
	nextCheckAt: string;
	createdAt: string;
};
