// src/components/music-card.ts
var getTrackInfo = async (artist, name) => {
  const query = `${encodeURIComponent(artist)}+${encodeURIComponent(name)}`;
  const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
  const data = await response.json();
  const track = data.results[0];
  return {
    cover: track?.artworkUrl100?.replace("100x100bb", "600x600bb") || "",
    album: track?.collectionName || ""
  };
};

class MusicCard extends HTMLElement {
  async connectedCallback() {
    const artist = this.getAttribute("artist") || "";
    const name = this.getAttribute("name") || "";
    const album = this.getAttribute("album") || "";
    this.innerHTML = `
            <div class="music-card">
                <h2>${name}</h2>
                <h3 class="artist">${artist}</h3>
                <h3 class="album">${album}</h3>
                <img src="" alt="Album cover" />
            </div>
        `;
    if (artist && name) {
      const info = await getTrackInfo(artist, name);
      const img = this.querySelector("img");
      if (img && info.cover) {
        img.src = info.cover;
      }
      if (!album && info.album) {
        const albumEl = this.querySelector(".album");
        if (albumEl)
          albumEl.textContent = info.album;
      }
    }
  }
}
customElements.define("music-card", MusicCard);

// src/db/music.ts
class MusicDatabase {
  baseURL;
  apiKey;
  constructor(supabaseUrl, supabaseKey) {
    this.baseURL = supabaseUrl.replace(/\/$/, "");
    this.apiKey = supabaseKey;
  }
  getAuthToken() {
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
  authHeaders(extra) {
    const token = this.getAuthToken();
    return {
      apikey: this.apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...extra
    };
  }
  async getMusicLibrary(userId = null) {
    const filter = userId !== null ? `&added_by=eq.${encodeURIComponent(userId)}` : "";
    const url = `${this.baseURL}/songs?select=*${filter}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.authHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    return await response.json();
  }
  async getMusicById(id) {
    const url = `${this.baseURL}/songs?select=*&id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.authHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    return data[0] ?? null;
  }
  async createMusic(music) {
    const response = await fetch(`${this.baseURL}/songs`, {
      method: "POST",
      headers: this.authHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(music)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    const created = data[0];
    if (!created) {
      throw new Error("Falha ao criar música");
    }
    return created;
  }
  async updateMusic(id, updates) {
    const url = `${this.baseURL}/songs?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.authHeaders({ Prefer: "return=representation" }),
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    const data = await response.json();
    const updated = data[0];
    if (!updated) {
      throw new Error("Música não encontrada");
    }
    return updated;
  }
  async deleteMusic(id) {
    const url = `${this.baseURL}/songs?id=eq.${encodeURIComponent(id)}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.authHeaders()
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
  }
}

// src/db/supabase.ts
var BASE_URL = "https://ewvqgwovgwiqbyxbueul.supabase.co";
var PUBLISHABLE_KEY = "sb_publishable_eOVj-675dlsYb_0nnmm52Q_-bImFTii";
var AUTH_ENDPOINT = `${BASE_URL}/auth/v1`;
var REST_ENDPOINT = `${BASE_URL}/rest/v1`;

// src/all-musics.ts
var renderMusics = (container, musics) => {
  if (musics.length === 0) {
    container.innerHTML = "<p>Nenhuma música encontrada no banco.</p>";
    return;
  }
  container.innerHTML = musics.map((music) => {
    const artist = music.artist.replace(/"/g, "&quot;");
    const title = music.title.replace(/"/g, "&quot;");
    const album = (music.album ?? "").replace(/"/g, "&quot;");
    return `<music-card artist="${artist}" name="${title}" album="${album}"></music-card>`;
  }).join("");
};
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("music-list");
  const status = document.getElementById("status");
  if (!container)
    return;
  try {
    const db = new MusicDatabase(REST_ENDPOINT, PUBLISHABLE_KEY);
    const musics = await db.getMusicLibrary();
    if (status)
      status.textContent = "";
    renderMusics(container, musics);
  } catch (err) {
    console.error("Erro ao carregar músicas:", err);
    const message = err instanceof Error ? err.message : "Erro ao carregar músicas";
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
