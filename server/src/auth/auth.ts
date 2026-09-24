import { randomBytes, createHash } from "node:crypto";

export type Tokens = {
	raw: string;
	hash: string;
};

/**returns a raw and hashed set of a single valid token */
export function getTokens(): Tokens {
	//goes to email link
	const raw = randomBytes(32).toString("hex");

	//stored in db
	const hash = createHash("sha256").update(raw).digest("hex");

	return { raw, hash };
}

export function hashToken(raw: string): string {
	return createHash("sha256").update(raw).digest("hex");
}
