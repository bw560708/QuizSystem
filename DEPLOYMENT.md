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

## 專有名詞中文對照

| 英文 | 中文說明 |
| --- | --- |
| Git | 版本控制工具，用來記錄每次修改 |
| Repository / Repo | 程式碼倉庫、專案儲存庫 |
| Local Repository | 本機倉庫，存在自己電腦上的 Git 專案 |
| Remote Repository | 遠端倉庫，存在 GitHub 上的專案 |
| Commit | 提交紀錄，一次儲存的修改版本 |
| Branch | 分支，用來區分不同版本線 |
| main Branch | 主分支，正式網站通常使用這個分支部署 |
| Push | 推送，把本機 commit 上傳到 GitHub |
| Pull | 拉取，把 GitHub 上的更新下載回本機 |
| GitHub Pages | GitHub 靜態網站部署服務 |
| Source | 部署來源，GitHub Pages 要讀取哪個分支與資料夾 |
| /root | 專案根目錄，也就是 `index.html` 所在的最外層資料夾 |
| /docs | 文件資料夾，有些專案會把網站放在這裡部署 |
| PWA | 漸進式網頁應用程式，可像 App 一樣加入主畫面 |
| Manifest | 網站應用程式設定檔，定義名稱、圖示、顏色與啟動方式 |
| Service Worker | 背景服務程式，負責離線快取與攔截網路請求 |
| Offline Cache | 離線快取，讓網站在沒有網路時仍可開啟已快取內容 |
| Icon | 網站圖示，加入主畫面或安裝時會顯示 |
| Splash Screen | 啟動畫面，手機開啟 PWA 時短暫顯示的畫面 |
| Theme Color | 主題顏色，影響瀏覽器工具列或 PWA 外觀 |
| Background Color | 背景顏色，PWA 啟動時的底色 |
| RWD / Responsive Web Design | 響應式網頁設計，讓同一網站自動適應手機、平板、電腦 |
| Media Query | CSS 媒體查詢，依螢幕寬度套用不同版面樣式 |
| GitHub CLI / gh | GitHub 命令列工具，可用指令建立 repo、登入與推送 |
| HTTPS | 加密網頁連線，PWA 與 Service Worker 正式啟用通常需要它 |
| localhost | 本機測試網址，常用來在自己電腦測試網站 |
| Deploy | 部署，把網站發布到正式網址 |
| Redeploy | 重新部署，網站有新 commit 後重新發布 |
