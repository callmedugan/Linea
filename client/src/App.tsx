import { Route, Routes } from "react-router";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import VerifyPage from "./pages/VerifyPage";
import HomeRoute from "./pages/HomeRoute";

export default function App() {
	return (
		<Routes>
			<Route path="/" element={<HomeRoute />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/auth/verify" element={<VerifyPage />} />

			<Route element={<ProtectedRoute />}>
				<Route path="/dashboard" element={<DashboardPage />} />
			</Route>
		</Routes>
	);
}
