import { useState, type FormEvent } from "react";

export default function App() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);
		setError(null);
		setSuccess(false);

		try {
			const response = await fetch("/api/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				throw new Error("Failed to send login email");
			}

			setSuccess(true);
		} catch {
			setError("Unable to send login email. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main>
			<h1>Linea</h1>
			<p>Enter your email to get started.</p>

			<form onSubmit={handleSubmit}>
				<input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

				<button type="submit" disabled={loading}>
					{loading ? "Sending..." : "Continue with Email"}
				</button>
			</form>

			{error && <p>{error}</p>}

			{success && <p>Check your inbox for a login link.</p>}
		</main>
	);
}
