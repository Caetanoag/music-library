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

// src/auth.register.ts
var registerForm = document.getElementById("register-form");
var submitBtn = document.getElementById("form-submit");
var authService = new SupabaseAuth(AUTH_ENDPOINT, PUBLISHABLE_KEY);
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
		if (submitBtn) {
			submitBtn.disabled = true;
			submitBtn.textContent = "Registrando...";
			const registerResponse = await authService.signUp(email, password, {
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
		submitBtn.disabled = false;
		submitBtn.textContent = "Criar conta";
	}
});
