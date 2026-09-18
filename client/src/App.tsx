import { useEffect, useState } from "react";

function App() {
	const [status, setStatus] = useState<string>("Loading...");

	useEffect(() => {
		async function fetchStatus() {
			try {
				const response = await fetch("/api/health");

				if (!response.ok) {
					throw new Error("Failed to fetch status");
				}

				const data = await response.json();
				setStatus(data.status);
			} catch {
				setStatus("Backend unavailable");
			}
		}

		fetchStatus();
	}, []);

	return (
		<div>
			<h1>Linea</h1>
			<p>Backend status: {status}</p>
		</div>
	);
}

export default App;
