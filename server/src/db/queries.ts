import { db } from "./index.js";
import { tokens } from "./schema.js";

/**inserts new token record and throws if insert fails */
export async function insertNewToken(email: string, tokenHash: string, expiresInMinutes: number = 15) {
	await db.insert(tokens).values({
		email,
		tokenHash,
		expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
	});
}
