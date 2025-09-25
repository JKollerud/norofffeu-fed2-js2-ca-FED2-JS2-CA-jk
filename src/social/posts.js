import { apiFetch } from "../utils/api.js";

// listing posts
export async function listPosts({ page = 1, limit = 10, query = "" } = {}) {
	const q = String(query || "").trim();
	const baseParams = `_author=true&_comments=true&limit=${limit}&page=${page}`;
	const url = q ? `/social/posts/search?q=${encodeURIComponent(q)}&${baseParams}` : `/social/posts?${baseParams}`;
	return await apiFetch(url);
}

// single post id
export async function getPost(id) {
	return await apiFetch(`/social/posts/${id}?_author=true&_comments=true`);
}

// create new post
export async function createPost({ title, body, media }) {
	const payload = { title, body };
	if (media) payload.media = { url: media, alt: "post image" };
	return await apiFetch("/social/posts", {
		method: "POST",
		body: JSON.stringify(payload),
	});
}

// update own post
export async function updatePost(id, { title, body, media }) {
	const payload = { title, body };
	if (media) payload.media = { url: media, alt: "post image" };
	return await apiFetch(`/social/posts/${id}`, {
		method: "PUT",
		body: JSON.stringify(payload),
	});
}

// delete own post
export async function deletePost(id) {
	return await apiFetch(`/social/posts/${id}`, { method: "DELETE" });
}
