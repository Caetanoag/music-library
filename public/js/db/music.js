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
			headers: this.authHeaders({ Prefer: "return=representation" }),
		});
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${await response.text()}`);
		}
		const data = await response.json();
		if (data.length === 0) {
			throw new Error("Música não encontrada ou sem permissão para excluir");
		}
	}
}
export { MusicDatabase };
