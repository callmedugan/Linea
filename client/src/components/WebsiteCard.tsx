import { useState } from "react";
import type { Website } from "../types";

type WebsiteCardProps = {
	website: Website;
	onDeleted: () => Promise<void>;
};

export default function WebsiteCard({ website, onDeleted }: WebsiteCardProps) {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");

	async function handleDelete() {
		setDeleting(true);
		setError("");

		try {
			const response = await fetch(`/api/websites/${website.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete website");
			}

			await onDeleted();
		} catch {
			setError("Unable to delete website.");
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div className="website-card">
			<div className="website-info">
				<span className="status-dot" />

				<div>
					<p>{website.url}</p>

					{error && <span className="website-error">{error}</span>}
				</div>
			</div>

			<div className="website-actions">
				<span className="website-interval">Every {website.intervalSeconds}s</span>

				<button className="delete-button" type="button" onClick={handleDelete} disabled={deleting}>
					{deleting ? "Deleting..." : "Delete"}
				</button>
			</div>
		</div>
	);
}
