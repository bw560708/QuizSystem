# 電腦單機版選擇題刷題系統

這是一套純 HTML、CSS、JavaScript ES Modules 製作的離線刷題系統，不使用前端框架、Node.js、後端或資料庫。

## 使用方式

1. 開啟 `index.html`。
2. 匯入 `.xlsx` 或 `.csv` 題庫，或載入範例題庫。
3. 可在「全部題庫」查看已匯入的全部題目、選項與答案。
4. 設定本次題數與滿分。
5. 開始刷題並交卷。
6. 到錯題本查看錯題、重點提醒與清除紀錄。

## Excel / CSV 題庫格式

第一列可以是標題列，系統會自動略過。匯入後系統會自動產生數字流水號題號，例如 `1`、`2`、`3`。

| 題目 | 選項A | 選項B | 選項C | 選項D | 正確答案 |
| --- | --- | --- | --- | --- | --- |
| TCP 是什麼？ | 網路協定 | 作業系統 | CPU | 記憶體 | A |
| 下列哪些是前端技術？ | HTML | CSS | JavaScript | SQL Server | A,B,C |

答案只有一個時為單選題；多個答案以逗號分隔，會自動判定為多選題。
CSV 範例：

```csv
題目,選項A,選項B,選項C,選項D,正確答案
TCP 是什麼？,網路協定,作業系統,CPU,記憶體,A
下列哪些是前端技術？,HTML,CSS,JavaScript,SQL Server,"A,B,C"
```

## 本機資料

系統使用 `localStorage` 保存：

- 題庫
- 作答紀錄
- 錯題紀錄
- 每題錯誤次數
- 重點提醒狀態
- 滿分設定

所有資料都只保存在目前瀏覽器，不會上傳。

## 專案結構

```text
QuizSystem/
  index.html
  css/
    base.css
    layout.css
    components.css
    theme.css
  js/
    app.js
    excelImport.js
    csvImport.js
    quiz.js
    scoring.js
    storage.js
    wrongbook.js
    randomQuiz.js
    ui.js
    standalone.js
  data/
    sampleQuestions.json
    sampleQuestions.csv
  README.md
```

## 注意事項

`.xlsx` 是 ZIP 格式，系統使用瀏覽器內建 `DecompressionStream` 離線解壓縮。若瀏覽器版本過舊，請改用支援此 API 的新版 Chrome、Edge 或 Firefox。

## 雙擊開啟相容性

主要程式仍使用 ES Modules 拆分在 `js/` 各模組中。部分瀏覽器直接以 `file://` 雙擊開啟時，可能會限制多檔 module 載入；此時 `index.html` 會自動載入 `js/standalone.js` 作為離線 fallback，確保單機使用者仍可操作。





## GitHub Pages 與 PWA

本專案已加入 GitHub Pages 部署與 PWA 所需檔案。詳細部署、安裝與更新流程請見 `DEPLOYMENT.md`。
