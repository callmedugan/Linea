import { and, asc, eq, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "./index.js";
import { sessions, tokens, websites, type Website } from "./schema.js";

/* ========================================================================= */
//                        websites
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
//                        worker
/* ========================================================================= */

/**gets batch of websites for worker to fetch*/
export async function getWebsiteBatchFromDb(size: number = 5, claimTimeoutSeconds: number = 60): Promise<Website[]> {
	//create claim number for the worker - this will be matched up when sending back the results
	//to make sure that the most recent update is used
	const claimId = crypto.randomUUID();

	//get claim cutoff for when a site should be retried
	const claimCutoff = new Date(Date.now() - claimTimeoutSeconds * 1000);
	const now = new Date();

	//create a cte that gets matching jobs, limiting by the size and eligible for claiming
	const batch = db.$with("batch").as(
		db
			.select({ id: websites.id })
			.from(websites)
			.where(and(lte(websites.nextCheckAt, now), or(isNull(websites.claimedAt), lte(websites.claimedAt, claimCutoff))))
			.orderBy(asc(websites.nextCheckAt))
			.limit(size)
			.for("update", { skipLocked: true }), //lock the records to prevent double claiming
	);

	//using the cte, update the records that were selected all in one db call and return
	return db
		.with(batch)
		.update(websites)
		.set({ claimedAt: now, claimId }) //set claimedAt and claimId to generated id to match up later
		.where(inArray(websites.id, db.select({ id: batch.id }).from(batch)))
		.returning();
}

/**gets batch of websites for worker to fetch*/
export async function submitWebsiteBatchToDb(websites: Website[]): Promise<void> {
	if (websites.length === 0) return;

	//create virtual table using sql builder which parameterizes the data - not passed as string literals
	const values = sql.join(
		websites.map(
			(website) => sql`(
				${website.id}::uuid,
				${website.claimId}::uuid,
				${website.lastStatus}::integer,
				${website.responseTimeMs}::integer
			)`,
		),
		sql`, `,
	);

	//this insane query updates all rows for the submitted sites only if the claim id matches
	await db.execute(sql`
		UPDATE websites AS w
		SET
			last_status = v.last_status,
			response_time_ms = v.response_time_ms,
			next_check_at = NOW() + (w.interval_seconds * INTERVAL '1 second'),
			claimed_at = NULL,
			claim_id = NULL
		FROM (
			VALUES ${values}
		) AS v(id, claim_id, last_status, response_time_ms)
		WHERE
			w.id = v.id
			AND w.claim_id = v.claim_id
	`);
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
