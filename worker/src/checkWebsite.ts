import { guardedFetch, GuardedFetchError } from "guarded-fetch";

export type CheckError = "timeout" | "dns" | "connection" | "tls" | "blocked" | "network" | "unknown";

export type WebsiteStatus = {
	url: string;
	statusCode: number | null;
	responseTime: number;
	error: CheckError | null;
};

type CheckResult =
	| {
			success: true;
			data: WebsiteStatus;
	  }
	| {
			success: false;
			error: CheckError;
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
		return { success: false, error: getCheckError(e) };
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
			statusCode,
			responseTime,
			error: null,
		};
	} catch (e) {
		//fetch failure
		return {
			url: url.toString(),
			statusCode: null,
			responseTime: Math.round(performance.now() - start),
			error: getCheckError(e),
		};
	}
}

/* ========================================================================= */
//                        errors
/* ========================================================================= */

/**
 * converts guarded fetch errors to user safe errors
 */
function getCheckError(e: unknown): CheckError {
	if (!(e instanceof GuardedFetchError)) return "unknown";

	switch (e.code) {
		case "timeout":
			return "timeout";

		case "invalid_url":
		case "protocol_not_allowed":
		case "host_not_allowed":
		case "hostname_unsafe":
		case "redirect_to_unsafe_host":
			return "blocked";

		case "network_error":
			return getNetworkError(e);

		default:
			return "unknown";
	}
}

/**
 * converts network errors to user safe errors
 */
function getNetworkError(e: GuardedFetchError): CheckError {
	const cause = e.cause;

	if (!(cause instanceof Error)) return "network";

	const code = "code" in cause ? cause.code : undefined;

	switch (code) {
		case "ENOTFOUND":
		case "EAI_AGAIN":
			return "dns";

		case "ECONNREFUSED":
		case "ECONNRESET":
		case "EHOSTUNREACH":
		case "ENETUNREACH":
			return "connection";

		case "CERT_HAS_EXPIRED":
		case "DEPTH_ZERO_SELF_SIGNED_CERT":
		case "SELF_SIGNED_CERT_IN_CHAIN":
		case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
		case "ERR_TLS_CERT_ALTNAME_INVALID":
			return "tls";

		default:
			return "network";
	}
}
