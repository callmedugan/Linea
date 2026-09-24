import express from "express";
import path from "path";
import {
	middlewareApiLimiter,
	middlewareSendEmailLimiter,
	middlewareIPLimiter,
	noSniffHeader,
	middlewareEmailLinkLimiter,
	middlewareRequireSession,
} from "./middleware.js";
import { handlerError } from "./handlers/error.js";
import "dotenv/config";
import { addWebsiteAlert, deleteWebsiteAlert, sendLoginEmail, verifyLogin as verifyEmailLink } from "./handlers/handlers.js";
import cookieParser from "cookie-parser";

const app = express();

//used to serve static files - process.cwd will be set in the start script
const clientPath = path.resolve(process.cwd(), "../client/dist");

// allow json and limit to 100kb of data
app.use(express.json({ limit: "100kb" }));

//used for reading cookies
app.use(cookieParser());

// nosniff header
app.use(noSniffHeader);

// limit overall traffic
app.use(middlewareApiLimiter, middlewareIPLimiter);

/* ========================================================================= */
//                        handlers
/* ========================================================================= */

app.get("/api/health", (req, res) => {
	res.json({ status: "ok" });
});

//auth
app.post("/api/login", middlewareSendEmailLimiter, sendLoginEmail); //send email to login
app.post("/api/login/verify", middlewareEmailLinkLimiter, verifyEmailLink); //called from the link given to the user's email

//websites
//app.get("/api/websites", middlewareRequireSession, getWebsiteStatus); //get status route - will most likely not be used
app.post("/api/websites", middlewareRequireSession, addWebsiteAlert); //submit website to watch
app.delete("/api/websites/:id", middlewareRequireSession, deleteWebsiteAlert); //removes website from watchlist

/* ========================================================================= */
//                   Error Handling Middleware - must go last
/* ========================================================================= */

// Static frontend files
app.use(express.static(clientPath));

// React Router fallback
app.get("/{*splat}", (_req, res) => {
	res.sendFile(path.join(clientPath, "index.html"));
});

//used for any unknown routes
app.use("/api", (req, res) => {
	res.status(404).json({ error: "API route not found" });
});

app.use(handlerError);

app.listen(process.env.PORT, () => {
	console.log(`Server running at http://localhost:${process.env.PORT}`);
});
