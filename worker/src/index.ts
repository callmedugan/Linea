import "dotenv/config";

async function run() {
	if (!process.env.SERVER_URL || !process.env.API_KEY) throw new Error("Missing worker environment variables");

	//loop
	while (true) {
		//fetch
		const response = await fetch(`${process.env.SERVER_URL}/api/worker/jobs/claim`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.API_KEY}`,
			},
		});
		if (!response.ok) throw new Error(`Failed to get batch: ${response.status}`);

		//batch
		const batch = await response.json();

		console.log(batch);

		await sleep(5000);
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

run();
