// src/components/footer.ts
class CustomFooter extends HTMLElement {
	constructor() {
		super();
		this.innerHTML = `
            <footer>
                <p>Custom Footer</p>
            </footer>
        `;
	}
}
customElements.define("custom-footer", CustomFooter);

// src/components/header.ts
class CustomHeader extends HTMLElement {
	constructor() {
		super();
		this.innerHTML = `
      <header>
        <h1> Your Music Library <h1>
        <nav>
          <a href='./html/my-musics.html'>My Musics</a>
          <a href='./html/favorite-artists.html'>Favorite Artists</a>
        </nav>
      </header>
    `;
	}
}
customElements.define("custom-header", CustomHeader);

// src/components/music-card.ts
class MusicCard extends HTMLElement {
	artist;
	name;
	album;
	constructor(artist, name, album) {
		super();
		this.name = name;
		this.artist = artist;
		this.album = album;
		this.innerHTML = `
            <div class="music-card">
                <h2> ${name} <h2>
                <h3> ${artist} - ${album}<h3>
            </div>
        `;
	}
}
customElements.define("music-card", MusicCard);

// src/db/auth.ts
class SupabaseAuth {
	baseURL;
	apiKey;
	constructor(supabaseUrl, supabaseKey) {
		this.baseURL = supabaseUrl;
		this.apiKey = supabaseKey;
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

// src/auth.login.ts
var authForm = document.getElementById("auth-form");
var submitBtn = document.getElementById("form-submit");
var authService = new SupabaseAuth(AUTH_ENDPOINT, PUBLISHABLE_KEY);
authForm?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const password = authForm.querySelector("#password")?.value;
	const email = authForm.querySelector("#email")?.value;
	if (!email || !password) {
		alert("Todos os campos precisam ser preenchidos");
		return;
	}
	try {
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.textContent = "Entrando...";
			const authResponse = await authService.signInWithPassword(
				email,
				password,
			);
			const session = {
				access_token: authResponse.access_token,
				refresh_token: authResponse.refresh_token,
				expires_at: Date.now() + authResponse.expires_in * 1000,
			};
			localStorage.setItem("supabase_session", JSON.stringify(session));
			console.log("Login realizado.");
		}
	} catch (error) {
		console.error("Erro no login:", error);
		alert("Falha no login: Verifique seu e-mail e senha.");
	} finally {
		if (submitBtn) {
			submitBtn.disabled = false;
			submitBtn.textContent = "Login";
		}
	}
});
