# 垂直分頁與分頁群組 (Vertical Tabs & Tab Groups)

**垂直分頁與分頁群組** 是一款專為 Mozilla Firefox 打造的高效側邊欄垂直分頁附加元件，完美整合原生分頁管理與現代化的生產力增強功能。

---

## 🌟 核心特色 (Features)

1. **側邊欄垂直分頁**：直覺易用的左側垂直分頁列，標題一目了然，支援頂部固定分頁 (Pinned Tabs) 網格收納。
2. **原生沿用 Firefox 分頁群組 (Tab Groups)**：完全雙向同步 Firefox 原生分頁群組狀態、顏色標籤與收合展開。
3. **頂部群組導覽列 (Top Groups Bar)**：即時顯示所有群組膠囊，點擊一秒平滑滾動並展開高亮該群組。
4. **分頁休眠省電模式 (Sleeping Tabs / Discard)**：自動與手動釋放背景分頁記憶體（RAM），點擊即瞬間喚醒。
5. **批次多選操作 (Multi-Tab Selection)**：支援 `Ctrl` / `Cmd` / `Shift` 多選分頁，一鍵批次拖曳、批次關閉或群組化。
6. **一鍵關閉重複分頁 (Close Duplicates)**：智慧比對並清理重複網址，保留活躍與固定分頁。
7. **Firefox 多帳號容器整合 (Multi-Account Containers)**：自動標示容器專屬色彩細線與名稱。
8. **復原最近關閉的分頁 (Undo Close Tab)**：專屬快捷按鈕與 `Ctrl+Shift+T` 一鍵還原。
9. **智慧排序與自動分群 (Smart Sorting)**：一鍵按網域排序、按標題排序或依網域自動分群。
10. **外觀自訂與雙語系支援**：緊湊檢視模式 (27px)、自動收合非活躍群組，並內建繁體中文與英文自動切換。

---

## 📦 Firefox 上架 (AMO) 步驟指南

本目錄已完全依照 **Mozilla Add-ons (AMO)** 最新 Manifest V3 規範封裝完成。

### 步驟 1：打包擴充套件為 ZIP 檔
在終端機中進入此資料夾，執行以下指令建立上架專用壓縮檔：
```bash
cd vertical-tabs-and-groups
zip -r ../vertical-tabs-and-groups-v1.0.0.zip . -x "*.DS_Store"
```
（在專案外層產生的 `vertical-tabs-and-groups-v1.0.0.zip` 即可直接上傳）

### 步驟 2：登入 Mozilla 附加元件開發者中心
1. 前往 [Firefox Add-on Developer Hub](https://addons.mozilla.org/developers/)。
2. 點擊 **「送出新附加元件 (Submit a New Add-on)」**。
3. 選擇發布形式：
   * **在 AMO 上公開分發 (On this site)**：讓全球 Firefox 使用者在商店中搜尋並安裝。
   * **自行分發 (On your own)**：由 Mozilla 簽名後自行提供 `.xpi` 檔案給使用者下載。

### 步驟 3：上傳並填寫資料
1. 上傳剛剛打包好的 `vertical-tabs-and-groups-v1.0.0.zip`。
2. 系統會自動通過 AMO 驗證工具（Validation）。
3. 填寫附加元件介紹、螢幕截圖與分類標籤（例如：*Tabs & Bookmarks*）。
4. 送出審核，審核通過後即正式於 Firefox 上架！

---

## 🛠️ 本地開發與測試方式

1. 打開 Firefox，在網址列輸入：
   ```text
   about:debugging#/runtime/this-firefox
   ```
2. 點擊 **「載入暫時附加元件...」**。
3. 選擇本資料夾中的 **`manifest.json`**：
   ```text
   vertical-tabs-and-groups/manifest.json
   ```
4. 在 Firefox 側邊欄切換為 **「垂直分頁與分頁群組」** 即可立即測試。
