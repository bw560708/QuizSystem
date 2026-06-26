# GitHub Pages 與 PWA 部署說明

## 目前部署策略

本專案是純靜態網站，最適合使用 GitHub Pages：

- Branch：`main`
- Folder：`/root`
- 首頁：`index.html`

GitHub Pages 啟用後，只要 `main` branch 有新的 commit，網站會自動重新部署。

## PWA 支援

已加入：

- `manifest.json`
- `service-worker.js`
- Offline Cache
- Android Chrome 加入主畫面支援
- iPhone Safari 加入主畫面支援
- PWA icons
- Apple touch icon
- iPhone startup splash image
- Theme Color
- Background Color

首次在線上網址開啟後，Service Worker 會快取網站必要檔案。之後離線時可依已快取內容繼續使用刷題系統。

## Android 安裝方式

1. 使用 Chrome 開啟 GitHub Pages 網址。
2. 等待頁面載入完成。
3. 點選 Chrome 選單。
4. 選擇「安裝應用程式」或「加入主畫面」。
5. 安裝後可從桌面圖示開啟。

## iPhone 安裝方式

1. 使用 Safari 開啟 GitHub Pages 網址。
2. 點選分享按鈕。
3. 選擇「加入主畫面」。
4. 確認名稱後新增。
5. 之後可從主畫面圖示開啟。

## 日後更新網站流程

```bash
git add .
git commit -m "update site"
git push origin main
```

推送成功後，GitHub Pages 會自動重新部署。

## 重新部署方式

一般情況不需要手動重新部署，只要重新 push `main` branch 即可。

若 GitHub Pages 沒有更新：

1. 到 GitHub Repository。
2. 開啟 Settings。
3. 進入 Pages。
4. 確認 Source 是 `Deploy from a branch`。
5. 確認 Branch 是 `main`，Folder 是 `/root`。
6. 等待 GitHub Pages 顯示最新部署狀態。

## 尚待人工完成

目前本機未安裝 GitHub CLI `gh`，因此遠端 Repository 建立、推送與 Pages 啟用需要你完成 GitHub 登入與授權後才能繼續。
