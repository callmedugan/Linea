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
		<main className="flex min-h-svh items-center justify-center bg-white px-4 py-8 text-[#6b6375] sm:px-5 dark:bg-[#121318] dark:text-gray-400">
			<div className="w-full max-w-105">
				<header className="mb-6 text-center sm:mb-7">
					<h1 className="m-0 text-4xl font-semibold tracking-[-1.5px] text-[#08060d] sm:text-[42px] dark:text-gray-100">Linea</h1>
					<p className="mt-1.5 mb-0">Simple website monitoring.</p>
				</header>

				<section className="rounded-xl border border-[#e5e4e7] bg-white p-5 shadow-sm sm:p-7 dark:border-[#2e303a] dark:bg-[#191a21] dark:shadow-black/30">
					{success ? (
						<div className="text-center">
							<h2 className="m-0 text-xl font-semibold text-[#08060d] dark:text-gray-100">Check your inbox</h2>
							<p className="mt-1.5 mb-0 text-sm">We sent you a login link. You may close this tab.</p>
						</div>
					) : (
						<>
							<div className="mb-6">
								<h2 className="m-0 text-xl font-semibold text-[#08060d] dark:text-gray-100">Log in</h2>
								<p className="mt-1.5 mb-0 text-sm">Enter your email to get started.</p>
							</div>

							<form className="flex flex-col" onSubmit={handleSubmit}>
								<label htmlFor="email" className="mb-2 text-sm font-medium text-[#08060d] dark:text-gray-100">
									Email
								</label>

								<input
									id="email"
									type="email"
									placeholder="you@example.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									disabled={loading}
									className="w-full rounded-lg border border-[#e5e4e7] bg-white px-3 py-2.5 text-[#08060d] outline-none transition placeholder:text-[#6b6375]/65 focus:border-[#aa3bff] focus:ring-3 focus:ring-[#aa3bff]/10 disabled:opacity-60 dark:border-[#2e303a] dark:bg-[#191a21] dark:text-gray-100 dark:placeholder:text-gray-400/65 dark:focus:border-[#c084fc] dark:focus:ring-[#c084fc]/10"
								/>

								<button
									type="submit"
									disabled={loading}
									className="mt-3.5 w-full cursor-pointer rounded-lg border-0 bg-[#aa3bff] px-4.5 py-2.5 font-medium text-white transition hover:bg-[#9225e8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 dark:bg-[#c084fc] dark:hover:bg-[#d8b4fe]"
								>
									{loading ? "Sending..." : "Continue with Email"}
								</button>
							</form>
						</>
					)}

					{error && <p className="mt-3.5 mb-0 text-sm text-red-500">{error}</p>}
				</section>
			</div>
		</main>
	);
}
