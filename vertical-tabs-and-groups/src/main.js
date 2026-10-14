/**
 * 垂直分頁應用程式主入口 (Entry Point)
 */
import { TabStore } from './state/store.js';
import { TabService } from './services/tabService.js';
import { ToolbarComponent } from './components/toolbar.js';
import { TopGroupsBarComponent } from './components/topGroupsBar.js';
import { PinnedTabsComponent } from './components/pinnedTabs.js';
import { TabGroupComponent } from './components/tabGroup.js';
import { TabItemComponent } from './components/tabItem.js';
import { ContextMenuComponent } from './components/contextMenu.js';
import { GroupModalComponent } from './components/groupModal.js';
import { ToastComponent } from './components/toast.js';
import { TAB_GROUP_ID_NONE } from './config/constants.js';
import { applyDomTranslations, t } from './i18n/index.js';

class VerticalTabsApp {
  constructor() {
    this.store = new TabStore();
    this.sidebarContainer = document.getElementById('sidebarContainer');
    this.tabsListEl = document.getElementById('tabsList');
    this.tabsScrollArea = document.getElementById('tabsScrollArea');
    this.emptySearchResultsEl = document.getElementById('emptySearchResults');

    this.init();
  }

  async init() {
    // 1. 自動依 Firefox 介面語系翻譯 DOM 靜態文字
    applyDomTranslations();

    // 2. 初始化輕量級提示條 (Toast)
    this.toast = new ToastComponent('toastContainer');

    // 3. 初始化右鍵選單與彈窗元件
    this.contextMenu = new ContextMenuComponent('contextMenu');

    this.groupModal = new GroupModalComponent({
      modalId: 'groupModal',
      onSaved: () => this.store.refresh()
    });

    // 4. 初始化頂部工具列元件 (含復原關閉分頁、關閉重複、工具選單)
    this.toolbar = new ToolbarComponent({
      store: this.store,
      onSearchChange: (query) => this.store.setSearchQuery(query),
      onToast: (msg) => this.toast.show(msg)
    });

    // 5. 初始化頂部群組導覽列 (顯示當前群組與一鍵新增)
    this.topGroupsBar = new TopGroupsBarComponent({
      containerId: 'topGroupsBar',
      onCreateGroup: () => this.groupModal.openCreate(this.store),
      onSelectGroup: (groupId) => this.scrollToGroup(groupId)
    });

    // 6. 初始化固定分頁元件
    this.pinnedTabs = new PinnedTabsComponent({
      containerId: 'pinnedSection',
      gridId: 'pinnedGrid',
      onContextMenu: (e, tab) => {
        this.contextMenu.showTabMenu(e.clientX, e.clientY, tab, {
          store: this.store,
          onOpenGroupModal: (groupId) => this.groupModal.openEdit(groupId, this.store),
          onToast: (msg) => this.toast.show(msg)
        });
      },
      onDragStart: (tabId) => this.store.setDraggedTabId(tabId),
      onDragEnd: () => this.store.setDraggedTabId(null)
    });

    // 7. 註冊狀態監聽與繪製回呼
    this.store.subscribe(() => this.render());

    // 8. 註冊瀏覽器即時事件監聽
    TabService.subscribeTabsEvents(() => this.store.refresh());
    TabService.subscribeGroupEvents(() => this.store.refresh());

    // 9. 載入初始資料
    await this.store.init();
  }

  /**
   * 平滑滾動至指定群組並加入高亮效果
   */
  async scrollToGroup(groupId) {
    // 若該群組處於收合狀態，自動展開
    if (this.store.collapsedGroups.has(groupId)) {
      await this.store.toggleGroupCollapse(groupId);
    }

    requestAnimationFrame(() => {
      const groupEl = document.querySelector(`.tab-group-container[data-group-id="${groupId}"]`);
      if (groupEl) {
        groupEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const header = groupEl.querySelector('.tab-group-header');
        if (header) {
          header.classList.remove('group-highlight');
          void header.offsetWidth;
          header.classList.add('group-highlight');
        }
      }
    });
  }

  /**
   * 根據 Store 狀態繪製 UI
   */
  render() {
    // 更新緊湊檢視模式樣式
    if (this.sidebarContainer) {
      this.sidebarContainer.classList.toggle('compact-mode', Boolean(this.store.isCompact));
    }

    // 更新頂部計數
    this.toolbar.updateCount(this.store.totalTabCount);

    // 繪製頂部群組導覽列
    this.topGroupsBar.render(this.store.tabGroupsMap, this.store.allTabs);

    // 繪製固定分頁
    this.pinnedTabs.render(this.store.pinnedTabs);

    // 繪製主要分頁列表 (群組與一般分頁)
    this.renderMainTabsList();
  }

