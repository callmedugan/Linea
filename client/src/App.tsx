import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";

export default function App() {
	const path = window.location.pathname;

	if (path === "/dashboard") {
		return <DashboardPage />;
	}

	return <LoginPage />;
}
