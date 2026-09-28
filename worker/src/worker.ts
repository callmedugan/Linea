async function run() {
	while (true) {
		//const websites = await getWebsitesDueForCheck();

		// for (const website of websites) {
		// 	await checkWebsiteAndUpdateStatus(website);
		// }

		await sleep(5000);
	}
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

run();
