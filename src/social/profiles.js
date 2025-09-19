import { apiFetch } from "../utils/api.js";

// get a profile
export function getProfileByName(name) {
	const n = encodeURIComponent(name);
	return apiFetch(`/social/profiles/${n}?_followers=true&_following=true`);
}

// list posts made by profile
export function listPostsByProfile(name, { page = 1, limit = 10 } = {}) {
	const n = encodeURIComponent(name);
	const qs = new URLSearchParams({
		page: String(page),
		limit: String(limit),
		_author: "true",
		_comments: "false",
	});
	return apiFetch(`/social/profiles/${n}/posts?${qs.toString()}`);
}

// follow / unfollow profile
export function followProfile(name) {
	const n = encodeURIComponent(name);
	return apiFetch(`/social/profiles/${n}/follow`, { method: "PUT" });
}
export function unfollowProfile(name) {
	const n = encodeURIComponent(name);
	return apiFetch(`/social/profiles/${n}/unfollow`, { method: "PUT" });
}
