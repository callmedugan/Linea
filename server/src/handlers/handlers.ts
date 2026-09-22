import type { Request, Response } from "express";
import { checkWebsite } from "../checkWebsite.js";
import z from "zod";
import sendEmail from "../email/email.js";
import { getTokens } from "../auth/auth.js";
import { insertNewToken } from "../db/queries.js";

const EMAIL_LINK_EXPIRATION_MINS = 15;

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

/* ========================================================================= */
//                        auth
/* ========================================================================= */

export async function sendLoginEmail(req: Request, res: Response) {
	//try to parse provided email
	const parse = emailSchema.safeParse(req.body);
	if (!parse.success) return res.status(400).json({ error: "Invalid email" });
	const { email } = parse.data;

	//create token and hashed token pair
	const { raw, hash } = getTokens();

	//store hashed
	try {
		await insertNewToken(email, hash, EMAIL_LINK_EXPIRATION_MINS);
	} catch (e) {
		if (e instanceof Error) return res.status(500).json({ error: e.message });
		return res.status(500).json({ error: "Failed to create token." });
	}

	//send email
	try {
		const result = await sendEmail("login", email, raw);
		if (!result) return res.status(500).json({ error: "Failed to send email" });
		//return
		return res.status(200).json({ message: "Email sent" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Failed to send email" });
	}
}

export async function verifyLogin(req: Request, res: Response) {
	// 1. Get token from req.query
	// 2. Validate its format
	// 3. Hash the token
	// 4. Find matching token in database
	// 5. Check expiration and usedAt
	// 6. Atomically mark token as used
	// 7. Find or create user
	// 8. Create session and set cookie
	// 9. Redirect to /dashboard
}
