import { SupabaseAuth } from "./db/auth";
import { AUTH_ENDPOINT, PUBLISHABLE_KEY } from "./db/supabase";

const registerForm = document.getElementById(
	"register-form",
) as HTMLFormElement;
const submitBtn = document.getElementById("form-submit") as HTMLButtonElement;
const authService = new SupabaseAuth(AUTH_ENDPOINT, PUBLISHABLE_KEY);

type StoredSession = {
	access_token?: string;
	expires_at?: number;
};

const isLoggedIn = (): boolean => {
	try {
		const rawSession = localStorage.getItem("supabase_session");
		if (!rawSession) return false;

		const session = JSON.parse(rawSession) as StoredSession | null;
		if (!session?.access_token) return false;

		return (
			typeof session.expires_at !== "number" || session.expires_at > Date.now()
		);
	} catch {
		return false;
	}
};

const MY_MUSICS_URL = new URL("../html/my-musics.html", import.meta.url).href;

window.setInterval(() => {
	if (isLoggedIn()) {
		window.location.href = MY_MUSICS_URL;
	}
}, 2000);

registerForm?.addEventListener("submit", async (e) => {
	e.preventDefault();
	const email = (registerForm.querySelector("#email") as HTMLInputElement)
		?.value;
	const confirmEmail = (
		registerForm.querySelector("#email-confirm") as HTMLInputElement
	)?.value;
	if (email !== confirmEmail) {
		alert("Os emails não são iguais");
		return;
	}
	const password = (registerForm.querySelector("#password") as HTMLInputElement)
		?.value;
	if (password.length < 10 || password.length > 255) {
		alert("A senha deve ter no minimo 10 caracteres e no máximo 255");
		return;
	}
	const fullName = (
		registerForm.querySelector("#nome-completo") as HTMLInputElement
	).value;
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
