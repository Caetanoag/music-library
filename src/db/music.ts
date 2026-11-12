export type Music = {
    id: string;
    added_by: string;
    artist: string;
    name: string;
    album: string | null;
};

export class MusicDatabase {
    private baseURL: string;
    private apiKey: string;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.baseURL = supabaseUrl.replace(/\/$/, "");
        this.apiKey = supabaseKey;
    }

    private getAuthToken(): string {
        if (typeof window === "undefined") return this.apiKey;
        try {
            const rawSession = localStorage.getItem("supabase_session");
            const session = rawSession ? JSON.parse(rawSession) : null;
            return session?.access_token ?? this.apiKey;
        } catch {
            return this.apiKey;
        }
    }

    public async getMusicLibrary(userId: string | null = null): Promise<Music[] | undefined> {
        const filter = userId !== null ? `&added_by=eq.${encodeURIComponent(userId)}` : "";
        const url = `${this.baseURL}/music?select=*${filter}`;

        try {
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    apikey: this.apiKey,
                    Authorization: `Bearer ${this.getAuthToken()}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }

            return (await response.json()) as Music[];
        } catch (err) {
            const context = userId !== null ? ` do usuário ${userId}` : "";
            console.error(`Erro ao ler a biblioteca de músicas${context}:`, err);
            return undefined;
        }
    }
}