// Switch
export class SwitchElement extends HTMLElement {
  #internals;

  static get observedAttributes() {
    return ['value'];
  }

  static formAssociated = true;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.abortController = null;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('tabindex', '0');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '60');
    svg.setAttribute('viewBox', '0 0 120 60');
    svg.setAttribute('style', 'width:auto;height:1.5em; vertical-align: middle;');
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('rx', '30');
    rect.setAttribute('ry', '30');
    rect.setAttribute('width', '120');
    rect.setAttribute('height', '60');
    rect.setAttribute('fill', '#cccccc');
    svg.append(rect, this._createCircle(false));
    this.attachShadow({ mode: 'open' }).append(svg);
  }

  connectedCallback() {
    const passive = true;
    this.abortController?.abort();
    const abortController = this.abortController = new AbortController();
    const { signal } = abortController, shadow = this.shadowRoot;
    this.addEventListener('click', () => this._onclick(), { signal, passive });
    this.addEventListener('switch-press', ({ detail }) => {
      shadow.querySelector('circle')?.remove();
      shadow.querySelector('svg').append(this._createCircle(detail));
    }, { signal, passive });
    this.#internals.role = 'switch';
    shadow.querySelector('svg').addEventListener('keydown', (event) => {
      const { key } = event;
      if (key === ' ' || key === 'Enter') {
        this.value = !this.value;
      }
    }, { signal, passive });
  }

  _onclick() {
    this.value = !this.value;
  }

  set value(value) {
    if (value) {
      this.setAttribute('value', 'on');
    } else {
      this.removeAttribute('value');
    }
  }

  get value() {
    return this.hasAttribute('value');
  }

  disconnectedCallback() {
    this.abortController?.abort();
  }

  _createCircle(on) {
    on = Boolean(on);
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg", "circle");
    circle.setAttribute('cx', '30');
    circle.setAttribute('cy', '30');
    circle.setAttribute('r', '25');
    if (on) {
      circle.setAttribute('fill', '#4CAF50');
      circle.setAttribute('cx', '90');
    } else {
      circle.setAttribute('fill', '#da2404');
    }
    this.#internals.ariaChecked = String(on);
    return circle;
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'value') {
      if (newValue === 'on' || newValue === null) {
        const detail = newValue === 'on';
        this.#internals.setFormValue(detail ? 'on' : null);
        this.dispatchEvent(new CustomEvent('switch-press', {
          bubbles: true, cancelable: false,
          composed: false, detail,
        }));
      } else this.value = newValue;
    }
  }
}

customElements.define('switch-element', SwitchElement);
