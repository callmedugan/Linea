import express from "express";
import { checkWebsite } from "./checkWebsite.js";
import path from "path";
import { middlewareApiLimiter, noSniffHeader } from "./middleware.js";
import { handlerError } from "./handlers/error.js";
import "dotenv/config";

const app = express();

//used to serve static files - process.cwd will be set in the start script
const clientPath = path.resolve(process.cwd(), "../client/dist");

// allow json and limit to 100kb of data
app.use(express.json({ limit: "100kb" }));

// nosniff header
app.use(noSniffHeader);

// limit overall traffic
app.use(middlewareApiLimiter);

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
//                   Error Handling Middleware - must go last
/* ========================================================================= */

// Static frontend files
app.use(express.static(clientPath));

// React Router fallback
app.get("/{*splat}", (_req, res) => {
	res.sendFile(path.join(clientPath, "index.html"));
});

//used for any unknown routes
app.use("/api", (req, res) => {
	res.status(404).json({ error: "API route not found" });
});

app.use(handlerError);

app.listen(process.env.PORT, () => {
	console.log(`Server running at http://localhost:${process.env.PORT}`);
});
