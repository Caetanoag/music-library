export class MusicCard extends HTMLElement {
    public artist: string;
    public name: string;
    public album: string;
    constructor(artist: string, name: string, album: string){
        super()
        this.name = name;
        this.artist = artist;
        this.album = album;
        this.innerHTML = `
            <div class="music-card">
                <h2> ${name} <h2>
                <h3> ${artist} - ${album}<h3>
            </div>
        `
    }
}
customElements.define("music-card", MusicCard)