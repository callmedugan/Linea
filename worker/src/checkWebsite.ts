import { guardedFetch, GuardedFetchError } from "guarded-fetch";

export type CheckError = "timeout" | "dns" | "connection" | "tls" | "blocked" | "network" | "unknown";

export type WebsiteStatus = {
	url: string;
	statusCode: number | null;
	responseTime: number;
	error: CheckError | null;
};

const TIMEOUT_MS = 5000;

/* ========================================================================= */
//                        fetch
/* ========================================================================= */

/**Checks a stored website URL and returns its status*/
export async function checkWebsite(urlString: string): Promise<WebsiteStatus> {
	//start timer
	const start = performance.now();

	//this is the actual request using guarded-fetch
	try {
		const response = await guardedFetch(urlString, {
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
			url: urlString,
			statusCode,
			responseTime,
			error: null,
		};
	} catch (e) {
		//fetch failure
		return {
			url: urlString,
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
