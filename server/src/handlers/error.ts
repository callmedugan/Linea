import type { Request, Response, NextFunction } from "express";

//400
export class BadRequestError extends Error {
	constructor(message: string) {
		super(message);
	}
}

//401
export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
	}
}

//403
export class ForbiddenError extends Error {
	constructor(message: string) {
		super(message);
	}
}

//404
export class NotFoundError extends Error {
	constructor(message: string) {
		super(message);
	}
}

//409
export class ConflictError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export function handlerError(err: Error, req: Request, res: Response, next: NextFunction) {
	let status = 500;
	let message = "Something went wrong on our end";

	if (err instanceof BadRequestError) {
		status = 400;
		message = err.message;
	} else if (err instanceof UnauthorizedError) {
		status = 401;
		message = err.message;
	} else if (err instanceof ForbiddenError) {
		status = 403;
		message = err.message;
	} else if (err instanceof NotFoundError) {
		status = 404;
		message = err.message;
	} else if (err instanceof ConflictError) {
		status = 409;
		message = err.message;
	}

	res.status(status).json({ error: message });
}
