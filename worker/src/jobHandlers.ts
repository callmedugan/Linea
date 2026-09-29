import { checkWebsite } from "./checkWebsite.js";
import { z } from "zod";

/* ========================================================================= */
//                        types
/* ========================================================================= */

//job claims
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
	lastError: z.enum(["timeout", "dns", "connection", "tls", "blocked", "network", "unknown"]).nullable(),
});

export const jobBatchSchema = z.array(jobSchema);

export type Job = z.infer<typeof jobSchema>;
export type JobBatch = z.infer<typeof jobBatchSchema>;

//job claim results
export const jobResultSchema = z.object({
	jobsAvailable: z.boolean(),
});
export type JobResult = z.infer<typeof jobResultSchema>;

/* ========================================================================= */
//                        functions
/* ========================================================================= */

/**fetches a job batch */
export async function claimJobs(): Promise<JobBatch> {
	//fetch
	const response = await fetch(`${process.env.SERVER_URL}/api/worker/jobs/claim`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${process.env.API_KEY}`,
		},
	});
	if (!response.ok) throw new Error(`Failed to get batch: ${response.status}`);

	//batch
	const data = await response.json();
	const jobs = jobBatchSchema.parse(data);

	return jobs;
}

/**fetches the job url and updates the status */
export async function workJob(job: Job) {
	//fetch
	const result = await checkWebsite(job.url);

	//just update each job with the status and res time with the result, server will handle the rest
	if (result.success) {
		job.lastStatus = result.data.statusCode;
		job.responseTimeMs = result.data.responseTime;
		job.lastError = null;
	} else {
		job.lastStatus = null;
		job.responseTimeMs = null;
		job.lastError = result.error;
	}
}

/**submits worker jobs and returns if more jobs are available immediately for the worker */
export async function submitWorkerJobs(jobs: JobBatch): Promise<JobBatch> {
	const response = await fetch(`${process.env.SERVER_URL}/api/worker/jobs/submit`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${process.env.API_KEY}`,
		},
		body: JSON.stringify(jobs),
	});
	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to submit batch: ${response.status} - ${error}`);
	}

	//if more jobs are available
	const data = await response.json();
	const moreJobs = jobBatchSchema.parse(data);

	return moreJobs;
}
