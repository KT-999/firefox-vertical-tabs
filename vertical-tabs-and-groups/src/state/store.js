/**
 * 垂直分頁狀態管理器 (Store)
 */
import { TabService } from '../services/tabService.js';
import { TAB_GROUP_ID_NONE, DEFAULT_GROUP_COLOR } from '../config/constants.js';

export class TabStore {
  constructor() {
    this.currentWindowId = null;
    this.allTabs = [];
    this.tabGroupsMap = new Map(); // groupId -> Group Metadata
    this.collapsedGroups = new Set();
    this.containerMap = new Map(); // cookieStoreId -> Container Metadata
    this.selectedTabIds = new Set();
    this.lastSelectedTabId = null;
    this.searchQuery = '';
    this.draggedTabId = null;
    this.isCompact = false;
    this.autoCollapseInactive = false;
    this.listeners = new Set();
  }

  /**
   * 註冊狀態監聽器
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有監聽器
   */
  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this);
      } catch (err) {
        console.error('TabStore notify error:', err);
      }
    }
  }

  /**
   * 初始化當前視窗與資料載入
   */
  async init() {
    const win = await TabService.getCurrentWindow();
    if (win) {
      this.currentWindowId = win.id;
    }

    // 載入持久化設定
    this.isCompact = Boolean(await TabService.getStorage('compactMode', false));
    this.autoCollapseInactive = Boolean(await TabService.getStorage('autoCollapseInactive', false));

    // 載入 Firefox 容器識別
    await this.refreshContainers();

    await this.refresh();
  }

  /**
   * 重新載入 Firefox 容器清單
   */
  async refreshContainers() {
    const containers = await TabService.getContainers();
    this.containerMap.clear();
    for (const c of containers) {
      this.containerMap.set(c.cookieStoreId, c);
    }
  }

  /**
   * 重新載入分頁與分頁群組資料
   */
  async refresh() {
    this.allTabs = await TabService.getTabs(true);

    if (TabService.hasTabGroupsSupport()) {
      const groups = await TabService.getTabGroups(this.currentWindowId);
      this.tabGroupsMap.clear();
      for (const g of groups) {
        this.tabGroupsMap.set(g.id, g);
        if (g.collapsed) {
          this.collapsedGroups.add(g.id);
        }
      }
    }

    // 清理可能已關閉之已選取分頁
    const currentTabIds = new Set(this.allTabs.map(t => t.id));
    for (const id of this.selectedTabIds) {
      if (!currentTabIds.has(id)) {
        this.selectedTabIds.delete(id);
      }
    }

    // 自動收合非活躍群組
    if (this.autoCollapseInactive) {
      this.handleAutoCollapse();
    }

    this.notify();
  }

  /**
   * 切換緊湊模式
   */
  async toggleCompactMode() {
    this.isCompact = !this.isCompact;
    await TabService.setStorage('compactMode', this.isCompact);
    this.notify();
  }

  /**
   * 切換自動收合非活躍群組
   */
  async toggleAutoCollapseInactive() {
    this.autoCollapseInactive = !this.autoCollapseInactive;
    await TabService.setStorage('autoCollapseInactive', this.autoCollapseInactive);
    if (this.autoCollapseInactive) {
      this.handleAutoCollapse();
    }
    this.notify();
  }

  /**
   * 處理自動收合非活躍群組邏輯
   */
  handleAutoCollapse() {
    const activeTab = this.allTabs.find(t => t.active);
    if (!activeTab) return;

    const activeGroupId = activeTab.groupId !== undefined ? activeTab.groupId : TAB_GROUP_ID_NONE;

    this.tabGroupsMap.forEach((_, gId) => {
      if (gId === activeGroupId) {
        this.collapsedGroups.delete(gId);
      } else {
        this.collapsedGroups.add(gId);
      }
    });
  }

  /**
   * 多選操作：單一切換選取
   */
  toggleTabSelect(tabId) {
    if (this.selectedTabIds.has(tabId)) {
      this.selectedTabIds.delete(tabId);
    } else {
      this.selectedTabIds.add(tabId);
      this.lastSelectedTabId = tabId;
    }
    this.notify();
  }

  /**
   * 多選操作：範圍選取 (Shift + Click)
   */
  selectRange(targetTabId) {
    if (this.lastSelectedTabId === null) {
      this.toggleTabSelect(targetTabId);
      return;
    }

    const unpinned = this.filteredUnpinnedTabs;
    const fromIdx = unpinned.findIndex(t => t.id === this.lastSelectedTabId);
    const toIdx = unpinned.findIndex(t => t.id === targetTabId);

    if (fromIdx === -1 || toIdx === -1) {
      this.toggleTabSelect(targetTabId);
      return;
    }

    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);

    for (let i = start; i <= end; i++) {
      this.selectedTabIds.add(unpinned[i].id);
    }
    this.lastSelectedTabId = targetTabId;
    this.notify();
  }

  /**
   * 清除所有選取
   */
  clearSelection() {
    if (this.selectedTabIds.size > 0) {
      this.selectedTabIds.clear();
      this.lastSelectedTabId = null;
      this.notify();
    }
  }

  isSelected(tabId) {
    return this.selectedTabIds.has(tabId);
  }

  get selectedTabs() {
    return this.allTabs.filter(t => this.selectedTabIds.has(t.id));
  }

  /**
   * 設定搜尋關鍵字
   */
  setSearchQuery(query) {
    this.searchQuery = (query || '').trim();
    this.notify();
  }

  setDraggedTabId(tabId) {
    this.draggedTabId = tabId;
  }

  /**
   * 切換單一群組收合
   */
  async toggleGroupCollapse(groupId) {
    const willCollapse = !this.collapsedGroups.has(groupId);
    if (willCollapse) {
      this.collapsedGroups.add(groupId);
    } else {
      this.collapsedGroups.delete(groupId);
    }

    if (TabService.hasTabGroupsSupport()) {
      await TabService.updateGroup(groupId, { collapsed: willCollapse });
    }

    this.notify();
  }

  /**
   * 全部群組收合/展開
   */
  async toggleAllGroupsCollapse() {
    const hasAnyExpanded = Array.from(this.tabGroupsMap.keys()).some(
      id => !this.collapsedGroups.has(id)
    );

    if (hasAnyExpanded) {
      this.tabGroupsMap.forEach((_, id) => this.collapsedGroups.add(id));
    } else {
      this.collapsedGroups.clear();
    }

    if (TabService.hasTabGroupsSupport()) {
      for (const [id] of this.tabGroupsMap) {
        try {
          await TabService.updateGroup(id, { collapsed: hasAnyExpanded });
        } catch (e) {}
      }
    }

    this.notify();
  }

  /**
   * 智慧排序：依網域排序 (Sort by Domain)
   */
  async sortByDomain() {
    const unpinned = this.allTabs.filter(t => !t.pinned);
    const sorted = [...unpinned].sort((a, b) => {
      const getHost = url => {
        try {
          return new URL(url).hostname;
        } catch (e) {
          return '';
        }
      };
      return getHost(a.url).localeCompare(getHost(b.url));
    });

    const pinnedCount = this.allTabs.filter(t => t.pinned).length;
    for (let i = 0; i < sorted.length; i++) {
      await TabService.moveTab(sorted[i].id, pinnedCount + i);
    }
    await this.refresh();
  }

  /**
   * 智慧排序：依標題排序 (Sort by Title)
   */
  async sortByTitle() {
    const unpinned = this.allTabs.filter(t => !t.pinned);
    const sorted = [...unpinned].sort((a, b) => (a.title || '').localeCompare(b.title || ''));

    const pinnedCount = this.allTabs.filter(t => t.pinned).length;
    for (let i = 0; i < sorted.length; i++) {
      await TabService.moveTab(sorted[i].id, pinnedCount + i);
    }
    await this.refresh();
  }

  /**
   * 智慧整理：依網域自動建立群組 (Auto-group by Domain)
   */
  async autoGroupByDomain() {
    if (!TabService.hasTabGroupsSupport()) return;

    const unpinned = this.allTabs.filter(t => !t.pinned);
    const domainMap = new Map();

    for (const tab of unpinned) {
      if (!tab.url) continue;
      try {
        const host = new URL(tab.url).hostname.replace(/^www\./, '');
        if (host && !host.includes('newtab') && !host.includes('blank')) {
          if (!domainMap.has(host)) domainMap.set(host, []);
          domainMap.get(host).push(tab.id);
        }
      } catch (e) {}
    }

    // 針對擁有 2 個分頁以上的相同網域建立分組
    for (const [domain, tabIds] of domainMap.entries()) {
      if (tabIds.length >= 2) {
        try {
          const groupId = await TabService.groupTabs(tabIds);
          if (groupId) {
            await TabService.updateGroup(groupId, {
              title: domain,
              color: DEFAULT_GROUP_COLOR
            });
          }
        } catch (e) {
          console.debug('autoGroupByDomain error:', e);
        }
      }
    }

    await this.refresh();
  }

  get pinnedTabs() {
    return this.allTabs.filter(t => t.pinned);
  }

  get filteredUnpinnedTabs() {
    const unpinned = this.allTabs.filter(t => !t.pinned);
    if (!this.searchQuery) return unpinned;

    const q = this.searchQuery.toLowerCase();
    return unpinned.filter(tab => {
      const titleMatch = (tab.title || '').toLowerCase().includes(q);
      const urlMatch = (tab.url || '').toLowerCase().includes(q);
      return titleMatch || urlMatch;
    });
  }

  get totalTabCount() {
    return this.allTabs.length;
  }
}
