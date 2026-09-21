import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import "dotenv/config";

const ses = new SESClient({
	region: "us-east-2",
});

const command = new SendEmailCommand({
	Source: "noreply@linea.callmedugan.dev",
	Destination: {
		ToAddresses: [process.env.TEST_EMAIL!],
	},
	Message: {
		Subject: { Data: "Linea SES Test" },
		Body: {
			Text: { Data: "Your Linea email integration works!" },
		},
	},
});

const result = await ses.send(command);

console.log("Email sent:", result.MessageId);
