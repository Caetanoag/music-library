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
