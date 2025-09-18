import { getProfile, clearAuth, getApiKey, getToken } from "./utils/api.js";
import { registerUser } from "./auth/register.js";
import { loginUser, ensureApiKey } from "./auth/login.js";

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

// Nav
function nav() {
	const me = getProfile();
	return `
    <nav style="display:flex; gap:1rem; margin-bottom:1rem;">
      <a href="#/">Home</a>
      <a href="#/login">Login</a>
      <a href="#/register">Register</a>
      ${me ? `<button id="logoutBtn">Logout (${me.name})</button>` : ""}
    </nav>
  `;
}

// Pages
function HomePage() {
	const me = getProfile();
	return `
    ${nav()}
    <h1>Home</h1>
    ${
		me
			? `
      <p>You're logged in as <strong>@${me.name}</strong>.</p>
      <p>Next step: build the feed page.</p>
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

// Router/Render
async function render() {
	const path = location.hash.slice(1) || "/";
	const me = getProfile();

	if (me && (path === "/login" || path === "/register")) {
		location.hash = "/";
		return;
	}

	if (path === "/login") {
		app.innerHTML = LoginPage();

		document.getElementById("loginForm").addEventListener("submit", async (e) => {
			e.preventDefault();
			const data = Object.fromEntries(new FormData(e.currentTarget));
			try {
				await loginUser(data);
				await ensureApiKey();
				location.hash = "/";
			} catch (err) {
				const msg = String(err.message || "");
				if (msg.includes("401")) {
					alert("Invalid email or password. Please try again.");
				} else {
					alert(msg);
				}
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
				await ensureApiKey();
				location.hash = "/";
			} catch (err) {
				const msg = String(err.message || "");
				if (msg.includes("Profile already exists") || msg.includes("exists")) {
					alert(
						"That username or email is already registered. Try logging in or choose a different username."
					);
				} else {
					alert(msg);
				}
			}
		});
	} else {
		app.innerHTML = HomePage();
	}

	// Logout Button
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
