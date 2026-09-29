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

const WORKER_REQUEST_INTERVAL_SECS = 10;

async function run() {
	if (!process.env.SERVER_URL || !process.env.API_KEY) throw new Error("Missing worker environment variables");

	while (true) {
		console.log("Waiting");
		await sleep(10000);
	}

	//store jobs outside for persistance and claim on awake
	let jobs: JobBatch = await claimJobs();

	//loop
	while (true) {
		//if no jobs, wait and try to claim again
		while (jobs.length === 0) {
			await sleep(WORKER_REQUEST_INTERVAL_SECS * 1000);
			jobs = await claimJobs();
		}

		//logging
		console.log(`[Worker] Processing ${jobs.length} jobs:\n${jobs.map((job) => job.url).join("\n")}`);

		//update concurrently - make sure not to throw inside promise.all - also need to not overwhelm the network when running concurrently
		//stick to 10 or so tops for now
		await Promise.all(jobs.map(workJob));

		//send updated jobs to server and receive next claimed batch
		jobs = await submitWorkerJobs(jobs);
	}
}

run();
