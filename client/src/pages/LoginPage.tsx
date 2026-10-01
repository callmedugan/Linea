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
				<header className="mb-6 flex justify-center sm:mb-7">
					<img src="/logo.png" alt="Linea" className="h-10 w-auto sm:h-12" />
				</header>

				<section className="rounded-xl border border-[#e5e4e7] bg-white p-5 shadow-sm sm:p-7 dark:border-[#2e303a] dark:bg-[#191a21] dark:shadow-black/30">
					{success ? (
						<div className="text-center">
							<p className="mb-1 text-sm font-medium text-[#3d3745] dark:text-gray-200">Check your email</p>
							<p className="m-0 text-xs text-[#6b6375] dark:text-gray-400">We sent you a login link. You can close this tab.</p>
						</div>
					) : (
						<>
							<div className="mb-6">
								<p className="mb-1 text-sm font-medium text-[#3d3745] dark:text-gray-200">Sign in with your email</p>
								<p className="m-0 text-xs text-[#6b6375] dark:text-gray-400">We'll send you a secure link to access your dashboard.</p>
							</div>

							<form className="flex flex-col" onSubmit={handleSubmit}>
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
									className="mt-3.5 w-full cursor-pointer rounded-lg border border-[#aa3bff]/20 bg-[#aa3bff]/10 px-4 py-2.5 text-sm font-medium text-[#9225e8] transition hover:border-[#aa3bff]/35 hover:bg-[#aa3bff]/15 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 dark:border-[#c084fc]/20 dark:bg-[#c084fc]/10 dark:text-[#d8b4fe] dark:hover:border-[#c084fc]/35 dark:hover:bg-[#c084fc]/15"
								>
									{loading ? "Sending..." : "Send Email"}
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
