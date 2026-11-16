import "./components/footer";
import "./components/header";
import "./components/music-card";
import "./auth.login";
import "./auth.register";
import "./all-musics";
import "./my-musics";

type StoredSession = {
	access_token?: string;
	expires_at?: number;
	user?: { id?: string };
};

const MY_MUSICS_URL = new URL("../html/my-musics.html", import.meta.url).href;

const isAuthPage = (): boolean => {
	const { pathname } = window.location;
	return (
		pathname.endsWith("/") ||
		pathname.endsWith("/index.html") ||
		pathname.endsWith("/register.html")
	);
};

const isLoggedIn = (): boolean => {
	try {
		const rawSession = localStorage.getItem("supabase_session");
		if (!rawSession) return false;

		const session = JSON.parse(rawSession) as StoredSession | null;
		if (!session?.access_token || !session.user?.id) return false;

		return (
			typeof session.expires_at !== "number" || session.expires_at > Date.now()
		);
	} catch {
		return false;
	}
};

if (isAuthPage()) {
	window.setInterval(() => {
		if (isLoggedIn()) {
			window.location.href = MY_MUSICS_URL;
		}
	}, 2000);
}
