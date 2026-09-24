import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { getSessionFromDb } from "./db/queries.js";
import type { sessions } from "./db/schema.js";

//for total requests
export const middlewareApiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, //15 mins
	limit: 300,
	// All requests share the same counter
	keyGenerator: () => "global",

	message: {
		error: "Service is temporarily busy. Try again later.",
	},

	standardHeaders: "draft-8",
	legacyHeaders: false,
});

//per IP basis
export const middlewareIPLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 20,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		error: "Too many website submissions. Try again later.",
	},
});

/**limits to 5 requests per 15 minutes for email send requests */
export const middlewareSendEmailLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		error: "Too many email requests. Try again later.",
	},
});

/**limits to 5 requests per 15 minutes for email links */
export const middlewareEmailLinkLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		error: "Too many email requests. Try again later.",
	},
});

//forces the browser to follow the MIME type in the Content-Type header instead of guessing - should be used API wide
export function noSniffHeader(req: Request, res: Response, next: NextFunction) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	return next();
}

declare global {
	namespace Express {
		interface Request {
			session?: typeof sessions.$inferSelect; // Declares the injected property globally to make ts hush
		}
	}
}

/** used for routes that require a session login */
export async function middlewareRequireSession(req: Request, res: Response, next: NextFunction) {
	//get session id from cookies
	const sessionId = req.cookies.session;
	if (!sessionId) return res.status(401).json({ error: "Unauthorized" });

	//check db
	const session = await getSessionFromDb(sessionId);
	if (!session || session.expiresAt < new Date()) return res.status(401).json({ error: "Unauthorized" });

	//attach session to req
	req.session = session;
	next();
}