  renderMainTabsList() {
    if (!this.tabsListEl) return;
    this.tabsListEl.innerHTML = '';

    const tabsToRender = this.store.filteredUnpinnedTabs;

    // 搜尋無結果顯示
    if (this.store.searchQuery && tabsToRender.length === 0) {
      this.emptySearchResultsEl.style.display = 'flex';
      return;
    }
    this.emptySearchResultsEl.style.display = 'none';

    let currentGroupId = null;
    let currentGroupContainer = null;
    let currentGroupTabsList = null;

    tabsToRender.forEach(tab => {
      const gId = tab.groupId !== undefined ? tab.groupId : TAB_GROUP_ID_NONE;
      const hasGroup = gId !== TAB_GROUP_ID_NONE;
      const isSelected = this.store.isSelected(tab.id);
      const containerMeta = tab.cookieStoreId ? this.store.containerMap.get(tab.cookieStoreId) : null;

      if (hasGroup) {
        if (gId !== currentGroupId) {
          currentGroupId = gId;

          const groupMeta = this.store.tabGroupsMap.get(gId) || {
            id: gId,
            title: '',
            color: 'blue',
            collapsed: false
          };

          const isCollapsed = this.store.searchQuery
            ? false
            : (this.store.collapsedGroups.has(gId) || groupMeta.collapsed);

          const groupTabCount = this.store.allTabs.filter(t => t.groupId === gId).length;

          // 透過 TabGroupComponent 建立群組 DOM
          const { container, tabsListContainer } = TabGroupComponent.create(groupMeta, {
            isCollapsed,
            tabCount: groupTabCount,
            onToggleCollapse: (id) => this.store.toggleGroupCollapse(id),
            onContextMenu: (e, grp) => {
              this.contextMenu.showGroupMenu(e.clientX, e.clientY, grp, {
                store: this.store,
                onOpenGroupModal: (id) => this.groupModal.openEdit(id, this.store),
                onToast: (msg) => this.toast.show(msg)
              });
            },
            getDraggedTabId: () => this.store.draggedTabId
          });

          currentGroupContainer = container;
          currentGroupTabsList = tabsListContainer;
          this.tabsListEl.appendChild(currentGroupContainer);
        }

        // 透過 TabItemComponent 建立群組內的單一分頁
        const tabEl = TabItemComponent.create(tab, {
          isGrouped: true,
          isSelected,
          containerMeta,
          onContextMenu: (e, t) => {
            this.contextMenu.showTabMenu(e.clientX, e.clientY, t, {
              store: this.store,
              onOpenGroupModal: (id) => this.groupModal.openEdit(id, this.store),
              onToast: (msg) => this.toast.show(msg)
            });
          },
          onTabClick: (e, t) => this.handleTabClick(e, t),
          onDragStart: (tabId) => this.store.setDraggedTabId(tabId),
          onDragEnd: () => this.store.setDraggedTabId(null),
          getDraggedTabId: () => this.store.draggedTabId
        });

        currentGroupTabsList.appendChild(tabEl);
      } else {
        // 未分組分頁
        currentGroupId = null;
        currentGroupContainer = null;
        currentGroupTabsList = null;

        const tabEl = TabItemComponent.create(tab, {
          isGrouped: false,
          isSelected,
          containerMeta,
          onContextMenu: (e, t) => {
            this.contextMenu.showTabMenu(e.clientX, e.clientY, t, {
              store: this.store,
              onOpenGroupModal: (id) => this.groupModal.openEdit(id, this.store),
              onToast: (msg) => this.toast.show(msg)
            });
          },
          onTabClick: (e, t) => this.handleTabClick(e, t),
          onDragStart: (tabId) => this.store.setDraggedTabId(tabId),
          onDragEnd: () => this.store.setDraggedTabId(null),
          getDraggedTabId: () => this.store.draggedTabId
        });

        this.tabsListEl.appendChild(tabEl);
      }
    });
  }

  /**
   * 處理分頁點擊 (支援 Ctrl/Cmd、Shift 多選操作)
   */
  handleTabClick(e, tab) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      this.store.toggleTabSelect(tab.id);
    } else if (e.shiftKey) {
      e.preventDefault();
      this.store.selectRange(tab.id);
    } else {
      if (this.store.selectedTabIds.size > 0) {
        this.store.clearSelection();
      }
      TabService.activateTab(tab.id);
    }
  }
}

// 啟動應用程式
document.addEventListener('DOMContentLoaded', () => {
  new VerticalTabsApp();
});
