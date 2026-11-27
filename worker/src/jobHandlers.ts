import { checkWebsite } from "./checkWebsite.js";
import { z } from "zod";

/* ========================================================================= */
//                        types
/* ========================================================================= */

// job request - internal only
export type JobRequest = z.infer<typeof jobRequestSchema>;
export const jobRequestSchema = z.object({
	id: z.uuid(),
	url: z.url(),
	claimId: z.uuid(),
	expectedStatus: z.number().int(),
});
export const jobRequestBatchSchema = z.array(jobRequestSchema);
export type JobRequestBatch = z.infer<typeof jobRequestBatchSchema>;

// job submit
export type JobSubmit = z.infer<typeof jobSubmitSchema>;
export const jobSubmitSchema = jobRequestSchema.extend({
	checkedAt: z.coerce.date(),
	responseTimeMs: z.number().int().nonnegative().nullable(),
	statusCode: z.number().int().nullable(),
	errorType: z.enum(["timeout", "dns", "connection", "tls", "blocked", "network", "unknown"]).nullable(),
});
export const jobSubmitBatchSchema = z.array(jobSubmitSchema);
export type JobSubmitBatch = z.infer<typeof jobSubmitBatchSchema>;

//job claim results
export const jobResultSchema = z.object({
	jobsAvailable: z.boolean(),
});
export type JobResult = z.infer<typeof jobResultSchema>;

/* ========================================================================= */
//                        functions
/* ========================================================================= */

/**fetches a job batch */
export async function claimJobs(): Promise<JobRequestBatch> {
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
	const jobs = jobRequestBatchSchema.parse(data);

	return jobs;
}

/**fetches the job url and updates the status */
export async function workJob(job: JobRequest): Promise<JobSubmit> {
	//fetch
	const check = await checkWebsite(job.url);

	//just update each job with the status and res time with the result, server will handle the rest
	const result: JobSubmit = {
		...job,
		checkedAt: new Date(),
		statusCode: check.statusCode,
		errorType: check.error,
		responseTimeMs: check.responseTime,
	};

	return result;
}

/**submits worker jobs and returns if more jobs are available immediately for the worker */
export async function submitWorkerJobs(jobs: JobSubmitBatch): Promise<JobRequestBatch> {
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
	const moreJobs = jobRequestBatchSchema.parse(data);

	return moreJobs;
}
