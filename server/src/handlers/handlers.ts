import type { Request, Response } from "express";
import { checkWebsite } from "../checkWebsite.js";
import z from "zod";
import sendEmail from "../email/email.js";

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

const emailSchema = z.object({
	email: z.email().max(254),
});

export async function sendLoginEmail(req: Request, res: Response) {
	//try to parse provided email
	const parse = emailSchema.safeParse(req.body);
	if (!parse.success) return res.status(400).json({ error: "Invalid email" });
	const { email } = parse.data;

	//send email
	try {
		const result = await sendEmail("login", email);
		if (!result) return res.status(500).json({ error: "Failed to send email" });
		//return
		return res.status(200).json({ message: "Email sent" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Failed to send email" });
	}
}
