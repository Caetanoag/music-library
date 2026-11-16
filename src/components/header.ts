import { SupabaseAuth } from "../db/auth";
import { AUTH_ENDPOINT, PUBLISHABLE_KEY } from "../db/supabase";

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

		const logoutButton = this.querySelector<HTMLButtonElement>("#logout-button");
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
