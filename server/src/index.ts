import express from "express";
import path from "path";
import {
	globalLimiter,
	sendEmailLimiter,
	ipLimiter,
	noSniffHeader,
	requireSessionMiddleware,
	requireAPIKeyMiddleware,
	workerLimiter,
	emailLinkLimiter,
} from "./middleware.js";
import { handlerError } from "./handlers/error.js";
import "dotenv/config";
import {
	addWebsiteAlertHandler,
	deleteWebsiteAlertHandler,
	getWebsiteAlertsHandler,
	getWorkerJobsHandler,
	logoutUserHandler,
	sendLoginEmailHandler,
	submitWorkerJobsHandler,
	verifyLoginHandler,
} from "./handlers/handlers.js";
import cookieParser from "cookie-parser";

const app = express();

//used to serve static files - process.cwd will be set in the start script
const clientPath = path.resolve(process.cwd(), "../client/dist");

/* ========================================================================= */
//                        routing
/* ========================================================================= */

// allow json and limit to 100kb of data
app.use(express.json({ limit: "100kb" }));

//used for reading cookies
app.use(cookieParser());

// nosniff header
app.use(noSniffHeader);

//need this with reverse proxy https so that rate limiting wont complain
app.set("trust proxy", 1);

/* ========================================================================= */
//                        handlers
/* ========================================================================= */

//auth
app.use("/api/login", globalLimiter, ipLimiter);
app.post("/api/login", sendEmailLimiter, sendLoginEmailHandler); //send email to login
app.post("/api/login/verify", emailLinkLimiter, verifyLoginHandler); //called from the link given to the user's email
app.post("/api/logout", requireSessionMiddleware, logoutUserHandler); //deletes user session
//returns 200 if session is good, otherwise middleware returns error
app.get("/api/auth/session", requireSessionMiddleware, (_req, res) => {
	res.sendStatus(200);
});

//websites
app.use("/api/websites", globalLimiter, ipLimiter);
app.get("/api/websites", requireSessionMiddleware, getWebsiteAlertsHandler); //get alerts for session email
app.post("/api/websites", requireSessionMiddleware, addWebsiteAlertHandler); //submit website to watch
app.delete("/api/websites/:id", requireSessionMiddleware, deleteWebsiteAlertHandler); //removes website from watchlist

//worker
app.use("/api/worker", requireAPIKeyMiddleware, workerLimiter);
app.post("/api/worker/jobs/claim", getWorkerJobsHandler); //gets items from work queue to process
app.post("/api/worker/jobs/submit", submitWorkerJobsHandler); //sends back items to work queue

/* ========================================================================= */
//                   Error Handling Middleware - must go last
/* ========================================================================= */

//used for any unknown routes
app.use("/api", (req, res) => {
	res.status(404).json({ error: "API route not found" });
});

// Static frontend files
app.use(express.static(clientPath));

// React Router fallback - this will serve the index.html for react and react router will take over
app.get("/{*splat}", (_req, res) => {
	res.sendFile(path.join(clientPath, "index.html"));
});

//error handler last
app.use(handlerError);

//listen
const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, "127.0.0.1", () => {
	console.log(`Server running at http://127.0.0.1:${PORT}`);
});
