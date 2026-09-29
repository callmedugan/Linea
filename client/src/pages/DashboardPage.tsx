import { useCallback, useEffect, useState } from "react";
import AddWebsiteForm from "../components/AddWebsiteForm";
import WebsiteCard from "../components/WebsiteCard";
import type { Website } from "../types";

const POLL_INTERVAL_MS = 10_000;

export default function DashboardPage() {
	const [websites, setWebsites] = useState<Website[]>([]);
	const [loading, setLoading] = useState(true);

	const getWebsites = useCallback(async () => {
		try {
			const response = await fetch("/api/websites");

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
	}, []);

	useEffect(() => {
		//initial fetch
		getWebsites();

		//poll for updates
		const interval = setInterval(getWebsites, POLL_INTERVAL_MS);

		//stop polling when component unmounts
		return () => clearInterval(interval);
	}, [getWebsites]);

	return (
		<main className="dashboard">
			<header className="dashboard-header">
				<h1>Linea</h1>
			</header>

			<section className="dashboard-section">
				<div className="section-header">
					<div>
						<h2>Your Alerts</h2>
					</div>

					<span className="counter">{websites.length}/8</span>
				</div>

				<div className="website-list">
					{loading ? (
						<p className="empty-state">Loading...</p>
					) : websites.length === 0 ? (
						<p className="empty-state">You haven't added any websites yet.</p>
					) : (
						websites.map((website) => <WebsiteCard key={website.id} website={website} onDeleted={getWebsites} />)
					)}
				</div>

				<AddWebsiteForm onWebsiteAdded={getWebsites} />
			</section>
		</main>
	);
}
