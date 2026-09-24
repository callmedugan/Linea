import { useCallback, useEffect, useState } from "react";
import AddWebsiteForm from "../components/AddWebsiteForm";

type Website = {
	id: string;
	url: string;
	intervalSeconds: number;
	nextCheckAt: string;
	createdAt: string;
};

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
		<main>
			<h1>Linea</h1>
			<p>Website Monitoring Dashboard</p>

			<section>
				<h2>Your Websites</h2>

				{loading ? (
					<p>Loading...</p>
				) : websites.length === 0 ? (
					<p>You haven't added any websites yet.</p>
				) : (
					websites.map((website) => (
						<div key={website.id}>
							<p>{website.url}</p>
						</div>
					))
				)}

				<AddWebsiteForm onWebsiteAdded={getWebsites} />
			</section>
		</main>
	);
}
