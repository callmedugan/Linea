import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "./index.js";
import { sessions, tokens, websites } from "./schema.js";

/* ========================================================================= */
//
/* ========================================================================= */

const MAX_ALERTS = 8;

/**inserts new website record and throws if insert fails or email has too many alerts */
export async function insertWebsiteInDb(email: string, url: string) {
	//count entries
	const websiteCount = await db.$count(websites, eq(websites.email, email));
	if (websiteCount >= MAX_ALERTS) throw new Error(`Max number of alerts per account is: ${MAX_ALERTS}`);
	//insert
	await db.insert(websites).values({
		email,
		url,
	});
}

/**deletes website record for email and id*/
export async function deleteWebsiteInDb(email: string, id: string) {
	const [result] = await db
		.delete(websites)
		.where(and(eq(websites.id, id), eq(websites.email, email)))
		.returning();
	return result;
}

/**gets all website alerts for given email*/
export async function getWebsitesFromDb(email: string) {
	const result = db.select().from(websites).where(eq(websites.email, email));
	return result;
}

/* ========================================================================= */
//                        tokens
/* ========================================================================= */

/**inserts new token record and throws if insert fails */
export async function insertNewTokenInDb(email: string, tokenHash: string, expiresInMinutes: number = 15) {
	await db.insert(tokens).values({
		email,
		tokenHash,
		expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
	});
}

/** Finds and sets token as used in DB */
export async function consumeTokenInDb(tokenHash: string) {
	const [token] = await db
		.update(tokens)
		.set({ usedAt: new Date() })
		.where(and(eq(tokens.tokenHash, tokenHash), isNull(tokens.usedAt), gt(tokens.expiresAt, new Date())))
		.returning();

	return token;
}

/* ========================================================================= */
//                        sessions
/* ========================================================================= */

/**inserts new token record and throws if insert fails */
export async function insertNewSessionInDb(email: string, expiresInHours: number = 8) {
	const [result] = await db
		.insert(sessions)
		.values({
			email,
			expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
		})
		.returning();
	return result;
}

/**looks up session from db */
export async function getSessionFromDb(id: string) {
	const [result] = await db.select().from(sessions).where(eq(sessions.id, id));
	return result;
}
