/**
 * 頂部工具列與搜尋列元件
 */
import { TabService } from '../services/tabService.js';
import { t } from '../i18n/index.js';

/**
 * 找出開啟分頁中的重複項目 (保留固定分頁或當前分頁)
 */
export function findDuplicateTabs(tabs) {
  const seenUrls = new Map();
  const duplicates = [];

  for (const tab of tabs) {
    if (!tab.url) continue;

    const rawUrl = tab.url.trim().toLowerCase();
    // 略過純空白新分頁與內部頁面，避免誤關
    if (
      rawUrl === 'about:blank' ||
      rawUrl === 'about:newtab' ||
      rawUrl === 'about:home' ||
      rawUrl.startsWith('chrome://newtab')
    ) {
      continue;
    }

    let normUrl = tab.url;
    try {
      const u = new URL(tab.url);
      normUrl = `${u.origin}${u.pathname}${u.search}`;
      if (normUrl.endsWith('/') && normUrl.length > 1) {
        normUrl = normUrl.slice(0, -1);
      }
    } catch (e) {
      normUrl = tab.url;
    }

    if (seenUrls.has(normUrl)) {
      const prevTab = seenUrls.get(normUrl);
      if (tab.active && !prevTab.active && !prevTab.pinned) {
        duplicates.push(prevTab.id);
        seenUrls.set(normUrl, tab);
      } else if (!tab.pinned) {
        duplicates.push(tab.id);
      } else if (!prevTab.pinned) {
        duplicates.push(prevTab.id);
        seenUrls.set(normUrl, tab);
      }
    } else {
      seenUrls.set(normUrl, tab);
    }
  }

  return duplicates;
}

export class ToolbarComponent {
  constructor({ store, onSearchChange, onToast }) {
    this.store = store;
    this.onSearchChange = onSearchChange;
    this.onToast = onToast;

    this.totalTabCountEl = document.getElementById('totalTabCount');
    this.searchToggleBtn = document.getElementById('searchToggleBtn');
    this.toggleAllGroupsBtn = document.getElementById('toggleAllGroupsBtn');
    this.closeDuplicatesBtn = document.getElementById('closeDuplicatesBtn');
    this.undoCloseBtn = document.getElementById('undoCloseBtn');
    this.toolsBtn = document.getElementById('toolsBtn');
    this.toolsMenu = document.getElementById('toolsMenu');
    this.newTabTopBtn = document.getElementById('newTabTopBtn');
    this.newTabBottomBtn = document.getElementById('newTabBottomBtn');
    this.searchBarContainer = document.getElementById('searchBarContainer');
    this.searchInput = document.getElementById('searchInput');
    this.clearSearchBtn = document.getElementById('clearSearchBtn');

    this.initEvents();
  }

