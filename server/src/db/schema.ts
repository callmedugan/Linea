import { uuid, text, integer, timestamp, unique, snakeCase } from "drizzle-orm/pg-core";

export const websites = snakeCase.table(
	"websites",
	{
		id: uuid().primaryKey().defaultRandom(),
		url: text().notNull(),
		email: text().notNull(),
		intervalSeconds: integer().notNull().default(30),
		nextCheckAt: timestamp().notNull().defaultNow(),
		createdAt: timestamp().notNull().defaultNow(),
	},
	(table) => [unique("websites_url_email_unique").on(table.url, table.email)],
);

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
