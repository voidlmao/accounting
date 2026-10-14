# accounting.

免費、無須安裝套件的繁體中文個人記帳網頁。可在手機、平板與電腦操作，支援 GitHub Pages。

## 功能

- 新增、編輯、刪除收入與支出
- 月份切換、收支摘要、分類圓環統計
- 每月預算及使用進度
- 搜尋與收支篩選
- JSON 備份及還原、CSV 匯出
- 手機響應式版面；支援加入主畫面及離線使用（首次連網載入後）

## 在 GitHub Pages 免費上線

1. 登入 [GitHub](https://github.com)，建立名稱為 `accounting` 的 **Public** repository。
2. 在 repository 的 **Add file → Upload files**，上傳此專案中的 `index.html`、`style.css`、`app.js`、`icon.svg`、`icon-192.png`、`icon-512.png`、`apple-touch-icon.png`、`manifest.webmanifest`、`sw.js`、`.nojekyll`（及可選的 `README.md`），提交到 `main` 分支。**不要直接上傳 ZIP**；需先解壓縮。
3. 開啟 **Settings → Pages**，在 **Build and deployment** 將 Source 設為 **Deploy from a branch**，選擇 `main` / `/(root)`，按 **Save**。
4. GitHub 完成部署後，網址通常是 `https://<你的GitHub帳號>.github.io/accounting/`。

## 使用及資料安全

- 記錄只存於瀏覽器的 `localStorage`，沒有後端、登入系統或雲端同步。
- 清除網站資料、更換瀏覽器或裝置，可能看不到原本的資料。請定期到右上角「設定與資料」匯出 JSON；在另一裝置匯入該檔可移轉記錄。
- GitHub repository 公開的是**程式碼**，不是你在網頁中輸入的記帳資料。**請勿將匯出的 JSON / CSV 備份上傳到公開 repo。**
- 若使用瀏覽器的無痕模式，資料可能在關閉後消失。
- 此專案不連結銀行帳號、不涉及真實金流。

## 本機預覽

直接用瀏覽器開啟 `index.html` 可以測試多數功能。若要測試離線/PWA，請在本機啟動靜態 HTTP 伺服器：

```bash
python3 -m http.server 8000
```

在瀏覽器開啟 http://localhost:8000/ 。
