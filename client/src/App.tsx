import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import VerifyPage from "./pages/VerifyPage";

export default function App() {
	const path = window.location.pathname;

	if (path === "/auth/verify") {
		return <VerifyPage />;
	}

	if (path === "/dashboard") {
		return <DashboardPage />;
	}

	return <LoginPage />;
}
