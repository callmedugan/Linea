import AddWebsiteForm from "../components/AddWebsiteForm";

export default function DashboardPage() {
	return (
		<main>
			<h1>Linea</h1>
			<p>Website Monitoring Dashboard</p>

			<section>
				<h2>Your Websites</h2>
				<p>You haven't added any websites yet.</p>

				<AddWebsiteForm />
			</section>
		</main>
	);
}
