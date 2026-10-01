import type { Request, Response } from "express";
import { validateUrl } from "../validateURL.js";
import z from "zod";
import { getTokens, hashToken } from "../auth/auth.js";
import {
	consumeTokenInDb,
	deleteSessionInDb,
	deleteWebsiteInDb,
	getWebsiteBatchFromDb,
	getWebsitesFromDb,
	insertNewSessionInDb,
	insertNewTokenInDb,
	insertWebsiteInDb,
	submitWebsiteBatchToDb,
	type SubmitResult,
} from "../db/queries.js";
import { websiteBatchSchema } from "../db/schema.js";
import { sendLoginEmail, sendStatusAlertEmail } from "../email/email.js";
import { EMAIL_LINK_EXPIRATION_MINS } from "../constants.js";

/* ========================================================================= */
//                        websites
/* ========================================================================= */
const addWebsiteSchema = z.object({
	url: z.url(),
	expectedStatus: z.int().min(100).max(599),
});

/**takes user input, validates format, and stores in db - no fetch requests are made to url */
export async function addWebsiteAlertHandler(req: Request, res: Response) {
	//check session
	if (req.session === undefined) return res.status(401).json({ error: "Unauthorized" });

	//body
	const parsed = addWebsiteSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: "Invalid website alert" });
	const { url, expectedStatus } = parsed.data;

	//check user provided site syntax and protocol/port
	const validURL = validateUrl(url).toString();
	if (!validURL) return res.status(400).json({ error: "Invalid URL" });

	//add to db
	await insertWebsiteInDb(req.session.email, validURL, expectedStatus);

	//return 200 for success
	return res.status(200).json(validURL);
}

const websiteIdSchema = z.object({
	id: z.uuid(),
});

/**deletes website alert from db with given id and session email */
export async function deleteWebsiteAlertHandler(req: Request, res: Response) {
	//check session
	if (req.session === undefined) return res.status(401).json({ error: "Unauthorized" });

	//params
	const result = websiteIdSchema.safeParse(req.params);
	if (!result.success) return res.status(400).json({ error: "Invalid website ID" });
	const { id } = result.data;

	//delete from db
	await deleteWebsiteInDb(req.session.email, id);

	//return 204 for success
	return res.sendStatus(204);
}

/**retrives all website alerts for given session email */
export async function getWebsiteAlertsHandler(req: Request, res: Response) {
	//check session
	if (req.session === undefined) return res.status(401).json({ error: "Unauthorized" });

	//get websites from db
	const result = await getWebsitesFromDb(req.session.email);

	//return 200 for success
	return res.status(200).json(result);
}

/* ========================================================================= */
//                        auth
/* ========================================================================= */

const emailSchema = z.object({
	email: z.email().max(254),
});

/**Sends email to user with token to log in. Creates entry in db for the token as well. */
export async function sendLoginEmailHandler(req: Request, res: Response) {
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
		const result = await sendLoginEmail(email, raw);
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
export async function verifyLoginHandler(req: Request, res: Response) {
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
		secure: process.env.NODE_ENV !== "dev" && process.env.NODE_ENV !== "development", //only sent over https in prod
		sameSite: "lax",
		maxAge: session.expiresAt.getTime() - Date.now(), //same age as the session
	});

	//redirect to the dashboard
	return res.redirect("/dashboard");
}

/**Logs auth user out. */
export async function logoutUserHandler(req: Request, res: Response) {
	//check session
	if (req.session === undefined) return res.status(401).json({ error: "Unauthorized" });

	//delete
	await deleteSessionInDb(req.session.email);

	// remove session cookie from browser
	res.clearCookie("session", {
		httpOnly: true,
		secure: process.env.NODE_ENV !== "dev" && process.env.NODE_ENV !== "development", //only sent over https in prod
		sameSite: "lax",
	});

	//return 204 for success
	return res.sendStatus(204);
}

/* ========================================================================= */
//                        worker
/* ========================================================================= */

/**retrives jobs for worker*/
export async function getWorkerJobsHandler(req: Request, res: Response) {
	//get websites from db
	const result = await getWebsiteBatchFromDb();

	//return 200 for success
	return res.status(200).json(result);
}

/**submit jobs from worker*/
export async function submitWorkerJobsHandler(req: Request, res: Response) {
	//read body
	const submittedJobs = websiteBatchSchema.safeParse(req.body);
	if (!submittedJobs.success) return res.status(400).json({ error: submittedJobs.error.issues });

	//submit websites to db and get back the results
	const websites = submittedJobs.data;
	const results = await submitWebsiteBatchToDb(websites);

	//check results to determine if alerts need to be sent
	await checkSubmitResultsHandler(results);

	//claim more jobs for the worker if they exist
	const moreJobs = await getWebsiteBatchFromDb();

	//return 200 for success
	return res.status(200).json(moreJobs);
}

/**check results to determine if alerts need to be sent*/
async function checkSubmitResultsHandler(results: SubmitResult[]) {
	for (const result of results) {
		//skip new checks
		if (result.oldStatus === 0) continue;

		//compare wasUp and isUp
		const wasUp = result.oldStatus === result.expectedStatus;
		const isUp = result.newStatus === result.expectedStatus;

		//repeating code, idc
		if (wasUp && !isUp) {
			try {
				//send email and log errors, do not throw/catch
				const sent = await sendStatusAlertEmail(result.email, result.url, "down", result.newStatus ?? undefined);
				if (!sent) console.error(`Failed to send alert for ${result.url}`);
			} catch (error) {
				console.error(`Error sending alert for ${result.url}:`, error);
			}
		}

		if (!wasUp && isUp) {
			try {
				//send email and log errors, do not throw/catch
				const sent = await sendStatusAlertEmail(result.email, result.url, "up", result.newStatus ?? undefined);
				if (!sent) console.error(`Failed to send alert for ${result.url}`);
			} catch (error) {
				console.error(`Error sending alert for ${result.url}:`, error);
			}
		}
	}
}
