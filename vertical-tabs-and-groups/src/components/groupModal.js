/**
 * 編輯/新增分頁群組彈窗元件 (GroupModal)
 */
import { GROUP_COLORS, DEFAULT_GROUP_COLOR, getColorName } from '../config/constants.js';
import { TabService } from '../services/tabService.js';
import { t } from '../i18n/index.js';

export class GroupModalComponent {
  constructor({ modalId = 'groupModal', onSaved }) {
    this.modalEl = document.getElementById(modalId);
    this.modalTitleEl = document.getElementById('modalTitle');
    this.nameInput = document.getElementById('groupNameInput');
    this.colorGrid = document.getElementById('colorPickerGrid');
    this.closeBtn = document.getElementById('closeModalBtn');
    this.cancelBtn = document.getElementById('cancelModalBtn');
    this.saveBtn = document.getElementById('saveModalBtn');

    this.onSaved = onSaved;
    this.activeGroupId = null;
    this.isCreateMode = false;
    this.selectedColor = DEFAULT_GROUP_COLOR;
    this.storeRef = null;

    this.initEvents();
  }

  initEvents() {
    this.closeBtn.addEventListener('click', () => this.close());
    this.cancelBtn.addEventListener('click', () => this.close());
    this.saveBtn.addEventListener('click', () => this.save());

    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.save();
      }
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.modalEl && this.modalEl.style.display !== 'none';
  }

  /**
   * 開啟新增群組對話框
   */
  openCreate(store) {
    this.storeRef = store;
    this.isCreateMode = true;
    this.activeGroupId = null;

    if (this.modalTitleEl) {
      this.modalTitleEl.textContent = t('createGroupTitle');
    }
    if (this.saveBtn) {
      this.saveBtn.textContent = t('create');
    }

    this.nameInput.value = '';
    this.selectedColor = DEFAULT_GROUP_COLOR;

    this.renderColorPicker();
    this.modalEl.style.display = 'flex';
    this.nameInput.focus();
  }

  /**
   * 開啟編輯現有群組對話框
   */
  openEdit(groupId, store) {
    this.storeRef = store;
    this.isCreateMode = false;
    this.activeGroupId = groupId;
    const group = store.tabGroupsMap.get(groupId);

    if (this.modalTitleEl) {
      this.modalTitleEl.textContent = t('editGroupTitle');
    }
    if (this.saveBtn) {
      this.saveBtn.textContent = t('save');
    }

    this.nameInput.value = group ? group.title : '';
    this.selectedColor = (group && group.color) ? group.color : DEFAULT_GROUP_COLOR;

    this.renderColorPicker();
    this.modalEl.style.display = 'flex';
    this.nameInput.focus();
    this.nameInput.select();
  }

  // 兼容舊介面
  open(groupId, store) {
    if (groupId) {
      this.openEdit(groupId, store);
    } else {
      this.openCreate(store);
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.style.display = 'none';
    }
    this.activeGroupId = null;
    this.isCreateMode = false;
  }

  renderColorPicker() {
    this.colorGrid.replaceChildren();

    Object.keys(GROUP_COLORS).forEach(colorKey => {
      const circle = document.createElement('div');
      circle.className = `color-circle ${colorKey === this.selectedColor ? 'selected' : ''}`;
      circle.style.backgroundColor = GROUP_COLORS[colorKey].main;
      circle.dataset.color = colorKey;
      circle.title = getColorName(colorKey);

      circle.addEventListener('click', () => {
        this.colorGrid.querySelectorAll('.color-circle').forEach(c => c.classList.remove('selected'));
        circle.classList.add('selected');
        this.selectedColor = colorKey;
      });

      this.colorGrid.appendChild(circle);
    });
  }

  async save() {
    const newTitle = this.nameInput.value.trim();

    if (this.isCreateMode) {
      // 1. 新增模式：找尋當前活躍分頁或建立新分頁成群組
      let targetTab = this.storeRef?.allTabs?.find(t => t.active);
      if (!targetTab && this.storeRef?.allTabs?.length > 0) {
        targetTab = this.storeRef.allTabs[0];
      }

      try {
        let tabIdToGroup = targetTab?.id;
        if (!tabIdToGroup) {
          const newTab = await TabService.createTab({ active: true });
          tabIdToGroup = newTab.id;
        }

        const newGroupId = await TabService.groupTabs([tabIdToGroup]);
        if (newGroupId && TabService.hasTabGroupsSupport()) {
          await TabService.updateGroup(newGroupId, {
            title: newTitle || t('defaultGroupTitle'),
            color: this.selectedColor
          });
        }
      } catch (err) {
        console.error('GroupModal create group error:', err);
      }
    } else if (this.activeGroupId !== null) {
      // 2. 編輯模式：更新現有群組
      if (TabService.hasTabGroupsSupport()) {
        try {
          await TabService.updateGroup(this.activeGroupId, {
            title: newTitle,
            color: this.selectedColor
          });
        } catch (err) {
          console.error('GroupModal save error:', err);
        }
      }
    }

    this.close();
    if (this.onSaved) {
      this.onSaved();
    }
  }
}
