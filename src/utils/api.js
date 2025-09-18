const API_BASE = (import.meta.env.VITE_API_BASE || "https://v2.api.noroff.dev").replace(/\/$/, "");

const TOKEN_KEY = "access_token";
const API_KEY_KEY = "api_key";
const PROFILE_KEY = "profile";

export function saveAuth({ accessToken, profile }) {
	if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
	if (profile) localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function getToken() {
	return localStorage.getItem(TOKEN_KEY);
}

export function getProfile() {
	try {
		return JSON.parse(localStorage.getItem(PROFILE_KEY) || "null");
	} catch {
		return null;
	}
}

export function clearAuth() {
	localStorage.removeItem(TOKEN_KEY);
	localStorage.removeItem(API_KEY_KEY);
	localStorage.removeItem(PROFILE_KEY);
}

export function getApiKey() {
	return localStorage.getItem(API_KEY_KEY);
}

export function setApiKey(key) {
	localStorage.setItem(API_KEY_KEY, key);
}

function authHeaders() {
	const h = { "Content-Type": "application/json" };
	const token = getToken();
	const apiKey = getApiKey();
	if (token) h.Authorization = `Bearer ${token}`;
	if (apiKey) h["X-Noroff-API-Key"] = apiKey;
	return h;
}

export async function apiFetch(path, options = {}) {
	const res = await fetch(`${API_BASE}${path}`, {
		...options,
		headers: { ...authHeaders(), ...(options.headers || {}) },
	});

	if (!res.ok) {
		const text = await res.text().catch(() => "");
		let message = `${res.status} ${res.statusText}`;
		try {
			const j = JSON.parse(text);
			const details = j.errors?.map((e) => e.message).join("; ") || j.message;
			if (details) message += `: ${details}`;
		} catch {
			if (text) message += `: ${text}`;
		}
		throw new Error(message);
	}

	if (res.status === 204) return null;
	return res.json();
}
