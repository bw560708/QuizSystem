import { parseExcelQuestions, normalizeSampleQuestions } from "./excelImport.js";
import { parseCsvQuestions } from "./csvImport.js";
import {
  addHistory,
  appendQuestions,
  clearQuestions,
  getHistories,
  getQuestions,
  getSettings,
  getWrongRecords,
  saveSettings
} from "./storage.js";
import { createQuizSession, getCurrentQuestion, moveQuestion, setQuestionAnswer } from "./quiz.js";
import { scoreQuiz } from "./scoring.js";
import { clearAllWrongRecords, clearWrongRecord, getWrongBookItems, updateWrongRecords } from "./wrongbook.js";
import { clearElement, createEmptyState, formatAnswers, query, setMessage, showView } from "./ui.js";

let quizSession = null;
const fallbackSampleQuestions = [
  {
    question: "TCP 是什麼？",
    options: { A: "網路協定", B: "作業系統", C: "CPU", D: "記憶體" },
    answers: ["A"]
  },
  {
    question: "下列哪些屬於前端基礎技術？",
    options: { A: "HTML", B: "CSS", C: "JavaScript", D: "SQL Server" },
    answers: ["A", "B", "C"]
  },
  {
    question: "localStorage 的資料主要保存在哪裡？",
    options: { A: "使用者本機瀏覽器", B: "遠端資料庫", C: "雲端主機", D: "郵件伺服器" },
    answers: ["A"]
  }
];

const elements = {
  questionBankCount: query("#questionBankCount"),
  wrongCount: query("#wrongCount"),
  excelFileInput: query("#excelFileInput"),
  importExcelButton: query("#importExcelButton"),
  loadSampleButton: query("#loadSampleButton"),
  clearBankButton: query("#clearBankButton"),
  importMessage: query("#importMessage"),
  bankPreviewCount: query("#bankPreviewCount"),
  questionPreviewList: query("#questionPreviewList"),
  questionCountSelect: query("#questionCountSelect"),
  customCountField: query("#customCountField"),
  customQuestionCount: query("#customQuestionCount"),
  fullScoreInput: query("#fullScoreInput"),
  wrongOnlyToggle: query("#wrongOnlyToggle"),
  availableQuestionCount: query("#availableQuestionCount"),
  startQuizButton: query("#startQuizButton"),
  setupMessage: query("#setupMessage"),
  quizProgress: query("#quizProgress"),
  quizType: query("#quizType"),
  submitQuizButton: query("#submitQuizButton"),
  currentQuestionId: query("#currentQuestionId"),
  currentQuestionText: query("#currentQuestionText"),
  optionList: query("#optionList"),
  previousQuestionButton: query("#previousQuestionButton"),
  nextQuestionButton: query("#nextQuestionButton"),
  resultSummaryBadge: query("#resultSummaryBadge"),
  scoreSummary: query("#scoreSummary"),
  resultList: query("#resultList"),
  reviewWrongButton: query("#reviewWrongButton"),
  newQuizButton: query("#newQuizButton"),
  wrongBookCount: query("#wrongBookCount"),
  practiceWrongButton: query("#practiceWrongButton"),
  clearAllWrongButton: query("#clearAllWrongButton"),
  wrongBookList: query("#wrongBookList"),
  historyCount: query("#historyCount"),
  historyList: query("#historyList")
};

/**
 * Initializes the application after module loading.
 * @returns {void}
 */
function initApp() {
  const settings = getSettings();
  elements.fullScoreInput.value = settings.fullScore || 100;
  bindEvents();
  refreshAll();
}

/**
 * Registers DOM event handlers.
 * @returns {void}
 */
function bindEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
      refreshAll();
    });
  });
  elements.importExcelButton.addEventListener("click", handleExcelImport);
  elements.loadSampleButton.addEventListener("click", handleSampleLoad);
  elements.clearBankButton.addEventListener("click", handleClearBank);
  elements.questionCountSelect.addEventListener("change", handleQuestionCountChange);
  elements.fullScoreInput.addEventListener("change", persistSettings);
  elements.startQuizButton.addEventListener("click", () => startQuiz(false));
  elements.previousQuestionButton.addEventListener("click", () => moveAndRender(-1));
  elements.nextQuestionButton.addEventListener("click", () => moveAndRender(1));
  elements.submitQuizButton.addEventListener("click", submitQuiz);
  elements.reviewWrongButton.addEventListener("click", () => {
    showView("wrongBookView");
    refreshAll();
  });
  elements.newQuizButton.addEventListener("click", () => showView("practiceSetupView"));
  elements.practiceWrongButton.addEventListener("click", () => {
    elements.wrongOnlyToggle.checked = true;
    showView("practiceSetupView");
    refreshAll();
  });
  elements.clearAllWrongButton.addEventListener("click", () => {
    clearAllWrongRecords();
    refreshAll();
  });
}

