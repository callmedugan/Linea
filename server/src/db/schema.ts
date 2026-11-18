import { uuid, text, integer, timestamp, unique, snakeCase, pgEnum, boolean, index } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-orm/zod";
import z from "zod";
import { DEFAULT_EXPECTED_STATUS, DEFAULT_INTERVAL_SECS } from "../constants.js";

/* ========================================================================= */
//                        websites
/* ========================================================================= */

export const errorTypeEnum = pgEnum("error_type", ["timeout", "dns", "connection", "tls", "blocked", "network", "unknown"]);

export const websites = snakeCase.table(
	"websites",
	{
		id: uuid().primaryKey().defaultRandom(),
		url: text().notNull(),
		email: text().notNull(),
		//timestamps
		intervalSeconds: integer().notNull().default(DEFAULT_INTERVAL_SECS),
		nextCheckAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
		//worker claims
		claimId: uuid(),
		claimedAt: timestamp({ withTimezone: true }),
		//status
		expectedStatus: integer().notNull().default(DEFAULT_EXPECTED_STATUS),
	},
	(table) => [unique("websites_url_email_unique").on(table.url, table.email)],
);

//main type for basic website info
export type Website = typeof websites.$inferSelect;

/* ========================================================================= */
//                        checks
/* ========================================================================= */

export const checks = snakeCase.table(
	"checks",
	{
		id: uuid().primaryKey().defaultRandom(),
		//foriegn key on the websites table
		websiteId: uuid()
			.notNull()
			.references(() => websites.id, { onDelete: "cascade" }),
		//null means no resp
		statusCode: integer(),
		responseTimeMs: integer(),
		errorType: errorTypeEnum("error_type"),
		expectedStatus: integer().notNull(),
		checkedAt: timestamp({ withTimezone: true }).notNull(),
	},
	//create index to quickly find checks for a specific website
	(table) => [index().on(table.websiteId, table.checkedAt)],
);

/* ========================================================================= */
//                        worker request
/* ========================================================================= */
//zod schema for what the worker should receive
export const checkRequestSchema = createSelectSchema(websites)
	.pick({
		id: true,
		url: true,
		expectedStatus: true,
	})
	.extend({
		claimId: z.uuid(),
	});

//batch of requests
export const checkRequestBatchSchema = z.array(checkRequestSchema);
//basic type
export type CheckRequest = z.infer<typeof checkRequestSchema>;

/* ========================================================================= */
//                        worker submits
/* ========================================================================= */
//zod schema for what a worker check should look like when it submits
export const checkSubmitSchema = createSelectSchema(checks, {
	checkedAt: z.coerce.date(),
})
	.omit({
		expectedStatus: true,
		websiteId: true,
	})
	.extend({
		claimId: z.uuid(),
	});

//batch of checks
export const checkSubmitBatchSchema = z.array(checkSubmitSchema);
//main type
export type CheckSubmit = z.infer<typeof checkSubmitSchema>;

/* ========================================================================= */
//                        auth
/* ========================================================================= */

export const tokens = snakeCase.table("tokens", {
	id: uuid().primaryKey().defaultRandom(),
	email: text().notNull(),
	tokenHash: text().notNull().unique(),
	expiresAt: timestamp().notNull(),
	usedAt: timestamp(),
});

export const sessions = snakeCase.table("sessions", {
	id: uuid().primaryKey().defaultRandom(),
	email: text().notNull(),
	expiresAt: timestamp().notNull(),
	createdAt: timestamp().defaultNow().notNull(),
});
