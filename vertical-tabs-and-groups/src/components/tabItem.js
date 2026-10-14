/**
 * 單一分頁項目元件 (TabItem)
 */
import { TabService } from '../services/tabService.js';
import { t } from '../i18n/index.js';

export class TabItemComponent {
  /**
   * 建立分頁 DOM 節點
   */
  static create(tab, {
    isGrouped = false,
    isSelected = false,
    containerMeta = null,
    onContextMenu,
    onDragStart,
    onDragEnd,
    getDraggedTabId,
    onTabClick
  }) {
    const item = document.createElement('div');
    item.className = `tab-item ${tab.active ? 'active' : ''} ${isGrouped ? 'grouped' : ''} ${isSelected ? 'selected' : ''} ${tab.discarded ? 'discarded' : ''}`;
    item.dataset.tabId = tab.id;

    // 提示說明 (包含休眠與容器資訊)
    const containerPrefix = containerMeta ? `[${containerMeta.name}] ` : '';
    const sleepSuffix = tab.discarded ? ` (${t('discardedTooltip')})` : '';
    item.title = `${containerPrefix}${tab.title || ''}${sleepSuffix}\n${tab.url || ''}`;
    item.draggable = true;

    // 0. Firefox 多帳號容器色彩邊條 (Container Stripe)
    if (containerMeta) {
      const stripe = document.createElement('div');
      stripe.className = 'tab-container-stripe';
      stripe.style.backgroundColor = containerMeta.colorCode || containerMeta.color || '#3b82f6';
      stripe.title = t('containerLabel', { name: containerMeta.name });
      item.appendChild(stripe);
    }

    // 1. Favicon 圖示
    const faviconContainer = document.createElement('div');
    faviconContainer.className = 'tab-favicon';
    faviconContainer.appendChild(this.createFavicon(tab));
    item.appendChild(faviconContainer);

    // 2. 標題與休眠月亮圖示
    const titleWrapper = document.createElement('div');
    titleWrapper.className = 'tab-title-wrapper';

    if (tab.discarded) {
      const moon = document.createElement('span');
      moon.className = 'tab-discarded-icon';
      moon.textContent = '🌙';
      moon.title = t('discardedTooltip');
      titleWrapper.appendChild(moon);
    }

    const titleEl = document.createElement('span');
    titleEl.className = 'tab-title';
    titleEl.textContent = tab.title || t('defaultTabTitle');
    titleWrapper.appendChild(titleEl);

    item.appendChild(titleWrapper);

    // 3. 右側動作區 (音訊、關閉)
    const actionsEl = document.createElement('div');
    actionsEl.className = 'tab-actions';

    // 音訊狀態與靜音控制
    if (tab.audible || (tab.mutedInfo && tab.mutedInfo.muted)) {
      const isMuted = Boolean(tab.mutedInfo && tab.mutedInfo.muted);
      const audioBtn = document.createElement('button');
      audioBtn.className = 'audio-indicator icon-btn';
      audioBtn.title = isMuted ? t('unmuteTab') : t('muteTab');
      audioBtn.innerHTML = isMuted ? `
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
        </svg>
      ` : `
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
      `;
      audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        TabService.setTabMuted(tab.id, !isMuted);
      });
      actionsEl.appendChild(audioBtn);
    }

    // 關閉按鈕
    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close-btn';
    closeBtn.title = t('closeTabTooltip');
    closeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="14" height="14">
        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
      </svg>
    `;
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      TabService.closeTab(tab.id);
    });
    actionsEl.appendChild(closeBtn);

    item.appendChild(actionsEl);

    // 點擊事件 (支援多選 Ctrl/Cmd 與 Shift，正常點擊則切換分頁)
    item.addEventListener('click', (e) => {
      if (onTabClick) {
        onTabClick(e, tab);
      } else {
        TabService.activateTab(tab.id);
      }
    });

    // 右鍵選單
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      onContextMenu(e, tab);
    });

    // 拖曳處理
    this.setupDragEvents(item, tab, { onDragStart, onDragEnd, getDraggedTabId });

    return item;
  }

  static createFavicon(tab) {
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

  static createFallbackIcon(title) {
    const div = document.createElement('div');
    div.className = 'fallback-favicon';
    div.textContent = title ? title.trim().charAt(0) : '?';
    return div;
  }

  static setupDragEvents(element, tab, { onDragStart, onDragEnd, getDraggedTabId }) {
    element.addEventListener('dragstart', (e) => {
      onDragStart(tab.id, e);
      element.style.opacity = '0.5';
    });

    element.addEventListener('dragend', () => {
      onDragEnd();
      element.style.opacity = '1';
      document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.remove('drag-over-top', 'drag-over-bottom');
      });
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = element.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;

      element.classList.toggle('drag-over-top', isTop);
      element.classList.toggle('drag-over-bottom', !isTop);
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      element.classList.remove('drag-over-top', 'drag-over-bottom');

      const draggedId = getDraggedTabId();
      if (draggedId === null || draggedId === tab.id) return;

      const rect = element.getBoundingClientRect();
      const isTop = e.clientY < rect.top + rect.height / 2;
      const targetIndex = isTop ? tab.index : tab.index + 1;

      try {
        await TabService.moveTab(draggedId, targetIndex);

        // 若目標屬於某個群組，自動將拖入分頁加入該群組
        if (tab.groupId && tab.groupId !== -1) {
          await TabService.groupTabs([draggedId], tab.groupId);
        }
      } catch (err) {
        console.error('TabItemComponent drop error:', err);
      }
    });
  }
}
