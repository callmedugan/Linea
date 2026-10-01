import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import AddWebsiteForm from "../components/AddWebsiteForm";
import WebsiteCard from "../components/WebsiteCard";
import type { Website } from "../types";

const POLL_INTERVAL_MS = 10_000;

export default function DashboardPage() {
	const navigate = useNavigate();
	const [websites, setWebsites] = useState<Website[]>([]);
	const [loading, setLoading] = useState(true);

	const getWebsites = useCallback(async () => {
		try {
			const response = await fetch("/api/websites");

			if (response.status === 401) {
				navigate("/login", { replace: true });
				return;
			}

			if (!response.ok) {
				throw new Error("Failed to get websites");
			}

			const data: Website[] = await response.json();
			setWebsites(data);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		getWebsites();

		const interval = setInterval(getWebsites, POLL_INTERVAL_MS);

		return () => clearInterval(interval);
	}, [getWebsites]);

	return (
		<main className="min-h-svh bg-white px-3 py-6 text-[#6b6375] sm:px-5 sm:py-16 dark:bg-[#121318] dark:text-gray-400">
			<div className="mx-auto w-full max-w-[900px]">
				<header className="mb-3 sm:mb-4">
					<img src="/logo.png" alt="Linea" className="h-9 w-auto sm:h-11" />
				</header>

				<section className="overflow-hidden rounded-xl border border-[#e5e4e7] bg-white shadow-sm dark:border-[#2e303a] dark:bg-[#191a21] dark:shadow-black/30">
					<div className="flex items-center justify-between border-b border-[#e5e4e7] px-4 py-4 sm:px-6 sm:py-6 dark:border-[#2e303a]">
						<h2 className="m-0 text-lg font-semibold text-[#08060d] sm:text-xl dark:text-gray-100">Your Alerts</h2>

						<span className="flex h-7 min-w-8 items-center justify-center rounded-md bg-[#aa3bff]/8 px-2.5 font-mono text-xs text-[#aa3bff] dark:bg-[#c084fc]/10 dark:text-[#c084fc]">
							{websites.length}/8
						</span>
					</div>

					<div className="p-2 sm:p-3">
						{loading ? (
							<p className="m-0 px-3 py-9 text-center text-sm">Loading...</p>
						) : websites.length === 0 ? (
							<p className="m-0 px-3 py-9 text-center text-sm">You haven't added any websites yet.</p>
						) : (
							websites.map((website) => <WebsiteCard key={website.id} website={website} onDeleted={getWebsites} />)
						)}
					</div>

					<AddWebsiteForm onWebsiteAdded={getWebsites} />
				</section>
			</div>
		</main>
	);
}
