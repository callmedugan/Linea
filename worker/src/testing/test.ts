import { checkWebsite } from "../checkWebsite.js";

type TestCase = {
	name: string;
	url: string;
	expectedSuccess: boolean;
	expectedIsUp?: boolean;
	expectedStatus?: number;
};

const tests: TestCase[] = [
	//valid websites
	{ name: "Valid HTTPS", url: "https://example.com", expectedSuccess: true, expectedIsUp: true, expectedStatus: 200 },
	{ name: "HTTP 404", url: "https://httpbin.org/status/404", expectedSuccess: true, expectedIsUp: false, expectedStatus: 404 },
	{ name: "HTTP 500", url: "https://httpbin.org/status/500", expectedSuccess: true, expectedIsUp: false, expectedStatus: 500 },

	//url validation
	{ name: "Invalid URL", url: "not-a-url", expectedSuccess: false },
	{ name: "Invalid protocol", url: "ftp://example.com", expectedSuccess: false },
	{ name: "Credentials", url: "https://user:pass@example.com", expectedSuccess: false },
	{ name: "Invalid port", url: "https://example.com:8080", expectedSuccess: false },

	//ssrf protection
	{ name: "Localhost", url: "http://localhost", expectedSuccess: false },
	{ name: "Loopback IPv4", url: "http://127.0.0.1", expectedSuccess: false },
	{ name: "Private IPv4", url: "http://192.168.1.1", expectedSuccess: false },
	{ name: "AWS metadata", url: "http://169.254.169.254", expectedSuccess: false },
	{ name: "Loopback IPv6", url: "http://[::1]", expectedSuccess: false },
	{ name: "Private IPv6", url: "http://[fc00::1]", expectedSuccess: false },

	//malformed URLs
	{ name: "Empty URL", url: "", expectedSuccess: false },
	{ name: "Missing protocol", url: "example.com", expectedSuccess: false },
	{ name: "Missing hostname", url: "http://", expectedSuccess: false },
	{ name: "File protocol", url: "file:///etc/passwd", expectedSuccess: false },
	{ name: "Gopher protocol", url: "gopher://example.com", expectedSuccess: false },
	{ name: "JavaScript protocol", url: "javascript:alert(1)", expectedSuccess: false },

	//credential and port bypasses
	{ name: "Username only", url: "https://admin@example.com", expectedSuccess: false },
	{ name: "Encoded credentials", url: "https://admin%3Apassword@example.com", expectedSuccess: false },
	{ name: "SSH port", url: "http://example.com:22", expectedSuccess: false },
	{ name: "Database port", url: "http://example.com:5432", expectedSuccess: false },

	//localhost variants
	{ name: "Localhost subdomain", url: "http://test.localhost", expectedSuccess: false },
	{ name: "Local domain", url: "http://server.local", expectedSuccess: false },
	{ name: "IPv4 loopback alternative", url: "http://127.1", expectedSuccess: false },
	{ name: "IPv4 decimal", url: "http://2130706433", expectedSuccess: false },
	{ name: "IPv4 hexadecimal", url: "http://0x7f000001", expectedSuccess: false },
	{ name: "IPv4 octal", url: "http://0177.0.0.1", expectedSuccess: false },

	//private and reserved IPv4
	{ name: "Private 10.x", url: "http://10.0.0.1", expectedSuccess: false },
	{ name: "Private 172.x", url: "http://172.16.0.1", expectedSuccess: false },
	{ name: "CGNAT", url: "http://100.64.0.1", expectedSuccess: false },
	{ name: "Unspecified IPv4", url: "http://0.0.0.0", expectedSuccess: false },
	{ name: "Multicast IPv4", url: "http://224.0.0.1", expectedSuccess: false },

	//cloud metadata
	{ name: "AWS metadata path", url: "http://169.254.169.254/latest/meta-data/", expectedSuccess: false },
	{ name: "GCP metadata", url: "http://metadata.google.internal", expectedSuccess: false },

	//IPv6
	{ name: "Unspecified IPv6", url: "http://[::]", expectedSuccess: false },
	{ name: "Link-local IPv6", url: "http://[fe80::1]", expectedSuccess: false },
	{ name: "Multicast IPv6", url: "http://[ff02::1]", expectedSuccess: false },
	{ name: "IPv4-mapped IPv6", url: "http://[::ffff:127.0.0.1]", expectedSuccess: false },
	{ name: "IPv4-mapped private", url: "http://[::ffff:192.168.1.1]", expectedSuccess: false },
	{ name: "6to4 private IPv4", url: "http://[2002:c0a8:101::1]", expectedSuccess: false },
	{ name: "NAT64 private IPv4", url: "http://[64:ff9b::c0a8:101]", expectedSuccess: false },
	{ name: "NAT64 local-use", url: "http://[64:ff9b:1::1]", expectedSuccess: false },

	//DNS failures
	{ name: "Nonexistent domain", url: "http://nonexistent.invalid", expectedSuccess: false },

	//redirects
	{
		name: "HTTP redirect",
		url: "https://httpbin.org/redirect/1",
		expectedSuccess: true,
		expectedIsUp: false,
		expectedStatus: 302,
	},

	//server
	{
		name: "Local server SSRF",
		url: "http://127.0.0.1:3001",
		expectedSuccess: false,
	},
];

let passed = 0;

for (const test of tests) {
	const result = await checkWebsite(test.url);

	let success = result.success === test.expectedSuccess;

	if (result.success && test.expectedIsUp !== undefined) {
		success = success && result.data.isUp === test.expectedIsUp;
	}

	if (result.success && test.expectedStatus !== undefined) {
		success = success && result.data.statusCode === test.expectedStatus;
	}

	if (success) passed++;

	console.log(`${success ? "PASS" : "FAIL"} | ${test.name}`);

	if (!success) {
		console.log("  Expected:", test);
		console.log("  Received:", result);
	}
}

console.log(`\nResults: ${passed}/${tests.length} passed`);
