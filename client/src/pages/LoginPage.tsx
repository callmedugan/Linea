import { useState, type FormEvent } from "react";

export default function LoginPage() {
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
		<main className="auth-page">
			<div className="auth-container">
				<header className="auth-header">
					<h1>Linea</h1>
					<p>Simple website monitoring.</p>
				</header>

				<section className="auth-card">
					{success ? (
						<div className="auth-message">
							<h2>Check your inbox</h2>
							<p>We sent you a login link. You may close this tab.</p>
						</div>
					) : (
						<>
							<div className="auth-card-header">
								<h2>Log in</h2>
								<p>Enter your email to get started.</p>
							</div>

							<form className="auth-form" onSubmit={handleSubmit}>
								<label htmlFor="email">Email</label>

								<input
									id="email"
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading}
								/>

								<button type="submit" disabled={loading}>
									{loading ? "Sending..." : "Continue with Email"}
								</button>
							</form>
						</>
					)}

					{error && <p className="form-error">{error}</p>}
				</section>
			</div>
		</main>
	);
}
