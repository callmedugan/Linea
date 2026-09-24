import type { Request, Response } from "express";
import { checkWebsite } from "../checkWebsite.js";
import z from "zod";
import sendEmail from "../email/email.js";
import { getTokens, hashToken } from "../auth/auth.js";
import { consumeTokenInDb, deleteWebsiteInDb, insertNewSessionInDb, insertNewTokenInDb, insertWebsiteInDb } from "../db/queries.js";

const EMAIL_LINK_EXPIRATION_MINS = 15;

/* ========================================================================= */
//                        websites
/* ========================================================================= */

// export async function getWebsiteStatus(req: Request, res: Response) {
// 	//query params
// 	const url = req.query.url;
// 	if (typeof url !== "string") return res.status(400).json({ error: "URL is required" });

// 	//check site
// 	const result = await checkWebsite(url);

// 	//return 200 or 400 based off success and the data
// 	return res.status(result.success ? 200 : 400).json(result);
// }

export async function addWebsiteAlert(req: Request, res: Response) {
	//check session
	if (req.session === undefined) return res.status(401).json({ error: "Unauthorized" });

	//query params
	const url = req.query.url;
	if (typeof url !== "string") return res.status(400).json({ error: "URL is required" });

	//check user provided site
	const website = await checkWebsite(url);
	if (!website.success) return res.status(400).json({ error: website.error });

	//add to db
	await insertWebsiteInDb(req.session.email, website.data.url);

	//return 200 for success
	return res.status(200).json(website);
}

const websiteIdSchema = z.object({
	id: z.uuid(),
});

/**deletes website alert from db with given id and session email */
export async function deleteWebsiteAlert(req: Request, res: Response) {
	//check session
	if (req.session === undefined) return res.status(401).json({ error: "Unauthorized" });

	//params
	const result = websiteIdSchema.safeParse(req.params);
	if (!result.success) return res.status(400).json({ error: "Invalid website ID" });
	const { id } = result.data;

	//delete from db
	const deleted = await deleteWebsiteInDb(req.session.email, id);
	if (!deleted) return res.status(404).json({ error: "Website not found" });

	//return 200 for success
	return res.sendStatus(204);
}

/* ========================================================================= */
//                        auth
/* ========================================================================= */

const emailSchema = z.object({
	email: z.email().max(254),
});

/**Sends email to user with token to log in. Creates entry in db for the token as well. */
export async function sendLoginEmail(req: Request, res: Response) {
	//try to parse provided email
	const parse = emailSchema.safeParse(req.body);
	if (!parse.success) return res.status(400).json({ error: "Invalid email" });
	const { email } = parse.data;

	//create token and hashed token pair
	const { raw, hash } = getTokens();

	//store hashed
	try {
		await insertNewTokenInDb(email, hash, EMAIL_LINK_EXPIRATION_MINS);
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

const tokenSchema = z.object({
	token: z.string().min(1),
});

/**Checks the token in req body against the db, consumes, and redirects to the user's dashboard*/
export async function verifyLogin(req: Request, res: Response) {
	//get token from body
	const result = tokenSchema.safeParse(req.body);
	if (!result.success) return res.status(400).json({ error: "Invalid token" });
	const { token } = result.data;

	//hash to lookup and lookup token to update if found
	const hashedToken = hashToken(token);
	const consumedToken = await consumeTokenInDb(hashedToken);
	if (!consumedToken) return res.status(400).json({ error: "Invalid token" });

	//create session
	const session = await insertNewSessionInDb(consumedToken.email);
	if (!session) return res.status(500).json({ error: "Failed to create session - try again" });

	//create cookie
	res.cookie("session", session.id, {
		httpOnly: true, //not readable by js
		secure: process.env.NODE_ENV === "production", //only sent over https in prod
		sameSite: "lax",
		maxAge: session.expiresAt.getTime() - Date.now(), //same age as the session
	});

	//redirect to the dashboard
	return res.redirect("/dashboard");
}
