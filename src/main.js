import { getProfile, clearAuth, getApiKey, getToken, clearApiKey } from "./utils/api.js";
import { registerUser } from "./auth/register.js";
import { loginUser, ensureApiKey } from "./auth/login.js";
import { renderFeed } from "./views/feed.js";
import { renderPost } from "./views/post.js";
import { renderEdit } from "./views/edit.js";
import { renderDelete } from "./views/delete.js";
import { renderProfile } from "./views/profile.js";

const app = document.getElementById("app");

(async () => {
	const me = getProfile();
	if (me && getToken() && !getApiKey()) {
		try {
			await ensureApiKey();
		} catch (e) {
			console.warn("API key init failed:", e);
		}
	}
})();

// nav and simple pages
function nav() {
	const me = getProfile();
	return `
    <nav style="display:flex; gap:1rem; margin-bottom:1rem;">
      <a href="#/">Home</a>
	  <a href="#/profile">My Profile</a>
      <a href="#/feed">Feed</a>
      <a href="#/login">Login</a>
      <a href="#/register">Register</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

function HomePage() {
	const me = getProfile();
	return `
    ${nav()}
    <h1>Home</h1>
    ${
		me
			? `
      <p>You're logged in as <strong>@${me.name}</strong>.</p>
      <p><a href="#/feed">Go to the feed</a>.</p>
    `
			: `
      <p>You are not logged in.</p>
      <p><a href="#/register">Create an account</a> or <a href="#/login">Login</a>.</p>
    `
	}
  `;
}

function LoginPage() {
	return `
    ${nav()}
    <h1>Login</h1>
    <form id="loginForm" style="display:grid; gap:.5rem; max-width:320px;">
      <input name="email" type="email" placeholder="you@stud.noroff.no" required />
      <input name="password" type="password" placeholder="Password" required />
      <button>Login</button>
    </form>
  `;
}

function RegisterPage() {
	return `
    ${nav()}
    <h1>Register</h1>
    <form id="registerForm" style="display:grid; gap:.5rem; max-width:320px;">
      <input name="name" placeholder="Username (no spaces)" required />
      <input name="email" type="email" placeholder="you@stud.noroff.no" required />
      <input name="password" type="password" placeholder="Password" required />
      <input name="avatar" type="url" placeholder="Avatar URL (optional)" />
      <button>Create account</button>
    </form>
  `;
}

// router
async function render() {
	const hash = location.hash.slice(1) || "/";
	const [path, qs] = hash.split("?");
	const params = new URLSearchParams(qs || "");
	const me = getProfile();

	if (!me && (path === "/feed" || path === "/post")) {
		location.hash = "/login";
		return;
	}

	if (path === "/login") {
		app.innerHTML = LoginPage();

		document.getElementById("loginForm").addEventListener("submit", async (e) => {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(e.currentTarget));
			try {
				await loginUser(data);
				clearApiKey();
				await ensureApiKey();
				location.hash = "/feed";
			} catch (err) {
				alert(String(err.message || "Login failed"));
			}
		});
	} else if (path === "/register") {
		app.innerHTML = RegisterPage();

		document.getElementById("registerForm").addEventListener("submit", async (e) => {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(e.currentTarget));
			try {
				await registerUser(data);
				await loginUser({ email: data.email, password: data.password });
				clearApiKey();
				await ensureApiKey();
				location.hash = "/feed";
			} catch (err) {
				alert(String(err.message || "Registration failed"));
			}
		});
	} else if (path === "/feed") {
		try {
			await ensureApiKey();
		} catch (e) {
			console.warn("ensureApiKey before feed failed:", e);
		}
		await renderFeed(app);
	} else if (path === "/post") {
		const id = params.get("id");
		if (!id) {
			location.hash = "/feed";
			return;
		}
		await renderPost(app, id);
	} else if (path === "/edit") {
		const id = params.get("id");
		if (!id) {
			location.hash = "/feed";
			return;
		}
		await renderEdit(app, id);
	} else if (path === "/delete") {
		const id = params.get("id");
		if (!id) {
			location.hash = "/feed";
			return;
		}
		await renderDelete(app, id);
	} else if (path === "/profile") {
		const me = getProfile();
		const name = (params.get("name") || me?.name || "").trim();
		if (!name) {
			location.hash = "/login";
			return;
		}
		await renderProfile(app, name);
	} else {
		app.innerHTML = HomePage();
	}

	// logout
	const logoutBtn = document.getElementById("logoutBtn");
	if (logoutBtn) {
		logoutBtn.addEventListener("click", () => {
			clearAuth();
			location.hash = "/login";
		});
	}
}

window.addEventListener("hashchange", render);
render();
