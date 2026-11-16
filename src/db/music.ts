export type Music = {
    id: string;
    added_by: string;
    artist: string;
    title: string;
    album: string | null;
    profiles?: {
        full_name: string | null;
        email: string | null;
    } | null;
};

export type MusicInsert = {
    artist: string;
    title: string;
    album?: string | null;
    added_by?: string;
};

export type MusicUpdate = Partial<Omit<MusicInsert, "added_by">>;

export class MusicDatabase {
    private baseURL: string;
    private apiKey: string;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.baseURL = supabaseUrl.replace(/\/$/, "");
        this.apiKey = supabaseKey;
    }

    private getAuthToken(): string {
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

    private authHeaders(extra?: Record<string, string>): HeadersInit {
        const token = this.getAuthToken();
        return {
            apikey: this.apiKey,
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...extra,
        };
    }

    public async getMusicLibrary(userId: string | null = null): Promise<Music[]> {
        const filter =
            userId !== null ? `&added_by=eq.${encodeURIComponent(userId)}` : "";
        const select = encodeURIComponent("*,profiles(full_name,email)");
        const url = `${this.baseURL}/songs?select=${select}${filter}`;
        const response = await fetch(url, {
            method: "GET",
            headers: this.authHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        return (await response.json()) as Music[];
    }

    public async getMusicById(id: string): Promise<Music | null> {
        const select = encodeURIComponent("*,profiles(full_name,email)");
        const url = `${this.baseURL}/songs?select=${select}&id=eq.${encodeURIComponent(id)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: this.authHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = (await response.json()) as Music[];
        return data[0] ?? null;
    }

    public async createMusic(music: MusicInsert): Promise<Music> {
        const response = await fetch(`${this.baseURL}/songs`, {
            method: "POST",
            headers: this.authHeaders({ Prefer: "return=representation" }),
            body: JSON.stringify(music),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = (await response.json()) as Music[];
        const created = data[0];
        if (!created) {
            throw new Error("Falha ao criar música");
        }
        return created;
    }

    public async updateMusic(id: string, updates: MusicUpdate): Promise<Music> {
        const url = `${this.baseURL}/songs?id=eq.${encodeURIComponent(id)}`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: this.authHeaders({ Prefer: "return=representation" }),
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = (await response.json()) as Music[];
        const updated = data[0];
        if (!updated) {
            throw new Error("Música não encontrada");
        }
        return updated;
    }

    public async deleteMusic(id: string): Promise<void> {
        const url = `${this.baseURL}/songs?id=eq.${encodeURIComponent(id)}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: this.authHeaders({ Prefer: "return=representation" }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const text = await response.text();
        const data = text ? (JSON.parse(text) as Music[]) : [];
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error("Música não encontrada ou sem permissão para excluir");
        }
    }
}