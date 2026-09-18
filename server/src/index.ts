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
	const result = await checkWebsite("https://example.com");
	res.json(result);
});

/* ========================================================================= */
//                        listen
/* ========================================================================= */

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
