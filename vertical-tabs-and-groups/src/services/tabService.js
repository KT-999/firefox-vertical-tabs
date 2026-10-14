/**
 * 瀏覽器分頁與群組 API 封裝服務
 */
import { TAB_GROUP_ID_NONE } from '../config/constants.js';

const extApi = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);

export class TabService {
  /**
   * 檢查當前瀏覽器是否支援 tabGroups API
   */
  static hasTabGroupsSupport() {
    return Boolean(extApi && extApi.tabGroups && typeof extApi.tabGroups.query === 'function');
  }

  /**
   * 取得當前視窗資訊
   */
  static async getCurrentWindow() {
    if (!extApi || !extApi.windows) return null;
    try {
      return await extApi.windows.getCurrent();
    } catch (e) {
      console.warn('TabService: 取得當前視窗失敗', e);
      return null;
    }
  }

  /**
   * 查詢當前視窗的所有分頁
   */
  static async getTabs(currentWindow = true) {
    if (!extApi || !extApi.tabs) return [];
    try {
      return await extApi.tabs.query({ currentWindow });
    } catch (e) {
      console.error('TabService: 查詢分頁失敗', e);
      return [];
    }
  }

  /**
   * 查詢當前視窗的所有分頁群組
   */
  static async getTabGroups(windowId) {
    if (!this.hasTabGroupsSupport()) return [];
    try {
      return await extApi.tabGroups.query({ windowId });
    } catch (e) {
      console.debug('TabService: tabGroups.query 失敗或無群組', e);
      return [];
    }
  }

  /**
   * 切換至指定分頁
   */
  static async activateTab(tabId) {
    return extApi?.tabs?.update(tabId, { active: true });
  }

  /**
   * 關閉單一分頁
   */
  static async closeTab(tabId) {
    return extApi?.tabs?.remove(tabId);
  }

  /**
   * 關閉多個分頁
   */
  static async closeTabs(tabIds) {
    if (!tabIds || tabIds.length === 0) return;
    return extApi?.tabs?.remove(tabIds);
  }

  /**
   * 建立新分頁
   */
  static async createTab(options = { active: true }) {
    return extApi?.tabs?.create(options);
  }

  /**
   * 移動分頁順序
   */
  static async moveTab(tabId, index) {
    return extApi?.tabs?.move(tabId, { index });
  }

  /**
   * 複製分頁
   */
  static async duplicateTab(tabId) {
    return extApi?.tabs?.duplicate(tabId);
  }

  /**
   * 重新載入分頁
   */
  static async reloadTab(tabId) {
    return extApi?.tabs?.reload(tabId);
  }

  /**
   * 固定/取消固定分頁
   */
  static async setTabPinned(tabId, pinned) {
    return extApi?.tabs?.update(tabId, { pinned });
  }

  /**
   * 靜音/取消靜音分頁
   */
  static async setTabMuted(tabId, muted) {
    return extApi?.tabs?.update(tabId, { muted });
  }

  /**
   * 休眠單一分頁 (釋放記憶體)
   */
  static async discardTab(tabId) {
    if (!extApi?.tabs?.discard) return;
    try {
      return await extApi.tabs.discard(tabId);
    } catch (e) {
      console.debug('TabService discardTab error:', e);
    }
  }

  /**
   * 批次休眠多個分頁
   */
  static async discardTabs(tabIds) {
    if (!extApi?.tabs?.discard || !tabIds || tabIds.length === 0) return 0;
    let count = 0;
    for (const id of tabIds) {
      try {
        await extApi.tabs.discard(id);
        count++;
      } catch (e) {
        // 活躍中的分頁或無法休眠的頁面會報錯，略過即可
      }
    }
    return count;
  }

  /**
   * 復原最近關閉的分頁 (Undo Close Tab)
   */
  static async restoreClosedTab() {
    if (!extApi?.sessions?.restore) return null;
    try {
      return await extApi.sessions.restore();
    } catch (e) {
      console.warn('TabService restoreClosedTab error:', e);
      return null;
    }
  }

