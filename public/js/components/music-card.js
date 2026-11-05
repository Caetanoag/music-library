// src/components/music-card.ts
class MusicCard extends HTMLElement {
  artist;
  name;
  album;
  constructor(artist, name, album) {
    super();
    this.name = name;
    this.artist = artist;
    this.album = album;
    this.innerHTML = `
            <div class="music-card">
                <h2> ${name} <h2>
                <h3> ${artist} - ${album}<h3>
            </div>
        `;
  }
}
customElements.define("music-card", MusicCard);
export {
  MusicCard
};
