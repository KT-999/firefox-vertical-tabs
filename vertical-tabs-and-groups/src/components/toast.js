/**
 * 輕量級提示通知元件 (Toast)
 */
export class ToastComponent {
  constructor(containerId = 'toastContainer') {
    this.container = document.getElementById(containerId);
    this.timer = null;
  }

  show(message, duration = 2600) {
    if (!this.container) return;

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.container.textContent = message;
    this.container.classList.add('visible');

    this.timer = setTimeout(() => {
      this.container.classList.remove('visible');
      this.timer = null;
    }, duration);
  }
}
