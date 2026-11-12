// src/components/music-card.ts
var getTrackInfo = async (artist, name) => {
	const query = `${encodeURIComponent(artist)}+${encodeURIComponent(name)}`;
	const response = await fetch(
		`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`,
	);
	const data = await response.json();
	const track = data.results[0];
	return {
		cover: track?.artworkUrl100?.replace("100x100bb", "600x600bb") || "",
		album: track?.collectionName || "",
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
				if (albumEl) albumEl.textContent = info.album;
			}
		}
	}
}
customElements.define("music-card", MusicCard);
export { MusicCard };
