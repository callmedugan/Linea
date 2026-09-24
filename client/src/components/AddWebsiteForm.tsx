import { useState, type FormEvent } from "react";

export default function AddWebsiteForm() {
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();

		setLoading(true);
		setError("");

		try {
			const response = await fetch(`/api/websites?url=${encodeURIComponent(url)}`, {
				method: "POST",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error ?? "Failed to add website");
			}

			setUrl("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to add website");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required />

			<button type="submit" disabled={loading}>
				{loading ? "Adding..." : "Add Website"}
			</button>

			{error && <p>{error}</p>}
		</form>
	);
}
