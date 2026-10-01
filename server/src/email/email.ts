import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import "dotenv/config";

const ses = new SESClient({
	region: "us-east-2",
});

/* ========================================================================= */
//                        alerts
/* ========================================================================= */
/** Sends a website status alert and returns whether or not it was successfully sent */
export async function sendStatusAlertEmail(email: string, url: string, status: "up" | "down", statusCode?: number): Promise<boolean> {
	const command = getStatusAlertEmailCommand(email, url, status, statusCode);

	const result = await ses.send(command);

	return result.MessageId !== undefined;
}

function getStatusAlertEmailCommand(email: string, url: string, status: "up" | "down", statusCode?: number) {
	const isUp = status === "up";

	const title = isUp ? "Website back online" : "Website unavailable";
	const subject = isUp ? `Resolved: ${url} is back up` : `Alert: ${url} is down`;

	const message = isUp
		? "Linea detected that your website is responding normally again."
		: "Linea detected that your website is not responding as expected.";

	const statusText = statusCode !== undefined ? `HTTP ${statusCode}` : "No response received";

	const statusColor = isUp ? "#6ee7b7" : "#f87171";

	const html = emailShell(`
		<p style="
			margin:0 0 4px;
			font-size:14px;
			font-weight:600;
			color:#f3f4f6;
		">
			${title}
		</p>

		<p style="
			margin:0;
			font-size:12px;
			line-height:1.6;
			color:#9ca3af;
		">
			${message}
		</p>

		<div style="
			margin-top:24px;
			padding:16px;
			border:1px solid #2e303a;
			border-radius:8px;
			background-color:#121318;
		">
			<p style="
				margin:0 0 6px;
				font-size:11px;
				color:#6b7280;
			">
				Website
			</p>

			<p style="
				margin:0;
				color:#f3f4f6;
				font-size:14px;
				font-weight:600;
				word-break:break-all;
			">
				${url}
			</p>

			<p style="
				margin:10px 0 0;
				font-size:12px;
				color:${statusColor};
				font-weight:500;
			">
				${statusText}
			</p>
		</div>

		<p style="
			margin:20px 0 0;
			font-size:12px;
			line-height:1.6;
			color:#9ca3af;
		">
			Linea will continue monitoring this website.
		</p>
	`);

	return new SendEmailCommand({
		Source: "Linea <noreply@linea.callmedugan.dev>",
		Destination: {
			ToAddresses: [email],
		},
		Message: {
			Subject: {
				Data: subject,
			},
			Body: {
				Html: {
					Data: html,
				},
				Text: {
					Data: `${title} - Linea

${message}

Website:
${url}

${statusText}

Linea will continue monitoring this website.`,
				},
			},
		},
	});
}

/* ========================================================================= */
//                        login
/* ========================================================================= */
/**Sends email and returns whether or not it was successfully sent */
export async function sendLoginEmail(email: string, tokenRaw: string): Promise<boolean> {
	//create command
	const loginUrl = new URL(
		"/auth/verify",
		process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "development" ? process.env.DEV_MAGIC_LINK_URL : process.env.MAGIC_LINK_URL,
	);

	loginUrl.searchParams.set("token", tokenRaw);

	const command = getLoginEmailCommand(email, loginUrl.toString());

	//send
	const result = await ses.send(command);

	//return success
	return result.MessageId !== undefined;
}

function getLoginEmailCommand(email: string, loginUrl: string) {
	const html = emailShell(`
		<p style="
			margin:0 0 4px;
			font-size:14px;
			font-weight:600;
			color:#f3f4f6;
		">
			Continue to Linea
		</p>

		<p style="
			margin:0;
			font-size:12px;
			line-height:1.6;
			color:#9ca3af;
		">
			We received a request to log in to your Linea dashboard.
		</p>

		<a
			href="${loginUrl}"
			style="
				display:block;
				margin-top:24px;
				padding:11px 16px;
				border:1px solid #3d2c4a;
				border-radius:8px;
				background-color:#261d30;
				color:#d8b4fe;
				text-align:center;
				text-decoration:none;
				font-size:14px;
				font-weight:600;
			"
		>
			Log in to Linea
		</a>

		<p style="
			margin:20px 0 0;
			font-size:12px;
			line-height:1.6;
			color:#9ca3af;
		">
			This is a single-use login link. Do not share it with anyone.
			If you didn't request this email, you can safely ignore it.
		</p>
	`);

	return new SendEmailCommand({
		Source: "Linea <noreply@linea.callmedugan.dev>",
		Destination: {
			ToAddresses: [email],
		},
		Message: {
			Subject: {
				Data: "Login Request - Linea",
			},
			Body: {
				Html: {
					Data: html,
				},
				Text: {
					Data: `Login Request - Linea

We received a request to log in to your Linea account.

Log in here:
${loginUrl}

This is a single-use login link. Do not share it with anyone.

If you didn't request this email, you can safely ignore it.`,
				},
			},
		},
	});
}

/* ========================================================================= */
//                        shared email layout
/* ========================================================================= */
/** Wraps email content in the shared Linea email layout */
function emailShell(content: string) {
	return `
		<!doctype html>
		<html>
			<head>
				<meta charset="UTF-8" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1.0"
				/>

				<meta name="color-scheme" content="dark" />
				<meta name="supported-color-schemes" content="dark" />

				<title>Linea</title>
			</head>

			<body
				bgcolor="#121318"
				style="
					margin:0;
					padding:0;
					background-color:#121318;
				"
			>
				<table
					role="presentation"
					width="100%"
					cellspacing="0"
					cellpadding="0"
					border="0"
					bgcolor="#121318"
					style="
						width:100%;
						background-color:#121318;
					"
				>
					<tr>
						<td
							align="center"
							bgcolor="#121318"
							style="
								padding:40px 20px;
								background-color:#121318;
							"
						>
							<table
								role="presentation"
								width="100%"
								cellspacing="0"
								cellpadding="0"
								border="0"
								style="
									width:100%;
									max-width:480px;
								"
							>
								<tr>
									<td
										align="center"
										style="
											padding-bottom:24px;
										"
									>
										<img
											src="https://linea.callmedugan.dev/logo.png"
											alt="Linea"
											style="
												display:block;
												height:44px;
												width:auto;
												border:0;
											"
										/>
									</td>
								</tr>

								<tr>
									<td
										bgcolor="#191a21"
										style="
											padding:28px;
											background-color:#191a21;
											border:1px solid #2e303a;
											border-radius:12px;
											font-family:Arial,Helvetica,sans-serif;
											color:#9ca3af;
										"
									>
										${content}
									</td>
								</tr>

								<tr>
									<td
										align="center"
										style="
											padding-top:20px;
											font-family:Arial,Helvetica,sans-serif;
											font-size:12px;
											line-height:1.5;
											color:#6b7280;
										"
									>
										Linea · Website Monitoring
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</body>
		</html>
	`;
}
