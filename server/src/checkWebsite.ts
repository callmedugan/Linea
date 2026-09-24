import { guardedFetch, GuardedFetchError } from "guarded-fetch";

export type WebsiteStatus = {
	url: string;
	isUp: boolean;
	statusCode: number | null;
	responseTime: number;
};

type CheckResult =
	| {
			success: true;
			data: WebsiteStatus;
	  }
	| {
			success: false;
			error: string;
	  };

const TIMEOUT_MS = 5000;

/**Checks website for given user input. Handles url validation. Returns success with data or error*/
export async function checkWebsite(input: string): Promise<CheckResult> {
	const start = performance.now();

	try {
		//validate URL
		const url = validateUrl(input);

		//fetch using guarded-fetch
		const result = await fetchValidatedUrl(url, start);

		//return
		return { success: true, data: result };
	} catch (e) {
		//fetch or validation failure
		if (e instanceof GuardedFetchError) return { success: false, error: e.code + ": " + e.message };
		if (e instanceof Error) return { success: false, error: e.message };
		return { success: false, error: "Unknown error" };
	}
}

/* ========================================================================= */
//                        internal functions
/* ========================================================================= */

/**
 * Validates url syntax and policy only and returns url obj
 */
function validateUrl(input: string): URL {
	//trim and parse as url
	const url = new URL(input.trim());

	//if not http(s)
	if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid protocol");

	//dont allow creds
	if (url.username || url.password) throw new Error("Credentials not allowed");

	//dont allow any ports besides 80 and 443 for http(s) - use 3001 port for testing
	if (url.port && !["80", "443"].includes(url.port)) throw new Error("Invalid port");

	//url should have a hostname
	if (!url.hostname) throw new Error("Invalid hostname");

	url.hash = "";
	return url;
}

/**
 * make an HTTP request without letting DNS choose a different ip address
 */
async function fetchValidatedUrl(url: URL, start: number): Promise<WebsiteStatus> {
	//this is the actual request using guarded-fetch
	try {
		const response = await guardedFetch(url.toString(), {
			method: "GET",
			followRedirects: false,
			timeoutMs: TIMEOUT_MS,
		});

		//fetch success
		const statusCode = response.status;
		const responseTime = Math.round(performance.now() - start);

		//consume the body before returning
		await response.body?.cancel();

		//return
		return {
			url: url.toString(),
			isUp: response.ok,
			statusCode,
			responseTime,
		};
	} catch (e) {
		//if guarded fetch throws an error, determine if the error is a security issue or an actual downtime error
		if (e instanceof GuardedFetchError) {
			if (["invalid_url", "protocol_not_allowed", "host_not_allowed", "hostname_unsafe", "redirect_to_unsafe_host"].includes(e.code)) {
				throw e;
			}
		}
		//fetch failure - generic error
		return {
			url: url.toString(),
			isUp: false,
			statusCode: null,
			responseTime: Math.round(performance.now() - start),
		};
	}
}
