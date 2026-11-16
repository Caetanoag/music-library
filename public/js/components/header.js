// src/db/auth.ts
class SupabaseAuth {
	baseURL;
	apiKey;
	constructor(supabaseUrl, supabaseKey) {
		this.baseURL = supabaseUrl;
		this.apiKey = supabaseKey;
	}
	async signUp(email, password, options) {
		const response = await fetch(`${this.baseURL}/signup`, {
			method: "POST",
			headers: {
				apikey: this.apiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email,
				password,
				...(options?.data && { data: options.data }),
			}),
		});
		if (!response.ok) {
			const errorBody = await response.json();
			throw new Error(
				errorBody.error_description ||
					errorBody.msg ||
					"Falha ao registrar usuário",
			);
		}
		const data = await response.json();
		if (data.access_token) {
			return data;
		}
		return this.signInWithPassword(email, password);
	}
	async signInWithPassword(email, password) {
		const response = await fetch(`${this.baseURL}/token?grant_type=password`, {
			method: "POST",
			headers: {
				apikey: this.apiKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});
		if (!response.ok) {
			const errorBody = await response.json();
			throw new Error(
				errorBody.error_description || errorBody.msg || "Falha no login",
			);
		}
		return response.json();
	}
	async refreshToken(refreshToken) {
		const response = await fetch(
			`${this.baseURL}/token?grant_type=refresh_token`,
			{
				method: "POST",
				headers: {
					apikey: this.apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ refresh_token: refreshToken }),
			},
		);
		if (!response.ok) {
			throw new Error("Falha ao renovar sessão");
		}
		return response.json();
	}
	async getUser(accessToken) {
		const response = await fetch(`${this.baseURL}/user`, {
			method: "GET",
			headers: {
				apikey: this.apiKey,
				Authorization: `Bearer ${accessToken}`,
			},
		});
		if (!response.ok) {
			throw new Error("Falha ao buscar dados do usuário");
		}
		return response.json();
	}
	async signOut(accessToken) {
		const response = await fetch(`${this.baseURL}/logout`, {
			method: "POST",
			headers: {
				apikey: this.apiKey,
				Authorization: `Bearer ${accessToken}`,
			},
		});
		if (!response.ok) {
			throw new Error("Falha ao fazer logout");
		}
	}
}

// src/db/supabase.ts
var BASE_URL = "https://ewvqgwovgwiqbyxbueul.supabase.co";
var PUBLISHABLE_KEY = "sb_publishable_eOVj-675dlsYb_0nnmm52Q_-bImFTii";
var AUTH_ENDPOINT = `${BASE_URL}/auth/v1`;
var REST_ENDPOINT = `${BASE_URL}/rest/v1`;

// src/components/header.ts
class CustomHeader extends HTMLElement {
	connectedCallback() {
		const inHtmlDir = window.location.pathname.includes("/html/");
		const prefix = inHtmlDir ? "./" : "./html/";
		const homeHref = inHtmlDir ? "../index.html" : "./index.html";
		this.innerHTML = `
      <header style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 16px;">
        <div class="header-left">
          <button type="button" id="logout-button">Encerrar sessão</button>
        </div>
        <h1 style="margin:0;font-size:1.25rem;">Your Music Library</h1>
        <nav style="display:flex;gap:12px;">
          <a href="${prefix}my-musics.html">My Musics</a>
          <a href="${prefix}all-musics.html">All Musics</a>
        </nav>
      </header>
    `;
		const logoutButton = this.querySelector("#logout-button");
		logoutButton?.addEventListener("click", async () => {
			try {
				const rawSession = localStorage.getItem("supabase_session");
				const session = rawSession ? JSON.parse(rawSession) : null;
				if (session?.access_token) {
					const auth = new SupabaseAuth(AUTH_ENDPOINT, PUBLISHABLE_KEY);
					await auth.signOut(session.access_token);
				}
			} catch (err) {
				console.error("Erro ao encerrar sessão:", err);
			} finally {
				localStorage.removeItem("supabase_session");
				window.location.href = homeHref;
			}
		});
	}
}
customElements.define("custom-header", CustomHeader);
