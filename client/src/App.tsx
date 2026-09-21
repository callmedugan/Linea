import { useState, type FormEvent } from "react";

type WebsiteStatus = {
	success: boolean;
	data: {
		url: string;
		isUp: boolean;
		statusCode: number | null;
		responseTime: number;
	};
};

export default function App() {
	const [url, setUrl] = useState("");
	const [status, setStatus] = useState<WebsiteStatus | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);
		setError(null);
		setStatus(null);

		try {
			console.log(url);
			const response = await fetch(`/api/status?url=${encodeURIComponent(url)}`);

			if (!response.ok) {
				throw new Error("Failed to check website");
			}

			const data: WebsiteStatus = await response.json();
			setStatus(data);
		} catch {
			setError("Unable to check website");
		} finally {
			setLoading(false);
		}
	}

	return (
		<main>
			<h1>Linea</h1>
			<p>Check the status of any website.</p>

			<form onSubmit={handleSubmit}>
				<input type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required />

				<button type="submit" disabled={loading}>
					{loading ? "Checking..." : "Check Website"}
				</button>
			</form>

			{error && <p>{error}</p>}

			{status && (
				<section>
					<h2>{status.data.url}</h2>

					<p>Status: {status.data.isUp ? "Online" : "Offline"}</p>

					<p>HTTP Status: {status.data.statusCode ?? "N/A"}</p>

					<p>Response Time: {status.data.responseTime} ms</p>
				</section>
			)}
		</main>
	);
}
