import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			//forwards /api calls to localhost
			"/api": "http://localhost:3000",
		},
	},
});
