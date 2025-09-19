import { getPost, updatePost } from "../social/posts.js";
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

export async function renderEdit(mount, id) {
	mount.innerHTML = `${nav()}<div id="editView">Loading…</div>`;
	const el = document.getElementById("editView");

	try {
		const postRes = await getPost(id);
		const post = postRes?.data || postRes;
		const me = getProfile();
		const owner = post.author?.name || post.owner?.name;
		if (!me || me.name !== owner) {
			el.innerHTML = `<p>You can only edit your own posts.</p><p><a href="#/post?id=${id}">&larr; Back</a></p>`;
			return;
		}

		el.innerHTML = `
      <h1>Edit post</h1>
      <form id="editForm" style="display:grid;gap:.5rem;max-width:480px;">
        <input name="title" value="${post.title ?? ""}" placeholder="Title" required />
        <textarea name="body" placeholder="Body" required>${post.body ?? ""}</textarea>
        <input name="media" type="url" value="${
			post.media?.url || post.media || ""
		}" placeholder="Image URL (optional)" />
        <div style="display:flex; gap:.5rem;">
          <button>Save</button>
          <a class="button" href="#/post?id=${id}">Cancel</a>
        </div>
      </form>
    `;

		document.getElementById("editForm").addEventListener("submit", async (e) => {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(e.currentTarget));
			try {
				await updatePost(id, data);
				location.hash = `#/post?id=${id}`;
			} catch (err) {
				alert(String(err.message || "Failed to update"));
			}
		});
	} catch (e) {
		console.error(e);
		el.textContent = "Failed to load post.";
	}
}
