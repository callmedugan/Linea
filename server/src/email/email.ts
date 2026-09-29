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

	const title = isUp ? "Your website is back up" : "Your website is down";
	const subject = isUp ? `Resolved: ${url} is back up` : `Alert: ${url} is down`;

	const message = isUp
		? "Linea has detected that your website is responding normally again."
		: "Linea has detected that your website is not responding as expected.";

	const statusText = statusCode !== undefined ? `HTTP status: ${statusCode}` : "No response received";

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
					Data: `
						<div style="background:#f5f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
							<div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:40px;">

								<h1 style="margin:0;color:#202938;font-size:28px;">
									Linea
								</h1>

								<h2 style="margin-top:32px;color:#202938;">
									${title}
								</h2>

								<p style="color:#555;line-height:1.6;">
									${message}
								</p>

								<div style="background:#f5f6f8;border-radius:8px;padding:16px;margin:24px 0;">
									<p style="margin:0 0 8px;color:#777;font-size:13px;">
										Website
									</p>

									<p style="margin:0;color:#202938;font-weight:bold;word-break:break-all;">
										${url}
									</p>

									<p style="margin:12px 0 0;color:#777;font-size:13px;">
										${statusText}
									</p>
								</div>

								<p style="color:#777;font-size:13px;line-height:1.6;">
									Linea will continue monitoring this website.
								</p>

								<hr style="border:0;border-top:1px solid #eee;margin:28px 0;" />

								<p style="color:#999;font-size:12px;">
									Linea · Website Monitoring
								</p>

							</div>
						</div>
					`,
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
					Data: `
					<div style="background:#f5f6f8;padding:40px 20px;font-family:Arial,sans-serif;">
						<div style="max-width:480px;margin:auto;background:white;border-radius:12px;padding:40px;">

							<h1 style="margin:0;color:#202938;font-size:28px;">
								Linea
							</h1>

							<h2 style="margin-top:32px;color:#202938;">
								Login Request
							</h2>

							<p style="color:#555;line-height:1.6;">
								We received a request to log in to your Linea account.
								Click the button below to continue.
							</p>

							<a
								href="${loginUrl}"
								style="display:block;background:#202938;color:white;text-align:center;padding:14px;border-radius:8px;text-decoration:none;font-weight:bold;margin:28px 0;"
							>
								Log in to Linea
							</a>

							<p style="color:#777;font-size:13px;line-height:1.6;">
								This is a single-use login link. Do not share it with anyone.
								If you didn't request this email, you can safely ignore it.
							</p>

							<hr style="border:0;border-top:1px solid #eee;margin:28px 0;" />

							<p style="color:#999;font-size:12px;">
								Linea · Website Monitoring
							</p>

						</div>
					</div>
				`,
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
