import { useState, type FormEventHandler } from "react";

type AddWebsiteFormProps = {
	onWebsiteAdded: () => Promise<void>;
};

export default function AddWebsiteForm({ onWebsiteAdded }: AddWebsiteFormProps) {
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
		event.preventDefault();

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

				<button type="submit" disabled={loading}>
					{loading ? "Adding..." : "Add Website"}
				</button>
			</div>

			{error && <p className="form-error">{error}</p>}
		</form>
	);
}
