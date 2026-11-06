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
