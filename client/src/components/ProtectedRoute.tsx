import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router";

type AuthState = "checking" | "authenticated" | "unauthenticated" | "error";

export default function ProtectedRoute() {
	const [authState, setAuthState] = useState<AuthState>("checking");

	useEffect(() => {
		const controller = new AbortController();

		async function checkSession() {
			try {
				const response = await fetch("/api/auth/session", {
					signal: controller.signal,
				});

				if (response.status === 401) {
					setAuthState("unauthenticated");
					return;
				}

				if (!response.ok) {
					throw new Error("Failed to verify session");
				}

				setAuthState("authenticated");
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}

				console.error(error);
				setAuthState("error");
			}
		}

		checkSession();

		return () => controller.abort();
	}, []);

	if (authState === "checking") {
		return (
			<main className="flex min-h-svh items-center justify-center bg-white px-5 text-sm text-[#6b6375] dark:bg-[#121318] dark:text-gray-400">
				Checking session...
			</main>
		);
	}

	if (authState === "unauthenticated") {
		return <Navigate to="/login" replace />;
	}

	if (authState === "error") {
		return (
			<main className="flex min-h-svh items-center justify-center bg-white px-5 dark:bg-[#121318]">
				<div className="w-full max-w-sm text-center">
					<p className="m-0 text-sm text-[#6b6375] dark:text-gray-400">Unable to verify your session.</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-4 rounded-lg bg-[#aa3bff] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#9225e8] dark:bg-[#c084fc] dark:hover:bg-[#d8b4fe]"
					>
						Try Again
					</button>
				</div>
			</main>
		);
	}

	return <Outlet />;
}
