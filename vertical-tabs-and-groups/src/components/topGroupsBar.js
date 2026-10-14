/**
 * 頂部群組導覽列元件 (TopGroupsBar)
 * 於側邊欄最上方即時顯示當前開啟的所有群組標籤，點擊可快速跳轉並展開對應群組
 */
import { GROUP_COLORS, DEFAULT_GROUP_COLOR } from '../config/constants.js';
import { t } from '../i18n/index.js';

export class TopGroupsBarComponent {
  constructor({ containerId = 'topGroupsBar', onCreateGroup, onSelectGroup }) {
    this.container = document.getElementById(containerId);
    this.onCreateGroup = onCreateGroup;
    this.onSelectGroup = onSelectGroup;
  }

  render(tabGroupsMap, allTabs) {
    if (!this.container) return;
    this.container.innerHTML = '';

    const groups = Array.from(tabGroupsMap.values());

    // 建立頂部導覽列外層
    const barWrapper = document.createElement('div');
    barWrapper.className = 'top-groups-wrapper';

    // 1. 新增群組快速按鈕
    const addGroupBtn = document.createElement('button');
    addGroupBtn.className = 'top-group-add-btn';
    addGroupBtn.title = t('createGroupBtn');
    addGroupBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="13" height="13">
        <path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
      </svg>
      <span>${t('createGroupBtn')}</span>
    `;
    addGroupBtn.addEventListener('click', () => {
      if (this.onCreateGroup) this.onCreateGroup();
    });
    barWrapper.appendChild(addGroupBtn);

    // 2. 當前群組藥丸列表
    const chipsList = document.createElement('div');
    chipsList.className = 'top-group-chips-list';

    if (groups.length === 0) {
      const emptySpan = document.createElement('span');
      emptySpan.className = 'top-group-empty-hint';
      emptySpan.textContent = t('noGroupsPrompt');
      chipsList.appendChild(emptySpan);
    } else {
      groups.forEach(group => {
        const colorDef = GROUP_COLORS[group.color] || GROUP_COLORS[DEFAULT_GROUP_COLOR];
        const groupTabsCount = allTabs.filter(t => t.groupId === group.id).length;

        const chip = document.createElement('button');
        chip.className = 'top-group-chip';
        chip.dataset.groupId = group.id;
        chip.title = `${group.title || t('defaultGroupTitle')} (${groupTabsCount})`;
        chip.style.backgroundColor = colorDef.bg;
        chip.style.color = colorDef.main;
        chip.style.borderColor = colorDef.main;

        // 色彩圓點
        const dot = document.createElement('span');
        dot.className = 'top-group-chip-dot';
        dot.style.backgroundColor = colorDef.main;
        chip.appendChild(dot);

        // 群組名稱
        const titleSpan = document.createElement('span');
        titleSpan.className = 'top-group-chip-title';
        titleSpan.textContent = group.title || t('defaultGroupTitle');
        chip.appendChild(titleSpan);

        // 分頁數量
        const countSpan = document.createElement('span');
        countSpan.className = 'top-group-chip-count';
        countSpan.textContent = groupTabsCount;
        chip.appendChild(countSpan);

        // 點擊事件：快速平滑滾動至該群組並高亮
        chip.addEventListener('click', () => {
          if (this.onSelectGroup) {
            this.onSelectGroup(group.id);
          }
        });

        chipsList.appendChild(chip);
      });
    }

    barWrapper.appendChild(chipsList);
    this.container.appendChild(barWrapper);
  }
}
