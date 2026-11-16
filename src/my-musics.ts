import { MusicDatabase, type Music } from "./db/music";
import { PUBLISHABLE_KEY, REST_ENDPOINT } from "./db/supabase";

const getSessionUserId = (): string => {
	const rawSession = localStorage.getItem("supabase_session");
	const session = rawSession ? JSON.parse(rawSession) : null;
	const userId = session?.user?.id;
	if (!userId) {
		throw new Error("Usuário não autenticado");
	}
	return userId;
};

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

const renderMusics = (container: HTMLElement, musics: Music[]): void => {
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
	const form = document.getElementById("music-form") as HTMLFormElement | null;
	const titleInput = document.getElementById(
		"title",
	) as HTMLInputElement | null;
	const artistInput = document.getElementById(
		"artist",
	) as HTMLInputElement | null;
	const albumInput = document.getElementById(
		"album",
	) as HTMLInputElement | null;
	const idInput = document.getElementById(
		"music-id",
	) as HTMLInputElement | null;
	const submitButton = document.getElementById(
		"submit-button",
	) as HTMLButtonElement | null;
	const cancelEditButton = document.getElementById(
		"cancel-edit",
	) as HTMLButtonElement | null;
	const formTitle = document.getElementById("form-title");

	if (!listEl || !form || !titleInput || !artistInput || !albumInput) return;

	const db = new MusicDatabase(REST_ENDPOINT, PUBLISHABLE_KEY);
	let musics: Music[] = [];
	let userId = "";

	const setStatus = (message: string, isError = false) => {
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
		const target = event.target as HTMLElement;
		const button = target.closest<HTMLButtonElement>("button[data-action]");
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
