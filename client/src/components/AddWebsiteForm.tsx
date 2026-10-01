import { useState, type FormEventHandler } from "react";

const inputClasses =
	"min-w-0 w-full rounded-lg border border-[#e5e4e7] bg-white px-3 py-2.5 text-sm text-[#08060d] outline-none transition placeholder:text-[#6b6375]/65 focus:border-[#aa3bff] focus:ring-3 focus:ring-[#aa3bff]/10 disabled:opacity-60 dark:border-[#2e303a] dark:bg-[#191a21] dark:text-gray-100 dark:placeholder:text-gray-400/65 dark:focus:border-[#c084fc] dark:focus:ring-[#c084fc]/10";

type AddWebsiteFormProps = {
	onWebsiteAdded: () => Promise<void>;
};

export default function AddWebsiteForm({ onWebsiteAdded }: AddWebsiteFormProps) {
	const [url, setUrl] = useState("");
	const [expectedStatus, setExpectedStatus] = useState("200");
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
					expectedStatus: Number(expectedStatus),
				}),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error ?? "Failed to add website");
			}

			setUrl("");
			setExpectedStatus("200");

			await onWebsiteAdded();
		} catch (error) {
			setError(error instanceof Error ? error.message : "Failed to add website");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="border-t border-[#e5e4e7] bg-[#faf9fb] p-4 sm:p-6 dark:border-[#2e303a] dark:bg-[#15161c]" onSubmit={handleSubmit}>
			<div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_8rem_auto]">
				<div className="min-w-0">
					<label htmlFor="website-url" className="mb-1.5 block text-xs font-medium text-[#6b6375] dark:text-gray-400">
						URL
					</label>

					<input
						id="website-url"
						type="url"
						value={url}
						onChange={(event) => setUrl(event.target.value)}
						placeholder="https://example.com"
						required
						disabled={loading}
						className={inputClasses}
					/>
				</div>

				<div>
					<label htmlFor="expected-status" className="mb-1.5 block text-xs font-medium text-[#6b6375] dark:text-gray-400">
						Expected status
					</label>

					<input
						id="expected-status"
						type="text"
						inputMode="numeric"
						pattern="[1-5][0-9]{2}"
						maxLength={3}
						value={expectedStatus}
						onChange={(event) => {
							const value = event.target.value;

							if (/^\d{0,3}$/.test(value)) {
								setExpectedStatus(value);
							}
						}}
						placeholder="200"
						required
						disabled={loading}
						className={inputClasses}
					/>
				</div>

				<button
					type="submit"
					disabled={loading}
					className="min-h-10 cursor-pointer rounded-lg border border-[#aa3bff]/20 bg-[#aa3bff]/10 px-4 py-2.5 text-sm font-medium text-[#9225e8] transition hover:border-[#aa3bff]/35 hover:bg-[#aa3bff]/15 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 dark:border-[#c084fc]/20 dark:bg-[#c084fc]/10 dark:text-[#d8b4fe] dark:hover:border-[#c084fc]/35 dark:hover:bg-[#c084fc]/15"
				>
					{loading ? "Adding..." : "Add Website"}
				</button>
			</div>

			{error && <p className="mt-3 mb-0 text-sm text-red-500">{error}</p>}
		</form>
	);
}
