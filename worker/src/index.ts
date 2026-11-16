import "dotenv/config";
import { claimJobs, JobBatch, submitWorkerJobs, workJob } from "./jobHandlers.js";

/* ========================================================================= */
//                        functions
/* ========================================================================= */

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ========================================================================= */
//                        main loop
/* ========================================================================= */

const WORKER_REQUEST_INTERVAL_SECS = 5;

async function run() {
	if (!process.env.SERVER_URL || !process.env.API_KEY) throw new Error("Missing worker environment variables");

	console.log("[Worker] Starting...");

	//loop
	while (true) {
		let jobs: JobBatch = [];

		try {
			//if no jobs, wait and try to claim again
			while (jobs.length === 0) {
				await sleep(WORKER_REQUEST_INTERVAL_SECS * 1000);
				jobs = await claimJobs();
			}

			//logging
			console.log(`[Worker] Processing ${jobs.length} jobs:\n\t${jobs.map((job) => job.url).join("\n\t")}`);

			//update concurrently - make sure not to throw inside promise.all - also need to not overwhelm the network when running concurrently
			await Promise.all(jobs.map(workJob));

			//send updated jobs to server and receive next claimed batch
			jobs = await submitWorkerJobs(jobs);
		} catch (e) {
			//log
			console.error("[Worker] Error:", e);

			//dump the jobs - do not want to submit bad info
			jobs = [];
			console.log("[Worker] Cleared jobs. Restarting cycle...");
		}
	}
}

run();
