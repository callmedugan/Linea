import { useState } from "react";

export default function VerifyPage() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const token = new URLSearchParams(window.location.search).get("token");

	async function handleVerify() {
		if (!token) return;

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/login/verify", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			});

			if (!response.ok) {
				throw new Error("Verification failed");
			}

			window.location.replace("/dashboard");
		} catch {
			setError("This login link is invalid or expired.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main>
			<h1>Linea</h1>
			<h2>Confirm Login</h2>

			{token ? (
				<button onClick={handleVerify} disabled={loading}>
					{loading ? "Verifying..." : "Log in to Linea"}
				</button>
			) : (
				<p>Missing login token.</p>
			)}

			{error && <p>{error}</p>}
		</main>
	);
}
