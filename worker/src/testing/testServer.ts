import { createServer } from "node:http";

let requests = 0;

//create a local server to test SSRF protection
const server = createServer((req, res) => {
	requests++;

	console.log(`Request received: ${req.method} ${req.url}`);
	console.log(`Total requests: ${requests}`);

	res.writeHead(200, { "Content-Type": "text/plain" });
	res.end("OK");
});

//start server on localhost - must modify checkWebsite to not block 3001 when testing
server.listen(3001, "127.0.0.1", () => {
	console.log("Test server running on port 3001");
	console.log("Waiting for requests...");
});

//handle server errors
server.on("error", (error) => {
	console.error("Test server error:", error);
});
