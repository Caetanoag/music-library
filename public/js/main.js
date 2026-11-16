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

// src/db/music.ts
class MusicDatabase {
	baseURL;
	apiKey;
	constructor(supabaseUrl, supabaseKey) {
		this.baseURL = supabaseUrl.replace(/\/$/, "");
		this.apiKey = supabaseKey;
	}
	getAuthToken() {
		if (typeof window === "undefined") {
			throw new Error("Operação autenticada indisponível fora do navegador");
		}
		try {
			const rawSession = localStorage.getItem("supabase_session");
			const session = rawSession ? JSON.parse(rawSession) : null;
			const token = session?.access_token;
			if (!token) {
				throw new Error("Usuário não autenticado");
			}
			return token;
		} catch (err) {
			if (err instanceof Error && err.message === "Usuário não autenticado") {
				throw err;
			}
			throw new Error("Usuário não autenticado");
		}
	}
	authHeaders(extra) {
		const token = this.getAuthToken();
		return {
			apikey: this.apiKey,
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			...extra,
		};
	}
	async getMusicLibrary(userId = null) {
		const filter =
			userId !== null ? `&added_by=eq.${encodeURIComponent(userId)}` : "";
		const url = `${this.baseURL}/songs?select=*${filter}`;
		const response = await fetch(url, {
			method: "GET",
			headers: this.authHeaders(),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}
		return await response.json();
	}
	async getMusicById(id) {
		const url = `${this.baseURL}/songs?select=*&id=eq.${encodeURIComponent(id)}`;
		const response = await fetch(url, {
			method: "GET",
			headers: this.authHeaders(),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}
		const data = await response.json();
		return data[0] ?? null;
	}
	async createMusic(music) {
		const response = await fetch(`${this.baseURL}/songs`, {
			method: "POST",
			headers: this.authHeaders({ Prefer: "return=representation" }),
			body: JSON.stringify(music),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}
		const data = await response.json();
		const created = data[0];
		if (!created) {
			throw new Error("Falha ao criar música");
		}
		return created;
	}
	async updateMusic(id, updates) {
		const url = `${this.baseURL}/songs?id=eq.${encodeURIComponent(id)}`;
		const response = await fetch(url, {
			method: "PATCH",
			headers: this.authHeaders({ Prefer: "return=representation" }),
			body: JSON.stringify(updates),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}
		const data = await response.json();
		const updated = data[0];
		if (!updated) {
			throw new Error("Música não encontrada");
		}
		return updated;
	}
	async deleteMusic(id) {
		const url = `${this.baseURL}/songs?id=eq.${encodeURIComponent(id)}`;
		const response = await fetch(url, {
			method: "DELETE",
			headers: this.authHeaders(),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}
	}
}

// src/all-musics.ts
var renderMusics = (container, musics) => {
	if (musics.length === 0) {
		container.innerHTML = "<p>Nenhuma música encontrada no banco.</p>";
		return;
	}
	container.innerHTML = musics
		.map((music) => {
			const artist = music.artist.replace(/"/g, "&quot;");
			const title = music.title.replace(/"/g, "&quot;");
			const album = (music.album ?? "").replace(/"/g, "&quot;");
			return `<music-card artist="${artist}" name="${title}" album="${album}"></music-card>`;
		})
		.join("");
};
document.addEventListener("DOMContentLoaded", async () => {
	const container = document.getElementById("music-list");
	const status = document.getElementById("status");
	if (!container) return;
	try {
		const db = new MusicDatabase(REST_ENDPOINT, PUBLISHABLE_KEY);
		const musics = await db.getMusicLibrary();
		if (status) status.textContent = "";
		renderMusics(container, musics);
	} catch (err) {
		console.error("Erro ao carregar músicas:", err);
		const message =
			err instanceof Error ? err.message : "Erro ao carregar músicas";
		if (status) {
			status.textContent = message;
		} else {
			container.innerHTML = `<p>${message}</p>`;
		}
		if (message.toLowerCase().includes("não autenticado")) {
			window.location.href = "../index.html";
		}
	}
});

// src/my-musics.ts
var getSessionUserId = () => {
	const rawSession = localStorage.getItem("supabase_session");
	const session = rawSession ? JSON.parse(rawSession) : null;
	const userId = session?.user?.id;
	if (!userId) {
		throw new Error("Usuário não autenticado");
	}
	return userId;
};
var escapeHtml = (value) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
var renderMusics2 = (container, musics) => {
	if (musics.length === 0) {
		container.innerHTML = "<p>Você ainda não adicionou músicas.</p>";
		return;
	}
	container.innerHTML = musics
		.map((music) => {
			const artist = escapeHtml(music.artist);
			const title = escapeHtml(music.title);
			const album = escapeHtml(music.album ?? "");
			return `
				<article class="music-item" data-id="${music.id}">
					<div class="music-item__info">
						<strong>${title}</strong>
						<div>${artist}</div>
						<div>${album || "<em>Sem álbum</em>"}</div>
					</div>
					<div class="music-item__actions">
						<button type="button" data-action="edit" data-id="${music.id}">Editar</button>
						<button type="button" data-action="delete" data-id="${music.id}">Excluir</button>
					</div>
				</article>
			`;
		})
		.join("");
};
document.addEventListener("DOMContentLoaded", async () => {
	const listEl = document.getElementById("music-list");
	const statusEl = document.getElementById("status");
	const form = document.getElementById("music-form");
	const titleInput = document.getElementById("title");
	const artistInput = document.getElementById("artist");
	const albumInput = document.getElementById("album");
	const idInput = document.getElementById("music-id");
	const submitButton = document.getElementById("submit-button");
	const cancelEditButton = document.getElementById("cancel-edit");
	const formTitle = document.getElementById("form-title");
	if (!listEl || !form || !titleInput || !artistInput || !albumInput) return;
	const db = new MusicDatabase(REST_ENDPOINT, PUBLISHABLE_KEY);
	let musics = [];
	let userId = "";
	const setStatus = (message, isError = false) => {
		if (!statusEl) return;
		statusEl.textContent = message;
		statusEl.style.color = isError ? "#b00020" : "";
	};
	const resetForm = () => {
		form.reset();
		if (idInput) idInput.value = "";
		if (submitButton) submitButton.textContent = "Adicionar música";
		if (cancelEditButton) cancelEditButton.hidden = true;
		if (formTitle) formTitle.textContent = "Nova música";
	};
	const loadMusics = async () => {
		setStatus("Carregando suas músicas...");
		musics = await db.getMusicLibrary(userId);
		setStatus("");
		renderMusics2(listEl, musics);
	};
	try {
		userId = getSessionUserId();
		await loadMusics();
	} catch (err) {
		console.error("Erro ao carregar músicas:", err);
		const message =
			err instanceof Error ? err.message : "Erro ao carregar músicas";
		setStatus(message, true);
		if (message.toLowerCase().includes("não autenticado")) {
			window.location.href = "../index.html";
		}
		return;
	}
	form.addEventListener("submit", async (event) => {
		event.preventDefault();
		const title = titleInput.value.trim();
		const artist = artistInput.value.trim();
		const albumValue = albumInput.value.trim();
		const album = albumValue === "" ? null : albumValue;
		const editingId = idInput?.value;
		if (!title || !artist) {
			setStatus("Título e artista são obrigatórios.", true);
			return;
		}
		try {
			if (submitButton) submitButton.disabled = true;
			if (editingId) {
				setStatus("Salvando alterações...");
				await db.updateMusic(editingId, { title, artist, album });
				setStatus("Música atualizada com sucesso.");
			} else {
				setStatus("Adicionando música...");
				await db.createMusic({ title, artist, album, added_by: userId });
				setStatus("Música adicionada com sucesso.");
			}
			resetForm();
			await loadMusics();
		} catch (err) {
			console.error("Erro ao salvar música:", err);
			const message =
				err instanceof Error ? err.message : "Erro ao salvar música";
			setStatus(message, true);
		} finally {
			if (submitButton) submitButton.disabled = false;
		}
	});
	cancelEditButton?.addEventListener("click", () => {
		resetForm();
		setStatus("");
	});
	listEl.addEventListener("click", async (event) => {
		const target = event.target;
		const button = target.closest("button[data-action]");
		if (!button) return;
		const action = button.dataset.action;
		const id = button.dataset.id;
		if (!id) return;
		if (action === "edit") {
			const music = musics.find((m) => m.id === id);
			if (!music) return;
			titleInput.value = music.title;
			artistInput.value = music.artist;
			albumInput.value = music.album ?? "";
			if (idInput) idInput.value = music.id;
			if (submitButton) submitButton.textContent = "Salvar alterações";
			if (cancelEditButton) cancelEditButton.hidden = false;
			if (formTitle) formTitle.textContent = "Editar música";
			titleInput.focus();
			return;
		}
		if (action === "delete") {
			const music = musics.find((m) => m.id === id);
			const label = music ? `"${music.title}"` : "esta música";
			if (!window.confirm(`Excluir ${label}?`)) return;
			try {
				setStatus("Excluindo música...");
				await db.deleteMusic(id);
				if (idInput?.value === id) resetForm();
				setStatus("Música excluída com sucesso.");
				await loadMusics();
			} catch (err) {
				console.error("Erro ao excluir música:", err);
				const message =
					err instanceof Error ? err.message : "Erro ao excluir música";
				setStatus(message, true);
			}
		}
	});
});

// src/main.ts
var MY_MUSICS_URL = new URL("../html/my-musics.html", import.meta.url).href;
var isAuthPage = () => {
	const { pathname } = window.location;
	return (
		pathname.endsWith("/") ||
		pathname.endsWith("/index.html") ||
		pathname.endsWith("/register.html")
	);
};
var isLoggedIn = () => {
	try {
		const rawSession = localStorage.getItem("supabase_session");
		if (!rawSession) return false;
		const session = JSON.parse(rawSession);
		if (!session?.access_token) return false;
		return (
			typeof session.expires_at !== "number" || session.expires_at > Date.now()
		);
	} catch {
		return false;
	}
};
if (isAuthPage()) {
	window.setInterval(() => {
		if (isLoggedIn()) {
			window.location.href = MY_MUSICS_URL;
		}
	}, 2000);
}
