import { and, asc, desc, eq, getTableColumns, gt, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "./index.js";
import { checkRequestBatchSchema, checks, sessions, tokens, websites, type CheckRequest, type CheckSubmit, type Website } from "./schema.js";
import { DEFAULT_BATCH_SIZE, DEFAULT_CLAIM_TIMEOUT_SECS, MAX_ALERTS_PER_EMAIL } from "../constants.js";
import { BadRequestError, ConflictError, NotFoundError } from "../handlers/error.js";

/* ========================================================================= */
//                        websites
/* ========================================================================= */

/**inserts new website record and throws if insert fails or email has too many alerts */
export async function insertWebsiteInDb(email: string, url: string, expectedStatus: number) {
	//count entries
	const websiteCount = await db.$count(websites, eq(websites.email, email));
	if (websiteCount >= MAX_ALERTS_PER_EMAIL) throw new BadRequestError(`Max number of alerts per account is ${MAX_ALERTS_PER_EMAIL}`);

	//insert
	const [result] = await db
		.insert(websites)
		.values({
			email,
			url,
			expectedStatus,
		})
		.onConflictDoNothing({
			target: [websites.url, websites.email],
		})
		.returning();

	//duplicate url for the same email
	if (!result) throw new ConflictError("You are already monitoring this website");

	return result;
}

/**deletes website record for email and id*/
export async function deleteWebsiteInDb(email: string, id: string) {
	const [result] = await db
		.delete(websites)
		.where(and(eq(websites.id, id), eq(websites.email, email)))
		.returning();

	//nothing matched the given email and id
	if (!result) throw new NotFoundError("Website alert not found");

	return result;
}

/** gets all website alerts for given email */
export async function getWebsitesFromDb(email: string) {
	const latestChecks = db
		.selectDistinctOn([checks.websiteId], {
			websiteId: checks.websiteId,
			statusCode: checks.statusCode,
			responseTimeMs: checks.responseTimeMs,
			errorType: checks.errorType,
			checkedAt: checks.checkedAt,
		})
		.from(checks)
		.orderBy(checks.websiteId, desc(checks.checkedAt))
		.as("latest_checks");

	return db
		.select({
			...getTableColumns(websites),
			statusCode: latestChecks.statusCode,
			responseTimeMs: latestChecks.responseTimeMs,
			errorType: latestChecks.errorType,
			checkedAt: latestChecks.checkedAt,
		})
		.from(websites)
		.leftJoin(latestChecks, eq(websites.id, latestChecks.websiteId))
		.where(eq(websites.email, email))
		.orderBy(asc(websites.createdAt));
}

/* ========================================================================= */
//                        worker
/* ========================================================================= */

/**gets batch of websites for worker to fetch*/
export async function getWebsiteBatchFromDb(): Promise<CheckRequest[]> {
	//create claim number for the worker - this will be matched up when sending back the results
	//to make sure that the most recent update is used
	const claimId = crypto.randomUUID();

	//get claim cutoff for when a site should be retried
	const claimCutoff = new Date(Date.now() - DEFAULT_CLAIM_TIMEOUT_SECS * 1000);
	const now = new Date();

	//create a cte that gets matching jobs, limiting by the size and eligible for claiming
	const batch = db.$with("batch").as(
		db
			.select({ id: websites.id })
			.from(websites)
			.where(and(lte(websites.nextCheckAt, now), or(isNull(websites.claimedAt), lte(websites.claimedAt, claimCutoff))))
			.orderBy(asc(websites.nextCheckAt))
			.limit(DEFAULT_BATCH_SIZE)
			.for("update", { skipLocked: true }), //lock the records to prevent double claiming
	);

	//using the cte, update the records that were selected all in one db call and return
	const dbResult = await db
		.with(batch)
		.update(websites)
		.set({ claimedAt: now, claimId }) //set claimedAt and claimId to generated id to match up later
		.where(inArray(websites.id, db.select({ id: batch.id }).from(batch)))
		.returning({
			id: websites.id,
			url: websites.url,
			expectedStatus: websites.expectedStatus,
			claimId: websites.claimId,
		});

	const result = checkRequestBatchSchema.parse(dbResult);
	if (!result) throw new Error("Error parsing to valid worker batch request");

	return result;
}

export type SubmitResult = {
	id: string;
	email: string;
	url: string;
	expectedStatus: number;
	oldStatus: number | null;
	newStatus: number | null;
};

/**submits batch of websites from worker (OLD VERSION)*/
// export async function submitWebsiteBatchToDb(websites: Website[]): Promise<SubmitResult[]> {
// 	if (websites.length === 0) return [];

// 	//create virtual table using sql builder which parameterizes the data - not passed as string literals
// 	const values = sql.join(
// 		websites.map(
// 			(website) => sql`(
// 				${website.id}::uuid,
// 				${website.claimId}::uuid,
// 				${website.lastStatus}::integer,
// 				${website.lastError}::error_type,
// 				${website.responseTimeMs}::integer
// 			)`,
// 		),
// 		sql`, `,
// 	);

// 	//this insane query updates all rows for the submitted sites only if the claim id matches
// 	const result = await db.execute<{
// 		id: string;
// 		email: string;
// 		url: string;
// 		expectedStatus: number;
// 		oldStatus: number | null;
// 		newStatus: number | null;
// 	}>(sql`
// 		--create a temporary table from the worker's submitted results
// 		WITH submitted(id, claim_id, last_status, last_error, response_time_ms) AS (
// 			VALUES ${values}
// 		),

// 		--save the current status before updating
// 		--also verify that the worker still owns the claim
// 		old AS (
// 			SELECT
// 				w.id,
// 				w.last_status AS old_status
// 			FROM websites AS w
// 			INNER JOIN submitted AS s
// 				ON w.id = s.id
// 				AND w.claim_id = s.claim_id
// 		)

// 		--update each website with the new worker results
// 		UPDATE websites AS w
// 		SET
// 			last_status = s.last_status,
// 			last_error = s.last_error,
// 			response_time_ms = s.response_time_ms,

// 			--schedule the website's next check based on its interval
// 			next_check_at = NOW() + (w.interval_seconds * INTERVAL '1 second'),

// 			--release the job so it can be claimed again when next_check_at is reached
// 			claimed_at = NULL,
// 			claim_id = NULL

// 		FROM submitted AS s, old
// 		WHERE
// 			--match the submitted result to the database record
// 			w.id = s.id
// 			AND w.id = old.id

// 			--only accept the result if this worker still owns the claim
// 			AND w.claim_id = s.claim_id

// 		--return both statuses so the server can detect status changes and send alerts
// 		RETURNING
// 			w.id,
// 			w.email,
// 			w.url,
// 			w.expected_status AS "expectedStatus",
// 			old.old_status AS "oldStatus",
// 			w.last_status AS "newStatus"
// 	`);

// 	return result.rows;
// }

export async function submitWebsiteBatchToDb(submittedChecks: CheckSubmit[]) {
	if (submittedChecks.length === 0) return [];

	return db.transaction(async (tx) => {
		const results = [];

		for (const check of submittedChecks) {
			// 1. Update website only if claim ID matches
			const [updated] = await tx
				.update(websites)
				.set({
					nextCheckAt: sql`NOW() + (${websites.intervalSeconds} * INTERVAL '1 second')`,
					claimId: null,
					claimedAt: null,
				})
				.where(and(eq(websites.id, check.id), eq(websites.claimId, check.claimId!)))
				.returning();

			// 2. Ignore stale worker results
			if (!updated) continue;

			// 3. Insert individual check
			await tx.insert(checks).values({
				websiteId: updated.id,
				statusCode: check.statusCode,
				responseTimeMs: check.responseTimeMs,
				errorType: check.errorType,
				expectedStatus: updated.expectedStatus,
				checkedAt: new Date(),
			});

			// 4. Return information for alert processing
			results.push({
				id: updated.id,
				email: updated.email,
				url: updated.url,
				expectedStatus: updated.expectedStatus,
				newStatus: check.statusCode,
			});
		}

		console.log(results);
		return results;
	});
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

/**deletes website record for email*/
export async function deleteSessionInDb(email: string) {
	const [result] = await db.delete(sessions).where(eq(sessions.email, email)).returning();

	//nothing matched the given email and id
	if (!result) throw new NotFoundError("Session for user not found");

	return result;
}
