/**
 * 分頁群組元件 (TabGroup)
 */
import { GROUP_COLORS, DEFAULT_GROUP_COLOR } from '../config/constants.js';
import { TabService } from '../services/tabService.js';
import { t } from '../i18n/index.js';

export class TabGroupComponent {
  /**
   * 建立群組 DOM 節點
   */
  static create(group, { isCollapsed, tabCount, onToggleCollapse, onContextMenu, getDraggedTabId }) {
    const container = document.createElement('div');
    container.className = `tab-group-container ${isCollapsed ? 'collapsed' : ''}`;
    container.dataset.groupId = group.id;

    const colorDef = GROUP_COLORS[group.color] || GROUP_COLORS[DEFAULT_GROUP_COLOR];

    // 1. 群組標題列
    const header = document.createElement('div');
    header.className = 'tab-group-header';
    header.dataset.groupId = group.id;

    // 左側藥丸 (Pill)
    const pill = document.createElement('div');
    pill.className = 'group-left-pill';
    pill.style.backgroundColor = colorDef.bg;
    pill.style.color = colorDef.main;

    const dot = document.createElement('div');
    dot.className = 'group-color-dot';
    dot.style.backgroundColor = colorDef.main;
    pill.appendChild(dot);

    const titleText = document.createElement('span');
    titleText.className = 'group-title-text';
    titleText.textContent = group.title || t('defaultGroupTitle');
    pill.appendChild(titleText);

    const countSpan = document.createElement('span');
    countSpan.className = 'group-count';
    countSpan.textContent = `(${tabCount})`;
    pill.appendChild(countSpan);

    header.appendChild(pill);

    // 右側箭頭指示
    const chevron = document.createElement('div');
    chevron.className = 'group-chevron';
    chevron.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16">
        <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/>
      </svg>
    `;
    header.appendChild(chevron);

    // 點擊收合/展開
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleCollapse(group.id);
    });

    // 右鍵選單
    header.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      onContextMenu(e, group);
    });

    // 支援直接將分頁拖曳丟入群組標題
    this.setupGroupDropEvents(header, group.id, getDraggedTabId);

    container.appendChild(header);

    // 2. 群組分頁列表容器
    const tabsListContainer = document.createElement('div');
    tabsListContainer.className = 'group-tabs-list';
    tabsListContainer.style.borderColor = colorDef.main;
    container.appendChild(tabsListContainer);

    return {
      container,
      tabsListContainer
    };
  }

  static setupGroupDropEvents(header, groupId, getDraggedTabId) {
    header.addEventListener('dragover', (e) => {
      e.preventDefault();
      header.classList.add('drag-over');
    });

    header.addEventListener('dragleave', () => {
      header.classList.remove('drag-over');
    });

    header.addEventListener('drop', async (e) => {
      e.preventDefault();
      header.classList.remove('drag-over');

      const draggedId = getDraggedTabId();
      if (draggedId !== null) {
        try {
          await TabService.groupTabs([draggedId], groupId);
        } catch (err) {
          console.error('TabGroup drop error:', err);
        }
      }
    });
  }
}
