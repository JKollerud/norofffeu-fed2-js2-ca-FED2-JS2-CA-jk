import { apiFetch } from "../utils/api.js";

export async function registerUser({ name, email, password, avatar }) {
	const payload = { name, email, password };

	const url = (avatar || "").trim();
	if (url) {
		payload.avatar = { url, alt: `${name}'s avatar` };
	}

	return apiFetch("/auth/register", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}
