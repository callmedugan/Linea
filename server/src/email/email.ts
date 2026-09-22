import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import "dotenv/config";

const ses = new SESClient({
	region: "us-east-2",
});

/**Sends email and returns whether or not it was successfully sent */
export default async function sendEmail(type: "login" | "alert", email: string): Promise<boolean> {
	if (type === "login") {
		//create command
		const command = getLoginEmailCommand(email, `${process.env.MAGIC_LINK_URL}/dashboard`);
		//send
		const result = await ses.send(command);
		//return success
		return result.MessageId !== undefined;
	}
	if (type === "alert") {
		return false;
	}
	return false;
}

/* ========================================================================= */
//                        login
/* ========================================================================= */

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
