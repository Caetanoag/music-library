import "./components/music-card";
import { MusicDatabase } from "./db/music";
import { PUBLISHABLE_KEY, REST_ENDPOINT } from "./db/supabase";

const renderMusics = (
	container: HTMLElement,
	musics: { artist: string; title: string; album: string | null }[],
) => {
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
