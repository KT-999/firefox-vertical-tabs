/**
 * 固定分頁元件 (Pinned Tabs Grid)
 */
import { TabService } from '../services/tabService.js';

export class PinnedTabsComponent {
  constructor({ containerId, gridId, onContextMenu, onDragStart, onDragEnd }) {
    this.container = document.getElementById(containerId);
    this.grid = document.getElementById(gridId);
    this.onContextMenu = onContextMenu;
    this.onDragStart = onDragStart;
    this.onDragEnd = onDragEnd;
  }

  render(pinnedTabs) {
    if (!this.container || !this.grid) return;
    this.grid.replaceChildren();

    if (pinnedTabs.length === 0) {
      this.container.style.display = 'none';
      return;
    }

    this.container.style.display = 'block';

    pinnedTabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = `pinned-tab-btn ${tab.active ? 'active' : ''}`;
      btn.title = `${tab.title}\n${tab.url || ''}`;
      btn.draggable = true;

      // Favicon
      const icon = this.createFavicon(tab);
      btn.appendChild(icon);

      // 點擊切換分頁
      btn.addEventListener('click', () => {
        TabService.activateTab(tab.id);
      });

      // 右鍵選單
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.onContextMenu(e, tab);
      });

      // 拖曳處理
      btn.addEventListener('dragstart', (e) => {
        this.onDragStart(tab.id, e);
        btn.style.opacity = '0.5';
      });

      btn.addEventListener('dragend', () => {
        this.onDragEnd();
        btn.style.opacity = '1';
      });

      this.grid.appendChild(btn);
    });
  }

  createFavicon(tab) {
    if (tab.favIconUrl && !tab.favIconUrl.startsWith('chrome://') && !tab.favIconUrl.startsWith('moz-icon://')) {
      const img = document.createElement('img');
      img.src = tab.favIconUrl;
      img.alt = '';
      img.onerror = () => {
        img.replaceWith(this.createFallbackIcon(tab.title));
      };
      return img;
    }
    return this.createFallbackIcon(tab.title);
  }

  createFallbackIcon(title) {
    const div = document.createElement('div');
    div.className = 'fallback-favicon';
    div.textContent = title ? title.trim().charAt(0) : '?';
    return div;
  }
}
