export type WebsiteStatus = {
	url: string;
	isUp: boolean;
	statusCode: number | null;
	responseTime: number;
};

const TIMEOUT_MS = 5000;

export async function checkWebsite(url: string, allowRedirects = true): Promise<WebsiteStatus> {
	const start = performance.now();

	try {
		//fetch given url
		const response = await fetch(url, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
			redirect: allowRedirects ? "follow" : "manual",
		});

		//success
		return {
			url,
			isUp: response.ok,
			statusCode: response.status,
			responseTime: Math.round(performance.now() - start),
		};
	} catch {
		//failure
		return {
			url,
			isUp: false,
			statusCode: null,
			responseTime: Math.round(performance.now() - start),
		};
	}
}
