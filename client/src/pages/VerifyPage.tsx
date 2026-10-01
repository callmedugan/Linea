import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

export default function VerifyPage() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const token = searchParams.get("token");

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

			navigate("/dashboard", { replace: true });
		} catch {
			setError("This login link is invalid or expired.");
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
					{token ? (
						<>
							<div className="mb-6">
								<p className="mb-1 text-sm font-medium text-[#3d3745] dark:text-gray-200">Continue to Linea</p>
								<p className="m-0 text-xs text-[#6b6375] dark:text-gray-400">Verify this login link to access your monitoring dashboard.</p>
							</div>

							<button
								type="button"
								onClick={handleVerify}
								disabled={loading}
								className="w-full cursor-pointer rounded-lg border border-[#aa3bff]/20 bg-[#aa3bff]/10 px-4 py-2.5 text-sm font-medium text-[#9225e8] transition hover:border-[#aa3bff]/35 hover:bg-[#aa3bff]/15 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 dark:border-[#c084fc]/20 dark:bg-[#c084fc]/10 dark:text-[#d8b4fe] dark:hover:border-[#c084fc]/35 dark:hover:bg-[#c084fc]/15"
							>
								{loading ? "Verifying..." : "Log in"}
							</button>
						</>
					) : (
						<div>
							<p className="mb-1 text-sm font-medium text-[#3d3745] dark:text-gray-200">Invalid login link</p>
							<p className="m-0 text-xs text-[#6b6375] dark:text-gray-400">This login link is missing its verification token.</p>
						</div>
					)}

					{error && <p className="mt-3.5 mb-0 text-sm text-red-500">{error}</p>}
				</section>
			</div>
		</main>
	);
}
