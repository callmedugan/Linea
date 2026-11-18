import { lt } from "drizzle-orm";
import { db } from "./index.js";
import { sessions, tokens } from "./schema.js";

export async function startDbCleanupRecurring() {
	await cleanupExpiredData();
	// Run once every 24 hours
	setInterval(cleanupExpiredData, 24 * 60 * 60 * 1000);
}

async function cleanupExpiredData() {
	try {
		console.log("[Cleanup] Starting...");

		//delete any sessions or tokens that are expired
		const now = new Date();
		const sessionsDeleted = await db.delete(sessions).where(lt(sessions.expiresAt, now)).returning();
		const tokensDeleted = await db.delete(tokens).where(lt(tokens.expiresAt, now)).returning();
		if (sessionsDeleted.length > 0) console.log(`[Cleanup] Deleted ${sessionsDeleted.length} sessions`);
		if (tokensDeleted.length > 0) console.log(`[Cleanup] Deleted ${tokensDeleted.length} tokens`);

		//later we can cleanup any website checks older than a retention period

		console.log("[Cleanup] Complete");
	} catch (error) {
		console.error("[Cleanup] Failed:", error);
	}
}
