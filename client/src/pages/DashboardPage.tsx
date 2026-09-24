import { useCallback, useEffect, useState } from "react";
import AddWebsiteForm from "../components/AddWebsiteForm";
import WebsiteCard from "../components/WebsiteCard";
import type { Website } from "../types";

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
		getWebsites();
	}, [getWebsites]);

	return (
		<main className="dashboard">
			<header className="dashboard-header">
				<h1>Linea</h1>
				<p>Website Monitoring Dashboard</p>
			</header>

			<section className="dashboard-section">
				<div className="section-header">
					<div>
						<h2>Your Websites</h2>
						<p>Monitor availability and response status.</p>
					</div>

					<span className="counter">{websites.length}</span>
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
