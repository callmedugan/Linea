import { checkWebsite } from "./checkWebsite.js";
import { Job, JobBatch, jobBatchSchema } from "./index.js";

/**fetches a job batch */
export async function getJobs(): Promise<JobBatch> {
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

	if (result.success) {
		job.lastStatus = result.data.statusCode;
		job.responseTimeMs = result.data.responseTime;
	} else {
		job.lastStatus = null;
		job.responseTimeMs = null;
	}
}