  /**
   * 查詢 Firefox 容器資訊 (Multi-Account Containers)
   */
  static async getContainers() {
    if (!extApi?.contextualIdentities?.query) return [];
    try {
      return await extApi.contextualIdentities.query({});
    } catch (e) {
      console.debug('TabService getContainers error:', e);
      return [];
    }
  }

  /**
   * 將群組儲存為書籤資料夾
   */
  static async saveGroupToBookmarks(groupTitle, tabs) {
    if (!extApi?.bookmarks?.create) return false;
    try {
      // 建立書籤資料夾
      const folder = await extApi.bookmarks.create({
        title: groupTitle || '分頁群組'
      });

      // 在該資料夾內建立所有分頁的書籤
      for (const tab of tabs) {
        if (tab.url && !tab.url.startsWith('about:')) {
          await extApi.bookmarks.create({
            parentId: folder.id,
            title: tab.title || tab.url,
            url: tab.url
          });
        }
      }
      return true;
    } catch (e) {
      console.error('TabService saveGroupToBookmarks error:', e);
      return false;
    }
  }

  /**
   * 讀取 Local Storage 設定
   */
  static async getStorage(key, defaultValue = null) {
    if (!extApi?.storage?.local) return defaultValue;
    try {
      const res = await extApi.storage.local.get(key);
      return res[key] !== undefined ? res[key] : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  /**
   * 寫入 Local Storage 設定
   */
  static async setStorage(key, value) {
    if (!extApi?.storage?.local) return;
    try {
      await extApi.storage.local.set({ [key]: value });
    } catch (e) {
      console.warn('TabService setStorage error:', e);
    }
  }

  /**
   * 將分頁加入群組（若無 groupId 則建立新群組）
   */
  static async groupTabs(tabIds, groupId = null) {
    if (!extApi?.tabs?.group) return null;
    const options = { tabIds: Array.isArray(tabIds) ? tabIds : [tabIds] };
    if (groupId && groupId !== TAB_GROUP_ID_NONE) {
      options.groupId = groupId;
    }
    return extApi.tabs.group(options);
  }

  /**
   * 將分頁從群組中移出
   */
  static async ungroupTabs(tabIds) {
    if (!extApi?.tabs?.ungroup) return;
    const ids = Array.isArray(tabIds) ? tabIds : [tabIds];
    return extApi.tabs.ungroup(ids);
  }

  /**
   * 更新群組屬性 (名稱、色彩、收合狀態)
   */
  static async updateGroup(groupId, updateProps) {
    if (!extApi?.tabGroups || !extApi.tabGroups.update) return;
    return extApi.tabGroups.update(groupId, updateProps);
  }

  /**
   * 註冊分頁變更事件監聽器
   */
  static subscribeTabsEvents(callback) {
    if (!extApi?.tabs) return;
    extApi.tabs.onCreated.addListener(callback);
    extApi.tabs.onUpdated.addListener(callback);
    extApi.tabs.onMoved.addListener(callback);
    extApi.tabs.onActivated.addListener(callback);
    extApi.tabs.onRemoved.addListener(callback);
    if (extApi.tabs.onAttached) extApi.tabs.onAttached.addListener(callback);
    if (extApi.tabs.onDetached) extApi.tabs.onDetached.addListener(callback);
  }

  /**
   * 註冊分頁群組變更事件監聽器
   */
  static subscribeGroupEvents(callback) {
    if (extApi?.tabGroups) {
      if (extApi.tabGroups.onCreated) extApi.tabGroups.onCreated.addListener(callback);
      if (extApi.tabGroups.onUpdated) extApi.tabGroups.onUpdated.addListener(callback);
      if (extApi.tabGroups.onRemoved) extApi.tabGroups.onRemoved.addListener(callback);
      if (extApi.tabGroups.onMoved) extApi.tabGroups.onMoved.addListener(callback);
    }
  }
}
