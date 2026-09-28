/**
 * Validates url syntax and policy only and returns url obj
 */
export function validateUrl(input: string): URL {
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
