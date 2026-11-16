import { SupabaseAuth } from "./db/auth";
import { AUTH_ENDPOINT, PUBLISHABLE_KEY } from "./db/supabase";

const authForm = document.getElementById("auth-form");
const submitBtn = document.getElementById("form-submit") as HTMLButtonElement;
const authService = new SupabaseAuth(AUTH_ENDPOINT, PUBLISHABLE_KEY);

export type StoredSession = {
	access_token: string;
	refresh_token: string;
	expires_at: number;
	user?: unknown;
};

const isLoggedIn = (): boolean => {
	try {
		const rawSession = localStorage.getItem("supabase_session");
		if (!rawSession) return false;

		const session = JSON.parse(rawSession) as Partial<StoredSession> | null;
		if (!session?.access_token) return false;

		return (
			typeof session.expires_at !== "number" || session.expires_at > Date.now()
		);
	} catch {
		return false;
	}
};

const MY_MUSICS_URL = new URL("../html/my-musics.html", import.meta.url).href;

if (isLoggedIn()) {
	window.location.href = MY_MUSICS_URL;
}

authForm?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const password = (authForm.querySelector("#password") as HTMLInputElement)
		?.value;
	const email = (authForm.querySelector("#email") as HTMLInputElement)?.value;
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
