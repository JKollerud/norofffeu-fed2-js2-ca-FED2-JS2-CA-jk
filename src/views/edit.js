import { getPost, updatePost } from "../social/posts.js";
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

export async function renderEdit(mount, id) {
	mount.innerHTML = `${nav()}<div class="container"><div id="editView">Loading…</div></div>`;
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
      <article class="card">
        <h1 class="title">Edit Post</h1>
        <form id="editForm" class="form-grid">
          <input name="title" placeholder="Title" value="${post.title ?? ""}" />
          <textarea name="body" placeholder="Body">${post.body ?? ""}</textarea>
          <input name="media" type="url" placeholder="Image URL" value="${post.media?.url || post.media || ""}" />
          <div class="row-gap">
            <button class="button" type="submit">Save</button>
            <a class="button" href="#/post?id=${id}">Cancel</a>
          </div>
        </form>
      </article>
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
