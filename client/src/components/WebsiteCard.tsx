import { useState } from "react";
import type { CheckError, Website } from "../types";

type WebsiteCardProps = {
	website: Website;
	onDeleted: () => Promise<void>;
};

const errorMessages: Record<CheckError, string> = {
	timeout: "Request timed out",
	dns: "DNS lookup failed",
	connection: "Connection failed",
	tls: "TLS/certificate error",
	blocked: "Blocked by security policy",
	network: "Network request failed",
	unknown: "Unknown error",
};

export default function WebsiteCard({ website, onDeleted }: WebsiteCardProps) {
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState("");

	const isPending = website.lastStatus === 0;
	const isUp = website.lastStatus === website.expectedStatus;

	const statusDotClass = isPending ? "bg-gray-400" : isUp ? "bg-green-500" : "bg-red-500";

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
		<div className="flex flex-col gap-4 rounded-lg px-3.5 py-3 transition-colors hover:bg-[#faf9fb] sm:flex-row sm:items-center sm:justify-between dark:hover:bg-[#15161c]">
			<div className="min-w-0 flex-1">
				{/* Row 1: URL + status dot */}
				<div className="flex min-w-0 items-center gap-2">
					<span className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDotClass}`} aria-hidden="true" />
					<p className="m-0 min-w-0 break-all font-mono text-sm text-[#08060d] sm:truncate dark:text-gray-100">{website.url}</p>
				</div>

				{/* Row 2: status OR error */}
				<p className={`mt-1 mb-0 text-xs sm:text-[13px] ${website.lastError ? "text-red-500" : "text-[#6b6375] dark:text-gray-400"}`}>
					{website.lastError
						? errorMessages[website.lastError]
						: isPending
							? "Pending"
							: website.lastStatus === null
								? `No response (expected ${website.expectedStatus})`
								: `Status: ${website.lastStatus} (expected ${website.expectedStatus})`}
				</p>

				{/* Row 3: response time */}
				<p className="mt-1 mb-0 text-xs text-[#6b6375] sm:text-[13px] dark:text-gray-400">
					Response: {website.responseTimeMs !== null ? `${website.responseTimeMs} ms` : "—"}
				</p>

				{error && <p className="mt-1 mb-0 text-xs text-red-500">{error}</p>}
			</div>

			<button
				className="min-h-10 w-full shrink-0 cursor-pointer rounded-md border border-[#e5e4e7] bg-transparent px-3 py-2 text-sm text-red-500 transition hover:border-red-500/35 hover:bg-red-500/8 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0 sm:w-auto sm:py-1.5 sm:text-[13px] dark:border-[#2e303a]"
				type="button"
				onClick={handleDelete}
				disabled={deleting}
			>
				{deleting ? "Deleting..." : "Delete"}
			</button>
		</div>
	);
}
