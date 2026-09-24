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
		<main className="auth-page">
			<div className="auth-container">
				<header className="auth-header">
					<h1>Linea</h1>
					<p>Simple website monitoring.</p>
				</header>

				<section className="auth-card">
					<div className="auth-card-header">
						<h2>Confirm login</h2>

						{token ? <p>Continue to your monitoring dashboard.</p> : <p>This login link is missing its token.</p>}
					</div>

					{token && (
						<button className="auth-button" onClick={handleVerify} disabled={loading}>
							{loading ? "Verifying..." : "Log in to Linea"}
						</button>
					)}

					{error && <p className="form-error">{error}</p>}
				</section>
			</div>
		</main>
	);
}