/**
 * Imports questions from a selected XLSX or CSV file.
 * @returns {Promise<void>}
 */
async function handleExcelImport() {
  const file = elements.excelFileInput.files[0];
  if (!file) {
    setMessage(elements.importMessage, "請先選擇 .xlsx 或 .csv 題庫檔案。", "error");
    return;
  }

  try {
    const questions = await parseQuestionFile(file);
    if (!questions.length) {
      setMessage(elements.importMessage, "未匯入任何題目，請確認欄位與答案格式。", "error");
      return;
    }
    appendQuestions(questions);
    setMessage(elements.importMessage, `已匯入 ${questions.length} 題。`, "success");
    refreshAll();
  } catch (error) {
    setMessage(elements.importMessage, error.message || "題庫匯入失敗。", "error");
  }
}


/**
 * Parses an imported question file by extension.
 * @param {File} file
 * @returns {Promise<Array>}
 */
async function parseQuestionFile(file) {
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith(".csv")) {
    return parseCsvQuestions(await file.text());
  }
  if (fileName.endsWith(".xlsx")) {
    return parseExcelQuestions(await file.arrayBuffer());
  }
  throw new Error("僅支援 .xlsx 或 .csv 題庫檔案。");
}
/**
 * Loads bundled sample questions from the data folder.
 * @returns {Promise<void>}
 */
async function handleSampleLoad() {
  try {
    const response = await fetch("./data/sampleQuestions.json");
    const rows = await response.json();
    const questions = normalizeSampleQuestions(rows);
    appendQuestions(questions);
    setMessage(elements.importMessage, `已載入範例題庫 ${questions.length} 題。`, "success");
    refreshAll();
  } catch {
    const questions = normalizeSampleQuestions(fallbackSampleQuestions);
    appendQuestions(questions);
    setMessage(elements.importMessage, `已載入內建範例題庫 ${questions.length} 題。`, "success");
    refreshAll();
  }
}

/**
 * Clears all questions after confirmation.
 * @returns {void}
 */
function handleClearBank() {
  if (!confirm("確定要清空題庫？錯題紀錄仍會保留，但沒有題庫時無法練習。")) {
    return;
  }
  clearQuestions();
  refreshAll();
  setMessage(elements.importMessage, "題庫已清空。", "success");
}

/**
 * Shows or hides the custom question count input.
 * @returns {void}
 */
function handleQuestionCountChange() {
  elements.customCountField.classList.toggle("is-hidden", elements.questionCountSelect.value !== "custom");
}

/**
 * Saves score settings into localStorage.
 * @returns {void}
 */
function persistSettings() {
  saveSettings({ fullScore: Number(elements.fullScoreInput.value) || 100 });
}

/**
 * Starts a new quiz from all questions or wrong questions.
 * @param {boolean} forceWrongOnly
 * @returns {void}
 */
function startQuiz(forceWrongOnly) {
  persistSettings();
  const allQuestions = getQuestions();
  const wrongOnly = forceWrongOnly || elements.wrongOnlyToggle.checked;
  const questions = wrongOnly ? getWrongBookItems(allQuestions).map((item) => item.question) : allQuestions;
  const requestedCount = getRequestedQuestionCount();

  if (!questions.length) {
    setMessage(elements.setupMessage, wrongOnly ? "目前沒有可練習的錯題。" : "請先匯入題庫。", "error");
    return;
  }

  quizSession = createQuizSession(questions, requestedCount);
  showView("quizView");
  renderCurrentQuestion();
}

/**
 * Returns the requested quiz count.
 * @returns {number}
 */
function getRequestedQuestionCount() {
  if (elements.questionCountSelect.value === "custom") {
    return Math.max(1, Number(elements.customQuestionCount.value) || 1);
  }
  return Number(elements.questionCountSelect.value);
}

/**
 * Moves to another question and updates the view.
 * @param {number} step
 * @returns {void}
 */
