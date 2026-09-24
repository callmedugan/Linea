import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "./index.js";
import { sessions, tokens } from "./schema.js";

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
