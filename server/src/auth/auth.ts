import { randomBytes, createHash } from "node:crypto";

//goes to email link
const token = randomBytes(32).toString("hex");

//stored in db
const tokenHash = createHash("sha256").update(token).digest("hex");
