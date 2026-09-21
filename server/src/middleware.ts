import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

//for total requests
export const middlewareApiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 300, // 300 requests per IP per window
	message: { status: 429, error: "Too many requests. Try again later." },
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

//forces the browser to follow the MIME type in the Content-Type header instead of guessing - should be used API wide
export function noSniffHeader(req: Request, res: Response, next: NextFunction) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	return next();
}
