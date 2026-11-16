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
var renderMusics = (container, musics) => {
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
		renderMusics(listEl, musics);
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
