import { uuid, text, integer, timestamp, unique, snakeCase, pgEnum } from "drizzle-orm/pg-core";
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
		lastStatus: integer().default(0), //default to 0 for not visited so null can mean no response was received
		responseTimeMs: integer(),
		lastError: errorTypeEnum("last_error"),
	},
	(table) => [unique("websites_url_email_unique").on(table.url, table.email)],
);

//types
export type Website = typeof websites.$inferSelect;
export const websiteSchema = createSelectSchema(websites, {
	nextCheckAt: z.coerce.date(), //need to coerce all the dates because json has no date type. will throw an error on submitting
	createdAt: z.coerce.date(),
	claimedAt: z.coerce.date().nullable(),
});
export const websiteBatchSchema = z.array(websiteSchema);

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
