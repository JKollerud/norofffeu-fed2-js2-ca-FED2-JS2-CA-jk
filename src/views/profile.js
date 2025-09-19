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
    <nav style="display:flex; gap:1rem; margin-bottom:1rem;">
      <a href="#/">Home</a>
      <a href="#/feed">Feed</a>
      <a href="#/profile">My Profile</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

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
      <header style="display:flex; gap:1rem; align-items:center; margin-bottom:1rem;">
        ${
			prof.avatar?.url
				? `<img src="${prof.avatar.url}" alt="" width="64" height="64" style="border-radius:50%;object-fit:cover;" onerror="this.remove()">`
				: `<div style="width:64px;height:64px;border-radius:50%;background:#eee;display:inline-block;"></div>`
		}
        <div>
          <h1 style="margin:.25rem 0;">${escapeHtml(prof.name || name)}</h1>
          ${prof.email ? `<div style="opacity:.8">${escapeHtml(prof.email)}</div>` : ""}
          <small id="counts">Followers: ${prof._count?.followers ?? 0} • Following: ${
			prof._count?.following ?? 0
		}</small>
        </div>
        <div style="margin-left:auto; display:flex; gap:.5rem;">
          ${
				isMe
					? ""
					: `
            <button id="followBtn" ${isFollowing ? "hidden" : ""}>Follow</button>
            <button id="unfollowBtn" ${isFollowing ? "" : "hidden"}>Unfollow</button>
          `
			}
        </div>
      </header>

      <section>
        <h2 style="margin:.5rem 0;">Posts by ${escapeHtml(prof.name || name)}</h2>
        <ul id="profilePosts" style="display:grid; gap:.75rem; padding-left:0; list-style:none;"></ul>
        <div style="display:flex; gap:.5rem; margin-top:.75rem;">
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
          <li class="card" style="border:1px solid #ddd; padding:.75rem;">
            <h3 style="margin:.2rem 0;">${escapeHtml(p.title ?? "(untitled)")}</h3>
            ${
				p.media
					? `
              <img src="${p.media.url || p.media}" alt=""
                   loading="lazy" referrerpolicy="no-referrer"
                   onerror="this.remove()" style="max-width:100%;height:auto;" />`
					: ""
			}
            <p>${escapeHtml((p.body || "").slice(0, 160))}${(p.body || "").length > 160 ? "…" : ""}</p>
            <button onclick="location.hash='#/post?id=${p.id}&owner=${encodeURIComponent(
								prof.name || name
							)}'">Open</button>
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
