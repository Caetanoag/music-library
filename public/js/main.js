// src/components/footer.ts
class CustomFooter extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
            <footer>
                <p>Custom Footer</p>
            </footer>
        `;
  }
}
customElements.define("custom-footer", CustomFooter);

// src/components/header.ts
class CustomHeader extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = `
      <header>
        <h1> Your Music Library <h1>
        <nav>
          <a href='./html/my-musics.html'>My Musics</a>
          <a href='./html/favorite-artists.html'>Favorite Artists</a>
        </nav>
      </header>
    `;
  }
}
customElements.define("custom-header", CustomHeader);

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
