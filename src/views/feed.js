import { listPosts, createPost } from "../social/posts.js";
import { getProfile, clearApiKey } from "../utils/api.js";
import { ensureApiKey } from "../auth/login.js";

function nav() {
	const me = getProfile();
	return `
    <nav class="nav">
      <a href="#/">Home</a>
	  <a href="#/profile">My Profile</a>
      <a href="#/feed">Feed</a>
      <a href="#/login">Login</a>
      <a href="#/register">Register</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

function layout() {
	return `
    ${nav()}
    <h1>Feed</h1>

    <form id="searchBar" class="search-bar">
      <input name="q" id="q" placeholder="Search posts..." />
      <button>Search</button>
    </form>

    <div id="composer" class="composer">
      <details>
        <summary>Create a new post</summary>
        <form id="createPost" class="create-post-form">
          <input name="title" placeholder="Title" required />
          <textarea name="body" placeholder="Say something..." required></textarea>
          <input name="media" type="url" placeholder="Image URL (optional)" />
          <button>Create</button>
        </form>
      </details>
    </div>

    <ul id="feedList" class="feed-list"></ul>

    <div class="pagination">
      <button id="prev">Prev</button>
      <span id="pageLabel"></span>
      <button id="next">Next</button>
    </div>
  `;
}

/**
 * Escape special HTML characters
 * @param {string} str - The string to escape.
 * @returns {string} Escaped HTML-safe string.
 */

function escapeHtml(str) {
	return String(str)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#039;");
}

/**
 * Render the Feed page
 * Displays posts, search, pagination, and create form.
 * @async
 * @param {HTMLElement} mount - The container element where the feed should be rendered.
 * @returns {Promise<void>} Resolves when rendering is complete.
 */

export async function renderFeed(mount) {
	mount.innerHTML = layout();

	const qInput = document.getElementById("q");
	const feedList = document.getElementById("feedList");
	const pageLabel = document.getElementById("pageLabel");
	const createForm = document.getElementById("createPost");

	let page = 1;
	const limit = 10;

	function renderList(res) {
		const posts = res?.data || res;
		pageLabel.textContent = `Page ${page}`;
		feedList.innerHTML = posts.length
			? posts
					.map((p) => {
						const ownerName = (p.author?.name || p.owner?.name || "").trim();

						return `
          <li class="card">
            <h3>${escapeHtml(p.title ?? "(untitled)")}</h3>
            ${
				p.media
					? `
              <img class="feed-img"
                src="${p.media.url || p.media}"
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
                onerror="this.remove()"
              />`
					: ""
			}
            <p>${escapeHtml((p.body || "").slice(0, 160))}${(p.body || "").length > 160 ? "…" : ""}</p>
<small>
  by <a href="#/profile?name=${encodeURIComponent(ownerName)}">
    ${escapeHtml(ownerName || "unknown")}
  </a>
</small><br/>
<button onclick="location.hash='#/post?id=${p.id}&owner=${encodeURIComponent(ownerName)}'">Open</button>

          </li>
        `;
					})
					.join("")
			: "<li>No posts found.</li>";
	}

	async function load(query = "") {
		feedList.innerHTML = "<li>Loading…</li>";
		try {
			const res = await listPosts({ page, limit, query });
			renderList(res);
		} catch (err) {
			const msg = String(err.message || "");
			if (msg.includes("Invalid API key")) {
				try {
					clearApiKey();
					await ensureApiKey();
					const res = await listPosts({ page, limit, query });
					renderList(res);
					return;
				} catch (e2) {
					console.error(e2);
				}
			}
			console.error(err);
			feedList.innerHTML = "<li>Error loading posts.</li>";
		}
	}

	// events
	document.getElementById("searchBar").addEventListener("submit", (e) => {
		e.preventDefault();
		page = 1;
		load(qInput.value.trim());
	});

	document.getElementById("prev").addEventListener("click", () => {
		if (page > 1) {
			page--;
			load(qInput.value.trim());
		}
	});

	document.getElementById("next").addEventListener("click", () => {
		page++;
		load(qInput.value.trim());
	});

	// create post
	createForm.addEventListener("submit", async (e) => {
		e.preventDefault();
		const data = Object.fromEntries(new FormData(createForm));
		try {
			await createPost(data);
			createForm.reset();
			load(qInput.value.trim());
		} catch (err) {
			const msg = String(err.message || "");
			if (msg.includes("Invalid API key")) {
				try {
					clearApiKey();
					await ensureApiKey();
					await createPost(data);
					createForm.reset();
					load(qInput.value.trim());
					return;
				} catch (e2) {
					alert(String(e2.message || "Create failed"));
					return;
				}
			}
			alert(msg);
		}
	});

	load();
}
