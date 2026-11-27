export type CheckError = "timeout" | "dns" | "connection" | "tls" | "blocked" | "network" | "unknown";

export type Website = {
	id: string;
	url: string;
	expectedStatus: number;
	statusCode: number | null;
	errorType: CheckError | null;
	responseTimeMs: number | null;
	intervalSeconds: number;
	nextCheckAt: string;
	checkedAt: string;
	createdAt: string;
};

// type Website = {
//  id: string;
//  url: string;
//  email: string;
//  intervalSeconds: number;
//  nextCheckAt: Date;
//  createdAt: Date;
//  claimId: string | null;
//  claimedAt: Date | null;
//  expectedStatus: number;
// }
