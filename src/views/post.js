import { getPost } from "../social/posts.js";
import { getProfile } from "../utils/api.js";

function escapeHtml(str) {
	return String(str ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function nav() {
	const me = getProfile();
	return `
    <nav class="nav">
      <a href="#/">Home</a>
      <a href="#/feed">Feed</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

/**
 * Render a single post
 * @param {HTMLElement} mount - container element
 * @param {string|number} id - post id
 */
export async function renderPost(mount, id) {
	mount.innerHTML = `${nav()}<div id="postView">Loading…</div>`;
	const target = document.getElementById("postView");

	try {
		const postRes = await getPost(id);
		const post = postRes?.data || postRes;
		const postId = Number(post?.id ?? id);
		const me = getProfile();
		const qs = new URLSearchParams(location.hash.split("?")[1] || "");
		const hintedOwner = (qs.get("owner") || "").toLowerCase();
		const author = post.author ?? post.owner ?? post.user ?? {};
		const authorName = (author.name ?? "").toLowerCase();
		const authorEmail = (author.email ?? "").toLowerCase();
		const authorId = author.id;
		const myName = (me?.name ?? "").toLowerCase();
		const myEmail = (me?.email ?? "").toLowerCase();
		const myId = me?.id;
		const mine =
			(!!authorName && authorName === myName) ||
			(!!authorEmail && !!myEmail && authorEmail === myEmail) ||
			(!!authorId && !!myId && authorId === myId) ||
			(!!hintedOwner && hintedOwner === myName);
		const ownerLabel = author.name || authorEmail || hintedOwner || "unknown";
		const isMe = myName && ownerLabel.toLowerCase() === myName;
		target.innerHTML = `
  <article class="card">
    <h1>${escapeHtml(post.title ?? "(untitled)")}</h1>
    ${
		post.media
			? `<img src="${post.media?.url || post.media}"
                 alt=""
                 loading="lazy"
                 referrerpolicy="no-referrer"
                 onerror="this.remove()" />`
			: ""
	}
    <p>${escapeHtml(post.body ?? "")}</p>
    <p class="muted">by ${escapeHtml(ownerLabel)}</p>

    ${
		!isMe && ownerLabel && ownerLabel !== "unknown"
			? `
      <div class="block-gap">
        <a href="#/profile?name=${encodeURIComponent(ownerLabel)}">View profile</a>
      </div>`
			: ""
	}

    ${
		mine
			? `
      <div class="row-gap">
        <a class="button" href="#/edit?id=${postId}">Edit</a>
        <a class="button" href="#/delete?id=${postId}" style="color:#b00020;">Delete</a>
      </div>`
			: ""
	}

    <p class="block-gap">
      <a href="#/feed">&larr; Back to feed</a>
    </p>
  </article>
`;
	} catch (e) {
		console.error(e);
		target.textContent = "Could not load post.";
	}
}
