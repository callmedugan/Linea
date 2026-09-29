import { useState, type FormEventHandler } from "react";

type AddWebsiteFormProps = {
	onWebsiteAdded: () => Promise<void>;
};

export default function AddWebsiteForm({ onWebsiteAdded }: AddWebsiteFormProps) {
	const [url, setUrl] = useState("");
	const [expectedStatus, setExpectedStatus] = useState(200);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();

		setLoading(true);
		setError("");

		try {
			const response = await fetch("/api/websites", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					url,
					expectedStatus,
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error ?? "Failed to add website");
			}

			setUrl("");
			setExpectedStatus(200);

			await onWebsiteAdded();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to add website");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="add-website-form" onSubmit={handleSubmit}>
			<label htmlFor="website-url">Add website</label>

			<div className="add-website-controls">
				<input
					id="website-url"
					type="url"
					value={url}
					onChange={(event) => setUrl(event.target.value)}
					placeholder="https://example.com"
					required
					disabled={loading}
				/>

				<input
					id="expected-status"
					type="number"
					value={expectedStatus}
					onChange={(event) => setExpectedStatus(event.target.valueAsNumber)}
					min={100}
					max={599}
					placeholder="200"
					required
					disabled={loading}
					aria-label="Expected status"
				/>

				<button type="submit" disabled={loading}>
					{loading ? "Adding..." : "Add Website"}
				</button>
			</div>

			{error && <p className="form-error">{error}</p>}
		</form>
	);
}
