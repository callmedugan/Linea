import { useEffect, useState } from "react";
import { Navigate } from "react-router";

export default function HomeRoute() {
	const [authenticated, setAuthenticated] = useState<boolean | null>(null);

	useEffect(() => {
		async function checkSession() {
			try {
				const response = await fetch("/api/auth/session");

				setAuthenticated(response.ok);
			} catch {
				setAuthenticated(false);
			}
		}

		checkSession();
	}, []);

	if (authenticated === null) {
		return null;
	}

	return authenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}
