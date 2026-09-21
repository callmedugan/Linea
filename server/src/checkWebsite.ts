import { lookup } from "dns/promises";
import ipaddr from "ipaddr.js";
import { Agent, fetch } from "undici";

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

/**Checks website for given user input. Handles url validation.*/
export async function checkWebsite(input: string): Promise<CheckResult> {
	const start = performance.now();

	try {
		// 1. Validate URL
		const url = validateUrl(input);

		// 2. Resolve hostname
		const addresses = await resolveHostname(url.hostname);

		// 3. Validate every resolved IP
		const firstAddress = addresses[0];

		if (!firstAddress) throw new Error("No IP addresses found");

		if (addresses.some((address) => !isPublicIp(address.address))) throw new Error("Unsafe IP address");

		// 4. Fetch using a validated IP
		const result = await fetchValidatedUrl(url, firstAddress.address, start);

		//return
		return { success: true, data: result };
	} catch (e) {
		//fetch or validation failure
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

	//dont allow any ports besides 80 and 443 for http(s)
	if (url.port && !["80", "443"].includes(url.port)) throw new Error("Invalid port");

	//url should have a hostname
	if (!url.hostname) throw new Error("Invalid hostname");

	url.hash = "";
	return url;
}

/**
 * Returns the resolved ipv4/6 address
 */
async function resolveHostname(hostname: string) {
	return lookup(hostname, { all: true });
}

/**
 * Checks whether an ip address is publicly routable
 */
export function isPublicIp(ip: string): boolean {
	try {
		const address = ipaddr.process(ip);
		return address.range() === "unicast";
	} catch {
		return false;
	}
}

/**
 * make an HTTP request without letting DNS choose a different ip address from the one we already validated
 */
async function fetchValidatedUrl(url: URL, ip: string, start: number): Promise<WebsiteStatus> {
	const agent = new Agent({
		connect: {
			lookup: (_hostname, _options, callback) => {
				//on success
				callback(null, [
					{
						//use our validated ip
						address: ip,
						//ipv4 or 6
						family: ip.includes(":") ? 6 : 4,
					},
				]);
			},
		},
	});

	//this is the actual request using  our agent
	try {
		const response = await fetch(url, {
			dispatcher: agent,
			redirect: "manual",
			signal: AbortSignal.timeout(TIMEOUT_MS),
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
	} catch {
		//fetch failure
		return {
			url: url.toString(),
			isUp: false,
			statusCode: null,
			responseTime: Math.round(performance.now() - start),
		};
	} finally {
		//destroy to prevent agent from hanging while trying to close normally
		await agent.destroy();
	}
}
