import { apiFetch, saveAuth, getApiKey, setApiKey } from "../utils/api.js";

export async function loginUser({ email, password }) {
	const data = await apiFetch("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});

	const token = data?.accessToken ?? data?.data?.accessToken ?? data?.token;

	const profile = data?.profile ?? data?.data ?? data;
	if (!token) {
		console.error("Login response had no accessToken. Full response:", data);
		throw new Error("Login succeeded but no access token was returned.");
	}

	saveAuth({ accessToken: token, profile });
	return { accessToken: token, profile };
}

export async function ensureApiKey() {
	const tokenPresent = !!localStorage.getItem("access_token");
	if (!tokenPresent) throw new Error("Not logged in (no token present).");

	const existing = getApiKey();
	if (existing) return existing;

	const name = import.meta.env.VITE_API_KEY_NAME || "API Key";
	const data = await apiFetch("/auth/create-api-key", {
		method: "POST",
		body: JSON.stringify({ name }),
	});

	setApiKey(data.key);
	return data.key;
}
