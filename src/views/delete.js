import { getPost, deletePost } from "../social/posts.js";
import { getProfile } from "../utils/api.js";

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
      <article class="card">
        <h1 class="title">Delete Post</h1>
        <p>Are you sure you want to delete <strong>${post.title ?? "(untitled)"}</strong>?</p>
        <div class="row-gap">
          <button id="confirmDel" class="button danger">Delete</button>
          <a class="button" href="#/post?id=${id}">Cancel</a>
        </div>
      </article>
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
