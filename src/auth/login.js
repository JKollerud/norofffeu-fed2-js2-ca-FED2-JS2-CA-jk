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
	const existing = getApiKey();
	if (existing) return existing;

	const name = import.meta.env.VITE_API_KEY_NAME || "API Key";
	const res = await apiFetch("/auth/create-api-key", {
		method: "POST",
		body: JSON.stringify({ name }),
	});

	const key = res?.key ?? res?.data?.key ?? res?.apiKey ?? res?.data?.apiKey;

	if (!key) {
		console.error("create-api-key response:", res);
		throw new Error("API key was not returned by the server.");
	}

	setApiKey(key);
	return key;
}
