// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			input: "index.html", // SPA: only one entry
		},
	},
});
