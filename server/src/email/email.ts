import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import "dotenv/config";

const ses = new SESClient({
	region: "us-east-2",
});

/**Sends email and returns whether or not it was successfully sent */
export default async function sendEmail(type: "login" | "alert", email: string) {
	//create command
	const command = new SendEmailCommand({
		Source: "Linea <noreply@linea.callmedugan.dev>",
		Destination: {
			ToAddresses: [email],
		},
		Message: {
			Subject: { Data: "Linea SES Test" },
			Body: {
				Text: { Data: "Your Linea email integration works!" },
			},
		},
	});
	//send
	const result = await ses.send(command);
	//return success
	return result.MessageId !== undefined;
}