function moveAndRender(step) {
  if (!quizSession) {
    return;
  }
  moveQuestion(quizSession, step);
  renderCurrentQuestion();
}

/**
 * Renders the active quiz question.
 * @returns {void}
 */
function renderCurrentQuestion() {
  const question = getCurrentQuestion(quizSession);
  if (!question) {
    return;
  }

  elements.quizProgress.textContent = `第 ${quizSession.currentIndex + 1} 題 / 共 ${quizSession.questions.length} 題`;
  elements.quizType.textContent = question.type === "multiple" ? "多選題" : "單選題";
  elements.currentQuestionId.textContent = `題號：${question.id}`;
  elements.currentQuestionText.textContent = question.question;
  elements.previousQuestionButton.disabled = quizSession.currentIndex === 0;
  elements.nextQuestionButton.disabled = quizSession.currentIndex === quizSession.questions.length - 1;
  renderOptions(question);
}

/**
 * Renders answer options for the active question.
 * @param {Object} question
 * @returns {void}
 */
function renderOptions(question) {
  clearElement(elements.optionList);
  const inputType = question.type === "multiple" ? "checkbox" : "radio";
  const savedAnswers = quizSession.answers[question.id] || [];

  Object.entries(question.options).forEach(([key, text]) => {
    const label = document.createElement("label");
    label.className = "option-item";
    const input = document.createElement("input");
    input.type = inputType;
    input.name = `question-${question.id}`;
    input.value = key;
    input.checked = savedAnswers.includes(key);
    input.addEventListener("change", () => saveCurrentAnswer(question));
    const span = document.createElement("span");
    span.textContent = `${key}. ${text}`;
    label.append(input, span);
    elements.optionList.append(label);
  });
}

/**
 * Saves the selected answers for the current question.
 * @param {Object} question
 * @returns {void}
 */
function saveCurrentAnswer(question) {
  const selectedAnswers = [...elements.optionList.querySelectorAll("input:checked")].map((input) => input.value);
  setQuestionAnswer(quizSession, question.id, selectedAnswers);
}

/**
 * Submits the quiz, scores it, and updates localStorage records.
 * @returns {void}
 */
function submitQuiz() {
  if (!quizSession || !confirm("確定要交卷？交卷後會計分並更新錯題紀錄。")) {
    return;
  }
  const fullScore = Number(elements.fullScoreInput.value) || 100;
  const result = scoreQuiz(quizSession.questions, quizSession.answers, fullScore);
  updateWrongRecords(result.details);
  addHistory({
    id: `H-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    fullScore,
    totalScore: result.totalScore,
    correctCount: result.correctCount,
    wrongCount: result.wrongCount,
    accuracy: result.accuracy,
    questionCount: quizSession.questions.length
  });
  renderResult(result);
  refreshAll();
  showView("resultView");
}

/**
 * Renders score summary and per-question review.
 * @param {Object} result
 * @returns {void}
 */
function renderResult(result) {
  elements.resultSummaryBadge.textContent = `${formatNumber(result.totalScore)} 分`;
  elements.scoreSummary.replaceChildren(
    createScoreCard("總分", `${formatNumber(result.totalScore)} / ${formatNumber(result.fullScore)}`),
    createScoreCard("答對題數", `${result.correctCount}`),
    createScoreCard("答錯題數", `${result.wrongCount}`),
    createScoreCard("正確率", `${formatNumber(result.accuracy)}%`)
  );

  clearElement(elements.resultList);
  result.details.forEach((detail, index) => {
    const item = document.createElement("article");
    item.className = `list-item ${detail.correct ? "is-correct" : "is-wrong"}`;
    const displayedCorrectAnswers = detail.correct
      ? formatAnswers(detail.correctAnswers)
      : formatOptionDescriptions(detail.question, detail.correctAnswers);
    item.innerHTML = `
      <h3>${index + 1}. ${escapeHtml(detail.question.question)}</h3>
      <p>結果：${detail.correct ? "答對" : "答錯"}</p>
      <p>我的答案：${escapeHtml(formatAnswers(detail.userAnswers))}</p>
      <p>正確答案：${escapeHtml(displayedCorrectAnswers)}</p>
    `;
    elements.resultList.append(item);
  });
}

/**
 * Formats answer letters with their option descriptions.
 * @param {Object} question
 * @param {Array<string>} answers
 * @returns {string}
 */
function formatOptionDescriptions(question, answers) {
  return answers
    .map((answer) => `${answer}. ${question.options[answer] || ""}`.trim())
    .join("；");
}

/**
 * Creates a score summary card.
 * @param {string} label
 * @param {string} value
 * @returns {HTMLElement}
 */
function createScoreCard(label, value) {
  const card = document.createElement("div");
  card.className = "score-card";
  card.innerHTML = `<span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>`;
  return card;
}

/**
 * Refreshes all non-quiz panels.
 * @returns {void}
 */
function refreshAll() {
  const questions = getQuestions();
  const wrongItems = getWrongBookItems(questions);
  elements.questionBankCount.textContent = `題庫 ${questions.length} 題`;
  elements.wrongCount.textContent = `錯題 ${wrongItems.length} 題`;
  elements.bankPreviewCount.textContent = `${questions.length} 題`;
  elements.availableQuestionCount.textContent = `可抽 ${questions.length} 題`;
  renderQuestionPreview(questions);
  renderWrongBook(wrongItems);
  renderHistory();
}

/**
 * Renders the full question bank preview.
 * @param {Array} questions
 * @returns {void}
 */
function renderQuestionPreview(questions) {
  clearElement(elements.questionPreviewList);
  if (!questions.length) {
    elements.questionPreviewList.append(createEmptyState("尚未匯入題庫。"));
    return;
  }
  questions.forEach((question) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <h3>${escapeHtml(question.id)}. ${escapeHtml(question.question)}</h3>
      <p>A. ${escapeHtml(question.options.A)}</p>
      <p>B. ${escapeHtml(question.options.B)}</p>
      <p>C. ${escapeHtml(question.options.C)}</p>
      <p>D. ${escapeHtml(question.options.D)}</p>
      <p>答案：${escapeHtml(formatAnswers(question.answers))}｜${question.type === "multiple" ? "多選" : "單選"}</p>
    `;
    elements.questionPreviewList.append(item);
  });
}

