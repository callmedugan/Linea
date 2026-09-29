import { useState } from "react";
import type { Website } from "../types";

type WebsiteCardProps = {
	website: Website;
	onDeleted: () => Promise<void>;
};

export default function WebsiteCard({ website, onDeleted }: WebsiteCardProps) {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");

	const isPending = website.lastStatus === 0;
	const isUp = website.lastStatus === website.expectedStatus;

	const status = isPending ? "Pending" : isUp ? "Up" : "Down";

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
				<span className={`status-dot status-${status.toLowerCase()}`} />

				<div>
					<p>{website.url}</p>

					<div className="website-status">
						{isPending ? (
							<span>Pending</span>
						) : website.lastStatus === null ? (
							<span>No response (expected {website.expectedStatus})</span>
						) : (
							<span>
								Status: {website.lastStatus} (expected {website.expectedStatus})
							</span>
						)}

						{website.responseTimeMs !== null && <span>Response: {website.responseTimeMs} ms</span>}

						<span>Interval: {website.intervalSeconds} seconds</span>
					</div>

					{error && <span className="website-error">{error}</span>}
				</div>
			</div>

			<div className="website-actions">
				<button className="delete-button" type="button" onClick={handleDelete} disabled={deleting}>
					{deleting ? "Deleting..." : "Delete"}
				</button>
			</div>
		</div>
	);
}
