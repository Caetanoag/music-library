import "./components/music-card";
import { MusicDatabase } from "./db/music";
import { PUBLISHABLE_KEY, REST_ENDPOINT } from "./db/supabase";

type SessionUser = {
	id?: string;
	email?: string;
	user_metadata?: { full_name?: string };
};

const getSessionUser = (): SessionUser | null => {
	try {
		const rawSession = localStorage.getItem("supabase_session");
		const session = rawSession ? JSON.parse(rawSession) : null;
		return (session?.user as SessionUser) ?? null;
	} catch {
		return null;
	}
};

const renderMusics = (
	container: HTMLElement,
	musics: {
		artist: string;
		title: string;
		album: string | null;
		added_by: string;
	}[],
	currentUser: SessionUser | null,
) => {
	if (musics.length === 0) {
		container.innerHTML = "<p>Nenhuma música encontrada no banco.</p>";
		return;
	}

	const currentName =
		currentUser?.user_metadata?.full_name || currentUser?.email || "Você";

	container.innerHTML = musics
		.map((music) => {
			const artist = music.artist.replace(/"/g, "&quot;");
			const title = music.title.replace(/"/g, "&quot;");
			const album = (music.album ?? "").replace(/"/g, "&quot;");
			const addedByName =
				currentUser?.id && music.added_by === currentUser.id
					? currentName
					: "Desconhecido";
			const addedByNameAttr = addedByName.replace(/"/g, "&quot;");
			return `<music-card artist="${artist}" name="${title}" album="${album}" added-by-name="${addedByNameAttr}"></music-card>`;
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
		const currentUser = getSessionUser();

		if (status) status.textContent = "";
		renderMusics(container, musics, currentUser);
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
