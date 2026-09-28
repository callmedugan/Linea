import "dotenv/config";
import { z } from "zod";
import { getJobs, workJob } from "./jobHandlers.js";

/* ========================================================================= */
//                        types
/* ========================================================================= */

export const jobSchema = z.object({
	id: z.uuid(),
	url: z.url(),
	email: z.email(),
	//timestamps
	intervalSeconds: z.number().int().positive(),
	nextCheckAt: z.coerce.date(),
	createdAt: z.coerce.date(),
	//worker claims
	claimId: z.uuid(),
	claimedAt: z.coerce.date(),
	//status
	responseTimeMs: z.number().int().nonnegative().nullable(),
	expectedStatus: z.number().int(),
	lastStatus: z.number().int().nullable(),
});

export const jobBatchSchema = z.array(jobSchema);

export type Job = z.infer<typeof jobSchema>;
export type JobBatch = z.infer<typeof jobBatchSchema>;

/* ========================================================================= */
//                        functions
/* ========================================================================= */

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ========================================================================= */
//                        main loop
/* ========================================================================= */

async function run() {
	if (!process.env.SERVER_URL || !process.env.API_KEY) throw new Error("Missing worker environment variables");

	//loop
	while (true) {
		const jobs: JobBatch = await getJobs();

		for (const job of jobs) {
			await workJob(job);
		}

		console.log(jobs);

		await sleep(10000);
	}
}

run();
