import type { Request, Response } from "express";
import { checkWebsite } from "../checkWebsite.js";

export async function getWebsiteStatus(req: Request, res: Response) {
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
}
