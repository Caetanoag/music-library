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
var getTrackInfo = async (artist, name) => {
	const query = `${encodeURIComponent(artist)}+${encodeURIComponent(name)}`;
	const response = await fetch(
		`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`,
	);
	const data = await response.json();
	const track = data.results[0];
	return {
		cover: track?.artworkUrl100?.replace("100x100bb", "600x600bb") || "",
		album: track?.collectionName || "",
	};
};

class MusicCard extends HTMLElement {
	async connectedCallback() {
		const artist = this.getAttribute("artist") || "";
		const name = this.getAttribute("name") || "";
		const album = this.getAttribute("album") || "";
		this.innerHTML = `
            <div class="music-card">
                <h2>${name}</h2>
                <h3 class="artist">${artist}</h3>
                <h3 class="album">${album}</h3>
                <img src="" alt="Album cover" />
            </div>
        `;
		if (artist && name) {
			const info = await getTrackInfo(artist, name);
			const img = this.querySelector("img");
			if (img && info.cover) {
				img.src = info.cover;
			}
			if (!album && info.album) {
				const albumEl = this.querySelector(".album");
				if (albumEl) albumEl.textContent = info.album;
			}
		}
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

// src/auth.register.ts
var registerForm = document.getElementById("register-form");
var submitBtn2 = document.getElementById("form-submit");
var authService2 = new SupabaseAuth(AUTH_ENDPOINT, PUBLISHABLE_KEY);
registerForm?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const email = registerForm.querySelector("#email")?.value;
	const confirmEmail = registerForm.querySelector("#email-confirm")?.value;
	if (email !== confirmEmail) {
		alert("Os emails não são iguais");
		return;
	}
	const password = registerForm.querySelector("#password")?.value;
	if (password.length < 10 || password.length > 255) {
		alert("A senha deve ter no minimo 10 caracteres e no máximo 255");
		return;
	}
	const fullName = registerForm.querySelector("#nome-completo").value;
	if (!fullName) {
		alert("Por favor, insira seu nome completo");
		return;
	}
	try {
		if (submitBtn2) {
			submitBtn2.disabled = true;
			submitBtn2.textContent = "Registrando...";
			const registerResponse = await authService2.signUp(email, password, {
				data: {
					full_name: fullName,
				},
			});
			const session = {
				access_token: registerResponse.access_token,
				refresh_token: registerResponse.refresh_token,
				expires_at: Date.now() + registerResponse.expires_in * 1000,
			};
			localStorage.setItem("supabase_session", JSON.stringify(session));
			console.log("Registro realizado");
			alert("Registro realizado com sucesso. Você já está logado");
		}
	} catch (err) {
		console.log("Erro ao registrar usuário:", err);
		alert(
			"Erro ao registrar. Tente novamente mais tarde. Para reportar problemas, acesse https://github.com/Caetanoag/music-library/issues",
		);
	} finally {
		submitBtn2.disabled = false;
		submitBtn2.textContent = "Criar conta";
	}
});
