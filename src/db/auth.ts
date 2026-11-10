interface User {
	id: string;
	email: string;
}
interface AuthResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	token_type: string;
	user: User;
}

export class SupabaseAuth {
	private baseURL: string;
	private apiKey: string;
	constructor(supabaseUrl: string, supabaseKey: string) {
		this.baseURL = supabaseUrl;
		this.apiKey = supabaseKey;
	}

	public async signInWithPassword(
		email: string,
		password: string,
	): Promise<AuthResponse> {
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

	public async refreshToken(refreshToken: string): Promise<AuthResponse> {
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
	public async getUser(accessToken: string): Promise<User> {
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
	async signOut(accessToken: string): Promise<void> {
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
