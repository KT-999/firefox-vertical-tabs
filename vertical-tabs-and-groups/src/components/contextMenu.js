/**
 * 自訂右鍵選單元件 (ContextMenu)
 */
import { TabService } from '../services/tabService.js';
import { TAB_GROUP_ID_NONE } from '../config/constants.js';
import { t } from '../i18n/index.js';

export class ContextMenuComponent {
  constructor(menuElementId = 'contextMenu') {
    this.menuEl = document.getElementById(menuElementId);
    this.initEvents();
  }

  initEvents() {
    window.addEventListener('click', (e) => {
      if (this.menuEl && !this.menuEl.contains(e.target)) {
        this.close();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });
  }

  close() {
    if (this.menuEl) {
      this.menuEl.style.display = 'none';
    }
  }

  /**
   * 顯示分頁右鍵選單 (含多選批次操作與休眠)
   */
  showTabMenu(x, y, tab, { store, onOpenGroupModal, onToast }) {
    this.close();

    const isMultipleSelected = store.selectedTabIds.size > 1 && store.isSelected(tab.id);

    // 1. 若為批次多選狀態，顯示批次動作選單
    if (isMultipleSelected) {
      const selectedCount = store.selectedTabIds.size;
      const selectedIds = Array.from(store.selectedTabIds);

      const batchItems = [
        {
          label: `${t('selectedCount', { count: selectedCount })}`,
          divider: false,
          action: () => {}
        },
        { divider: true },
        {
          label: t('groupSelectedTabs'),
          action: async () => {
            try {
              const newGroupId = await TabService.groupTabs(selectedIds);
              store.clearSelection();
              if (newGroupId) {
                onOpenGroupModal(newGroupId);
              }
            } catch (err) {
              console.error('Batch group error:', err);
            }
          }
        },
        {
          label: t('discardSelectedTabs', { count: selectedCount }),
          action: async () => {
            const count = await TabService.discardTabs(selectedIds);
            store.clearSelection();
            if (onToast) onToast(t('discardSuccessMsg', { count }));
          }
        },
        {
          label: t('closeSelectedTabs', { count: selectedCount }),
          action: async () => {
            await TabService.closeTabs(selectedIds);
            store.clearSelection();
          }
        },
        { divider: true },
        {
          label: t('clearSelection'),
          action: () => store.clearSelection()
        }
      ];

      this.render(x, y, batchItems);
      return;
    }

    // 2. 一般單一分頁選單
    const isMuted = Boolean(tab.mutedInfo && tab.mutedInfo.muted);

    const items = [
      {
        label: t('switchToTab'),
        action: () => TabService.activateTab(tab.id)
      },
      {
        label: tab.pinned ? t('unpinTab') : t('pinTab'),
        action: () => TabService.setTabPinned(tab.id, !tab.pinned)
      },
      {
        label: isMuted ? t('unmuteTab') : t('muteTab'),
        action: () => TabService.setTabMuted(tab.id, !isMuted)
      },
      {
        label: t('discardTab'),
        action: async () => {
          await TabService.discardTab(tab.id);
          if (onToast) onToast(t('discardSuccessMsg', { count: 1 }));
          store.refresh();
        }
      },
      {
        label: t('duplicateTab'),
        action: () => TabService.duplicateTab(tab.id)
      },
      {
        label: t('reloadTab'),
        action: () => TabService.reloadTab(tab.id)
      },
      { divider: true }
    ];

    // 分頁群組相關動作
    if (TabService.hasTabGroupsSupport()) {
      const isInGroup = tab.groupId !== undefined && tab.groupId !== TAB_GROUP_ID_NONE;

      if (isInGroup) {
        items.push({
          label: t('removeFromGroup'),
          action: () => TabService.ungroupTabs(tab.id)
        });
      }

      items.push({
        label: t('addToNewGroup'),
        action: async () => {
          try {
            const newGroupId = await TabService.groupTabs(tab.id);
            if (newGroupId) {
              onOpenGroupModal(newGroupId);
            }
          } catch (err) {
            console.error('Error grouping tab:', err);
          }
        }
      });

      // 加入現有群組
      if (store.tabGroupsMap.size > 0) {
        store.tabGroupsMap.forEach((grp, gId) => {
          if (tab.groupId !== gId) {
            items.push({
              label: t('addToGroup', { name: grp.title || t('defaultGroupTitle') }),
              action: () => TabService.groupTabs(tab.id, gId)
            });
          }
        });
      }

      items.push({ divider: true });
    }

    items.push(
      {
        label: t('closeThisTab'),
        action: () => TabService.closeTab(tab.id)
      },
      {
        label: t('closeOtherTabs'),
        action: async () => {
          const otherIds = store.allTabs
            .filter(t => t.id !== tab.id && !t.pinned)
            .map(t => t.id);
          if (otherIds.length > 0) {
            await TabService.closeTabs(otherIds);
          }
        }
      }
    );

    this.render(x, y, items);
  }

  /**
   * 顯示群組右鍵選單 (含休眠與書籤資料夾儲存)
   */
  showGroupMenu(x, y, group, { store, onOpenGroupModal, onToast }) {
    this.close();

    const isCollapsed = store.collapsedGroups.has(group.id);
    const groupTabs = store.allTabs.filter(t => t.groupId === group.id);
    const groupedTabIds = groupTabs.map(t => t.id);

    const items = [
      {
        label: t('editGroup'),
        action: () => onOpenGroupModal(group.id)
      },
      {
        label: t('newTabInGroup'),
        action: async () => {
          const newTab = await TabService.createTab({ active: true });
          if (newTab) {
            await TabService.groupTabs(newTab.id, group.id);
          }
        }
      },
      {
        label: isCollapsed ? t('expandGroup') : t('collapseGroup'),
        action: () => store.toggleGroupCollapse(group.id)
      },
      {
        label: t('discardGroup'),
        action: async () => {
          const count = await TabService.discardTabs(groupedTabIds);
          if (onToast) onToast(t('discardSuccessMsg', { count }));
          store.refresh();
        }
      },
      {
        label: t('saveGroupToBookmarks'),
        action: async () => {
          const title = group.title || t('defaultGroupTitle');
          const success = await TabService.saveGroupToBookmarks(title, groupTabs);
          if (success && onToast) {
            onToast(t('savedGroupToBookmarksMsg', { title, count: groupTabs.length }));
          }
        }
      },
      { divider: true },
      {
        label: t('ungroupTabs'),
        action: async () => {
          if (groupedTabIds.length > 0) {
            await TabService.ungroupTabs(groupedTabIds);
          }
        }
      },
      {
        label: t('closeGroupTabs'),
        action: async () => {
          if (groupedTabIds.length > 0) {
            await TabService.closeTabs(groupedTabIds);
          }
        }
      }
    ];

    this.render(x, y, items);
  }

  /**
   * 渲染選單 DOM 與防邊界溢出定位
   */
  render(x, y, items) {
    if (!this.menuEl) return;
    this.menuEl.innerHTML = '';

    items.forEach(item => {
      if (item.divider) {
        const div = document.createElement('div');
        div.className = 'menu-divider';
        this.menuEl.appendChild(div);
      } else {
        const div = document.createElement('div');
        div.className = 'menu-item';
        div.textContent = item.label;
        div.addEventListener('click', () => {
          this.close();
          if (item.action) item.action();
        });
        this.menuEl.appendChild(div);
      }
    });

    this.menuEl.style.display = 'block';

    const menuWidth = 200;
    const menuHeight = this.menuEl.offsetHeight;
    const posX = Math.min(x, window.innerWidth - menuWidth - 8);
    const posY = Math.min(y, window.innerHeight - menuHeight - 8);

    this.menuEl.style.left = `${Math.max(8, posX)}px`;
    this.menuEl.style.top = `${Math.max(8, posY)}px`;
  }
}
