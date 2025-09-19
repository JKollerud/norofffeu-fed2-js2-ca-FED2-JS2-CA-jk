import { getPost, deletePost } from "../social/posts.js";
import { getProfile } from "../utils/api.js";

function nav() {
	const me = getProfile();
	return `
    <nav style="display:flex; gap:1rem; margin-bottom:1rem;">
      <a href="#/">Home</a>
      <a href="#/feed">Feed</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

export async function renderDelete(mount, id) {
	mount.innerHTML = `${nav()}<div id="delView">Loading…</div>`;
	const el = document.getElementById("delView");

	try {
		const postRes = await getPost(id);
		const post = postRes?.data || postRes;
		const me = getProfile();
		const owner = post.author?.name || post.owner?.name;

		if (!me || me.name !== owner) {
			el.innerHTML = `<p>You can only delete your own posts.</p><p><a href="#/post?id=${id}">&larr; Back</a></p>`;
			return;
		}

		el.innerHTML = `
      <h1>Delete post</h1>
      <p><strong>Title:</strong> ${post.title ?? "(untitled)"}</p>
      <p>This action cannot be undone.</p>
      <div style="display:flex; gap:.5rem;">
        <button id="confirmDel" style="background:#b00020;color:white;padding:.4rem .75rem;border:0;border-radius:.25rem;">Delete</button>
        <a class="button" href="#/post?id=${id}">Cancel</a>
      </div>
    `;

		document.getElementById("confirmDel").addEventListener("click", async () => {
			if (!confirm("Really delete this post?")) return;
			try {
				await deletePost(id);
				location.hash = "#/feed";
			} catch (err) {
				alert(String(err.message || "Failed to delete"));
			}
		});
	} catch (e) {
		console.error(e);
		el.textContent = "Failed to load post.";
	}
}
