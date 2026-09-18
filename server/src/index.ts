import express from "express";
import { checkWebsite } from "./checkWebsite.js";

const app = express();
const PORT = 3000;

/* ========================================================================= */
//                        handlers
/* ========================================================================= */

app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

app.get("/api/status", async (req, res) => {
	//query params
	const url = req.query.url;
	if (typeof url !== "string") return res.status(400).json({ error: "URL is required" });

	//try parse
	let parsedUrl: URL;
	try {
		parsedUrl = new URL(url);
	} catch {
		return res.status(400).json({ error: "Invalid URL" });
	}

	//TODO check for ssrf
	//check input
	if (parsedUrl.protocol !== "https:" || parsedUrl.username || parsedUrl.password || parsedUrl.port)
		return res.status(400).json({ error: "Website not allowed" });

	//check site
	const result = await checkWebsite(parsedUrl.href);
	res.json(result);
});

/* ========================================================================= */
//                        listen
/* ========================================================================= */

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
