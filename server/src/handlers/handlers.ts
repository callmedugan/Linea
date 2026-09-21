import type { Request, Response } from "express";
import { checkWebsite } from "../checkWebsite.js";

export async function getWebsiteStatus(req: Request, res: Response) {
	//query params
	const url = req.query.url;
	if (typeof url !== "string") return res.status(400).json({ error: "URL is required" });

	//check site
	const result = await checkWebsite(url);

	//return 200 or 400 based off success and the data
	return res.status(result.success ? 200 : 400).json(result);
}

export async function addWebsiteAlert(req: Request, res: Response) {
	//query params
	const url = req.query.url;
	if (typeof url !== "string") return res.status(400).json({ error: "URL is required" });

	//check site
	const result = await checkWebsite(url);

	//validate that request came from email

	//add to db

	//return 200 or 400 based off success and the data
	return res.status(result.success ? 200 : 400).json(result);
}
