import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";

export const middlewareApiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 300, // 300 requests per IP per window
	message: { status: 429, error: "Too many requests. Try again later." },
	standardHeaders: "draft-8",
	legacyHeaders: false,
});

//forces the browser to follow the MIME type in the Content-Type header instead of guessing - should be used API wide
export function noSniffHeader(req: Request, res: Response, next: NextFunction) {
	res.setHeader("X-Content-Type-Options", "nosniff");
	return next();
}
