import { getProfile } from "../utils/api.js";
import { getProfileByName, listPostsByProfile, followProfile, unfollowProfile } from "../social/profiles.js";
import { ensureApiKey } from "../auth/login.js";

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
	  <a href="#/profile">My Profile</a>
      <a href="#/feed">Feed</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

/**
 * Render a user's profile page, including info, follow/unfollow buttons, and posts.
 * @async
 * @param {HTMLElement} mount - The container element where the profile should be rendered.
 * @param {string} name - The profile name (username) to display.
 * @returns {Promise<void>} Resolves when rendering is complete.
 */

export async function renderProfile(mount, name) {
	await ensureApiKey();
	mount.innerHTML = `${nav()}<div id="profileView">Loading…</div>`;
	const root = document.getElementById("profileView");

	try {
		const profRes = await getProfileByName(name);
		const prof = profRes?.data || profRes;
		const me = getProfile();
		const isMe = me && me.name?.toLowerCase() === String(name).toLowerCase();
		let isFollowing = false;
		const followersArr = prof.followers || prof._followers || [];
		if (Array.isArray(followersArr) && me?.name) {
			const myLower = me.name.toLowerCase();
			isFollowing = followersArr.some((f) => (f?.name || "").toLowerCase() === myLower);
		}

		root.innerHTML = `
      <header class="profile-header">
        ${
			prof.avatar?.url
				? `<img class="avatar" src="${prof.avatar.url}" alt="" onerror="this.remove()">`
				: `<div class="avatar placeholder"></div>`
		}
        <div class="profile-meta>
          <h1 class="title">${escapeHtml(prof.name || name)}</h1>
          ${prof.email ? `<div class="muted">${escapeHtml(prof.email)}</div>` : ""}
          <small id="counts">Followers: ${prof._count?.followers ?? 0} • Following: ${
			prof._count?.following ?? 0
		}</small>
        </div>
        <div class="profile-actions">
          ${
				isMe
					? ""
					: `
            <button id="followBtn" class="button" ${isFollowing ? "hidden" : ""}>Follow</button>
            <button id="unfollowBtn" class="button danger" ${isFollowing ? "" : "hidden"}>Unfollow</button>
          `
			}
        </div>
      </header>

      <section>
        <h2>Posts by ${escapeHtml(prof.name || name)}</h2>
        <ul id="profilePosts" class="feed-list"></ul>
        <div class="pagination">
          <button id="prevBtn">Prev</button>
          <span id="pageLabel"></span>
          <button id="nextBtn">Next</button>
        </div>
      </section>
    `;

		async function refreshCounts() {
			try {
				const latest = await getProfileByName(name);
				const p = latest?.data || latest;
				const counts = document.getElementById("counts");
				if (counts) {
					counts.textContent = `Followers: ${p._count?.followers ?? 0} • Following: ${
						p._count?.following ?? 0
					}`;
				}
			} catch {}
		}

		if (!isMe) {
			const followBtn = document.getElementById("followBtn");
			const unfollowBtn = document.getElementById("unfollowBtn");

			if (followBtn) {
				followBtn.addEventListener("click", async () => {
					try {
						await followProfile(name);
						isFollowing = true;
						followBtn.hidden = true;
						if (unfollowBtn) unfollowBtn.hidden = false;
						refreshCounts();
					} catch (e) {
						alert(e?.message || "Follow failed");
					}
				});
			}

			if (unfollowBtn) {
				unfollowBtn.addEventListener("click", async () => {
					try {
						await unfollowProfile(name);
						isFollowing = false;
						unfollowBtn.hidden = true;
						if (followBtn) followBtn.hidden = false;
						refreshCounts();
					} catch (e) {
						alert(e?.message || "Unfollow failed");
					}
				});
			}
		}

		let page = 1;
		const limit = 10;
		const listEl = document.getElementById("profilePosts");
		const pageLabel = document.getElementById("pageLabel");

		async function load() {
			listEl.innerHTML = "<li>Loading…</li>";
			const res = await listPostsByProfile(name, { page, limit });
			const items = res?.data || res;
			pageLabel.textContent = `Page ${page}`;
			listEl.innerHTML = items.length
				? items
						.map(
							(p) => `
          <li class="card">
            <h3>${escapeHtml(p.title ?? "(untitled)")}</h3>
            ${
				p.media
					? `
              <img src="${p.media.url || p.media}" alt=""
                   loading="lazy" referrerpolicy="no-referrer"
                   onerror="this.remove()" />`
					: ""
			}
            <p>${escapeHtml((p.body || "").slice(0, 160))}${(p.body || "").length > 160 ? "…" : ""}</p>
            <a class="button" onclick="location.hash='#/post?id=${p.id}&owner=${encodeURIComponent(
								prof.name || name
							)}'">Open</a>
          </li>
        `
						)
						.join("")
				: "<li>No posts yet.</li>";
		}

		document.getElementById("prevBtn").onclick = () => {
			if (page > 1) {
				page--;
				load();
			}
		};
		document.getElementById("nextBtn").onclick = () => {
			page++;
			load();
		};

		load();
	} catch (e) {
		console.error(e);
		root.textContent = "Failed to load profile.";
	}
}
