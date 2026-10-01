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
			<div className="w-full max-w-[420px]">
				<header className="mb-6 text-center sm:mb-7">
					<h1 className="m-0 text-4xl font-semibold tracking-[-1.5px] text-[#08060d] sm:text-[42px] dark:text-gray-100">Linea</h1>
					<p className="mt-1.5 mb-0">Simple website monitoring.</p>
				</header>

				<section className="rounded-xl border border-[#e5e4e7] bg-white p-5 shadow-sm sm:p-7 dark:border-[#2e303a] dark:bg-[#191a21] dark:shadow-black/30">
					<div className="mb-6">
						<h2 className="m-0 text-xl font-semibold text-[#08060d] dark:text-gray-100">Confirm login</h2>
						{token ? (
							<p className="mt-1.5 mb-0 text-sm">Continue to your monitoring dashboard.</p>
						) : (
							<p className="mt-1.5 mb-0 text-sm">This login link is missing its token.</p>
						)}
					</div>

					{token && (
						<button
							type="button"
							onClick={handleVerify}
							disabled={loading}
							className="w-full cursor-pointer rounded-lg border-0 bg-[#aa3bff] px-4.5 py-2.5 font-medium text-white transition hover:bg-[#9225e8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 dark:bg-[#c084fc] dark:hover:bg-[#d8b4fe]"
						>
							{loading ? "Verifying..." : "Log in to Linea"}
						</button>
					)}

					{error && <p className="mt-3.5 mb-0 text-sm text-red-500">{error}</p>}
				</section>
			</div>
		</main>
	);
}