  initEvents() {
    // 搜尋欄顯示/隱藏切換
    this.searchToggleBtn.addEventListener('click', () => {
      this.toggleSearchBar();
    });

    // 搜尋輸入事件
    this.searchInput.addEventListener('input', (e) => {
      this.onSearchChange(e.target.value);
    });

    // 清除搜尋
    this.clearSearchBtn.addEventListener('click', () => {
      this.clearSearch();
    });

    // 全群組收合/展開
    this.toggleAllGroupsBtn.addEventListener('click', () => {
      this.store.toggleAllGroupsCollapse();
    });

    // 一鍵關閉重複分頁
    if (this.closeDuplicatesBtn) {
      this.closeDuplicatesBtn.addEventListener('click', async () => {
        const duplicates = findDuplicateTabs(this.store.allTabs);
        if (duplicates.length > 0) {
          await TabService.closeTabs(duplicates);
          if (this.onToast) {
            this.onToast(t('closedDuplicatesMsg', { count: duplicates.length }));
          }
        } else {
          if (this.onToast) {
            this.onToast(t('noDuplicatesMsg'));
          }
        }
      });
    }

    // 復原關閉的分頁 (Undo Close)
    if (this.undoCloseBtn) {
      this.undoCloseBtn.addEventListener('click', async () => {
        const session = await TabService.restoreClosedTab();
        if (session) {
          if (this.onToast) this.onToast(t('restoredTabMsg'));
        } else {
          if (this.onToast) this.onToast(t('noTabToRestoreMsg'));
        }
      });
    }

    // 工具與智慧排序選單 (Tools Menu)
    if (this.toolsBtn) {
      this.toolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleToolsMenu();
      });
    }

    window.addEventListener('click', () => {
      if (this.toolsMenu) this.toolsMenu.style.display = 'none';
    });

    // 新增分頁按鈕 (頂部與底部)
    this.newTabTopBtn.addEventListener('click', () => {
      TabService.createTab({ active: true });
    });
    this.newTabBottomBtn.addEventListener('click', () => {
      TabService.createTab({ active: true });
    });

    // 鍵盤快速鍵監聽
    window.addEventListener('keydown', async (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        this.openSearchBar();
      } else if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 't') {
        // Ctrl+Shift+T 復原關閉的分頁
        e.preventDefault();
        const session = await TabService.restoreClosedTab();
        if (session && this.onToast) this.onToast(t('restoredTabMsg'));
      } else if (e.key === 'Escape') {
        if (this.toolsMenu) this.toolsMenu.style.display = 'none';
        if (this.isSearchBarOpen()) {
          this.closeSearchBar();
        }
      }
    });
  }

  toggleToolsMenu() {
    if (!this.toolsMenu) return;
    const isVisible = this.toolsMenu.style.display !== 'none';
    if (isVisible) {
      this.toolsMenu.style.display = 'none';
      return;
    }

    // 渲染工具項目與開關狀態
    this.toolsMenu.replaceChildren();

    const items = [
      {
        icon: '🌐',
        label: t('sortByDomain'),
        action: () => this.store.sortByDomain()
      },
      {
        icon: '🔤',
        label: t('sortByTitle'),
        action: () => this.store.sortByTitle()
      },
      {
        icon: '📁',
        label: t('autoGroupByDomain'),
        action: async () => {
          await this.store.autoGroupByDomain();
          if (this.onToast) this.onToast(t('autoGroupSuccessMsg'));
        }
      },
      { divider: true },
      {
        icon: this.store.isCompact ? '☑️' : '◻️',
        label: t('compactMode'),
        action: () => this.store.toggleCompactMode()
      },
      {
        icon: this.store.autoCollapseInactive ? '☑️' : '◻️',
        label: t('autoCollapseInactive'),
        action: () => this.store.toggleAutoCollapseInactive()
      }
    ];

    items.forEach(it => {
      if (it.divider) {
        const div = document.createElement('div');
        div.className = 'menu-divider';
        this.toolsMenu.appendChild(div);
      } else {
        const itemEl = document.createElement('div');
        itemEl.className = 'menu-item tools-item';
        const iconSpan = document.createElement('span');
        iconSpan.textContent = it.icon;
        const labelSpan = document.createElement('span');
        labelSpan.textContent = it.label;
        itemEl.append(iconSpan, ' ', labelSpan);
        itemEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toolsMenu.style.display = 'none';
          it.action();
        });
        this.toolsMenu.appendChild(itemEl);
      }
    });

    this.toolsMenu.style.display = 'block';
  }

  updateCount(count) {
    if (this.totalTabCountEl) {
      this.totalTabCountEl.textContent = count;
    }
  }

  isSearchBarOpen() {
    return this.searchBarContainer.style.display !== 'none';
  }

  openSearchBar() {
    this.searchBarContainer.style.display = 'block';
    this.searchInput.focus();
    this.searchInput.select();
  }

  closeSearchBar() {
    this.searchBarContainer.style.display = 'none';
    this.clearSearch();
  }

  toggleSearchBar() {
    if (this.isSearchBarOpen()) {
      this.closeSearchBar();
    } else {
      this.openSearchBar();
    }
  }

  clearSearch() {
    this.searchInput.value = '';
    this.onSearchChange('');
  }
}
