import { pgTable, uuid, text, integer, timestamp, unique } from "drizzle-orm/pg-core";

export const websites = pgTable(
	"websites",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		url: text("url").notNull(),
		email: text("email").notNull(),
		intervalSeconds: integer("interval_seconds").notNull().default(30),
		nextCheckAt: timestamp("next_check_at").notNull().defaultNow(),
		createdAt: timestamp("created_at").notNull().defaultNow(),
	},
	(table) => [unique("websites_url_email_unique").on(table.url, table.email)],
);
