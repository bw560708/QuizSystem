# 開發進度

更新時間：2026-06-27

## 已完成

1. 建立單機版刷題系統專案結構。
2. 支援 Excel `.xlsx` 題庫匯入。
3. 支援 CSV `.csv` 題庫匯入。
4. 題庫匯入後自動產生數字流水題號，例如 `1`、`2`、`3`。
5. 可在「全部題庫」查看所有匯入題目、四個選項、答案與題型。
6. 支援單選題與多選題，並依答案數量自動判斷題型。
7. 支援隨機出題與自訂題數，不重複抽題。
8. 完成刷題畫面、上一題、下一題、修改答案與交卷。
9. 完成自動計分，支援自訂滿分。
10. 完成錯題統計、錯題本、重點提醒與清除錯題紀錄。
11. 使用 `localStorage` 保存題庫、作答紀錄、錯題紀錄、錯誤次數、重點提醒與滿分設定。
12. 保留 ES Modules 模組化架構。
13. 新增 standalone.js 作為雙擊 index.html 時的離線 fallback。
14. 新增 PWA 支援：manifest、Service Worker、離線快取、icons、splash。
15. 補強 RWD 樣式，支援手機、平板與桌面裝置。

## 目前支援題庫格式

Excel / CSV 欄位固定為：

```text
題目, 選項A, 選項B, 選項C, 選項D, 正確答案
```

單選答案範例：

```text
A
```

多選答案範例：

```text
A,C,D
```

CSV 多選欄位建議加雙引號：

```csv
題目,選項A,選項B,選項C,選項D,正確答案
下列哪些是前端技術？,HTML,CSS,JavaScript,SQL Server,"A,B,C"
```

## 主要修改檔案

- `index.html`
- `css/base.css`
- `css/layout.css`
- `css/components.css`
- `css/theme.css`
- `js/app.js`
- `js/excelImport.js`
- `js/csvImport.js`
- `js/quiz.js`
- `js/scoring.js`
- `js/storage.js`
- `js/wrongbook.js`
- `js/randomQuiz.js`
- `js/ui.js`
- `js/standalone.js`
- `data/sampleQuestions.json`
- `data/sampleQuestions.csv`
- `README.md`

## 驗證紀錄

- 所有 ES Module JavaScript 檔案已通過語法檢查。
- `standalone.js` 已通過語法檢查。
- CSV parser 已實測：
  - `"A,B,C"` 會解析為多選題。
  - `A` 會解析為單選題。
- 題號流水號邏輯已實測：
  - 舊題加新匯入題會得到 `["1","2","3","4"]`。

## 後續可做

1. 增加題庫搜尋與篩選。
2. 增加題庫匯出功能。
3. 增加作答紀錄詳細回看。
4. 增加錯題依錯誤次數排序與篩選。
5. 增加匯入前預覽與欄位錯誤提示。