/**
 * Renders the wrong-book list and actions.
 * @param {Array} wrongItems
 * @returns {void}
 */
function renderWrongBook(wrongItems) {
  elements.wrongBookCount.textContent = `${wrongItems.length} 題`;
  elements.practiceWrongButton.disabled = wrongItems.length === 0;
  elements.clearAllWrongButton.disabled = wrongItems.length === 0;
  clearElement(elements.wrongBookList);
  if (!wrongItems.length) {
    elements.wrongBookList.append(createEmptyState("目前沒有錯題紀錄。"));
    return;
  }

  wrongItems.forEach((item) => {
    const row = document.createElement("article");
    row.className = `list-item ${item.isImportant ? "is-highlight" : ""}`;
    row.innerHTML = `
      <h3>${escapeHtml(item.question.question)}</h3>
      <p>題號：${escapeHtml(item.questionId)}</p>
      <p>我的答案：${escapeHtml(formatAnswers(item.userAnswers))}</p>
      <p>正確答案：${escapeHtml(formatOptionDescriptions(item.question, item.correctAnswers))}</p>
      <p>錯誤次數：${item.errorCount} ${item.isImportant ? "<span class=\"focus-note\">【★★★★★ 重點提醒】</span>" : ""}</p>
    `;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "清除單題錯題紀錄";
    button.addEventListener("click", () => {
      clearWrongRecord(item.questionId);
      refreshAll();
    });
    row.append(button);
    elements.wrongBookList.append(row);
  });
}

/**
 * Renders recent quiz histories.
 * @returns {void}
 */
function renderHistory() {
  const histories = getHistories();
  elements.historyCount.textContent = `${histories.length} 次`;
  clearElement(elements.historyList);
  if (!histories.length) {
    elements.historyList.append(createEmptyState("尚無作答紀錄。"));
    return;
  }
  histories.forEach((history) => {
    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <h3>${escapeHtml(new Date(history.createdAt).toLocaleString())}</h3>
      <p>題數：${history.questionCount}｜總分：${formatNumber(history.totalScore)} / ${formatNumber(history.fullScore)}</p>
      <p>答對：${history.correctCount}｜答錯：${history.wrongCount}｜正確率：${formatNumber(history.accuracy)}%</p>
    `;
    elements.historyList.append(item);
  });
}

/**
 * Formats a number for compact display.
 * @param {number} value
 * @returns {string}
 */
function formatNumber(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

/**
 * Escapes text before inserting into HTML strings.
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = String(value);
  return div.innerHTML;
}

window.quizSystemModuleLoaded = true;
initApp();






